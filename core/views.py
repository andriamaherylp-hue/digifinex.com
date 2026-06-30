from pathlib import Path
from datetime import timedelta
import re
import json
from decimal import Decimal, InvalidOperation

import requests
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login as django_login, logout as django_logout
from django.db import transaction
from django.http import FileResponse, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from .models import (
    CapitalRecord,
    ClientProfile,
    Deposit,
    TradeOrder,
    Wallet,
    Withdrawal,
    approve_deposit,
    approve_withdrawal,
    reject_deposit,
    reject_withdrawal,
)

User = get_user_model()

BINANCE_BASE_URLS = ['https://api.binance.com', 'https://data-api.binance.vision']
DEFAULT_SYMBOL = 'BTCUSDT'
ALLOWED_INTERVALS = {'1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'}
ALLOWED_TRADE_DURATIONS = {300, 600, 900, 1200, 1500, 1800}
SYMBOL_RE = re.compile(r'^[A-Z0-9]{5,20}$')


@ensure_csrf_cookie
def index(request):
    candidates = [
        settings.BASE_DIR / 'core' / 'static' / 'frontend' / 'index.html',
        Path(settings.STATIC_ROOT) / 'frontend' / 'index.html',
    ]
    for index_file in candidates:
        if index_file.exists():
            return FileResponse(index_file.open('rb'), content_type='text/html')
    return JsonResponse(
        {
            'error': 'Frontend not found.',
            'detail': 'Run `cd frontend && npm run build`, then restart Django.',
        },
        status=500,
    )


def _symbol(request):
    symbol = request.GET.get('symbol', DEFAULT_SYMBOL).upper().strip()
    if not SYMBOL_RE.match(symbol):
        return None
    return symbol


def _limit(request, default=100, maximum=1000):
    try:
        limit = int(request.GET.get('limit', default))
    except (TypeError, ValueError):
        limit = default
    return max(1, min(limit, maximum))


def _binance_get(path, params=None, timeout=10):
    last_error = None
    for base_url in BINANCE_BASE_URLS:
        try:
            response = requests.get(f'{base_url}{path}', params=params or {}, timeout=timeout)
            response.raise_for_status()
            return response.json(), base_url
        except requests.RequestException as exc:
            last_error = exc
    raise RuntimeError(str(last_error))

@require_GET
def binance_ticker(request):
    symbol = _symbol(request)
    if not symbol:
        return JsonResponse({'error': 'Invalid symbol'}, status=400)

    try:
        ticker, base_url = _binance_get('/api/v3/ticker/24hr', {'symbol': symbol})
        time_data, _ = _binance_get('/api/v3/time')
    except RuntimeError as exc:
        return JsonResponse({'error': 'Unable to reach Binance', 'detail': str(exc), 'symbol': symbol}, status=502)

    return JsonResponse(
        {
            'symbol': ticker.get('symbol', symbol),
            'price': ticker.get('lastPrice'),
            'lastPrice': ticker.get('lastPrice'),
            'priceChange': ticker.get('priceChange'),
            'priceChangePercent': ticker.get('priceChangePercent'),
            'highPrice': ticker.get('highPrice'),
            'lowPrice': ticker.get('lowPrice'),
            'volume': ticker.get('volume'),
            'quoteVolume': ticker.get('quoteVolume'),
            'openTime': ticker.get('openTime'),
            'closeTime': ticker.get('closeTime'),
            'serverTime': time_data.get('serverTime'),
            'source': 'Binance public market data API',
            'apiBaseUrl': base_url,
        }
    )


@require_GET
def binance_tickers(request):
    try:
        tickers, base_url = _binance_get('/api/v3/ticker/24hr')
    except RuntimeError as exc:
        return JsonResponse({'error': 'Unable to reach Binance', 'detail': str(exc)}, status=502)
    return JsonResponse({'tickers': tickers, 'source': 'Binance public market data API', 'apiBaseUrl': base_url})


@require_GET
def binance_klines(request):
    symbol = _symbol(request)
    interval = request.GET.get('interval', '1m').strip()
    limit = _limit(request, default=1000, maximum=1000)
    if not symbol:
        return JsonResponse({'error': 'Invalid symbol'}, status=400)
    if interval not in ALLOWED_INTERVALS:
        return JsonResponse({'error': 'Invalid interval', 'allowed': sorted(ALLOWED_INTERVALS)}, status=400)

    try:
        klines, base_url = _binance_get('/api/v3/klines', {'symbol': symbol, 'interval': interval, 'limit': limit})
    except RuntimeError as exc:
        return JsonResponse({'error': 'Unable to reach Binance', 'detail': str(exc), 'symbol': symbol}, status=502)
    return JsonResponse({'klines': klines, 'symbol': symbol, 'interval': interval, 'limit': limit, 'apiBaseUrl': base_url})


@require_GET
def binance_depth(request):
    symbol = _symbol(request)
    limit = _limit(request, default=50, maximum=5000)
    allowed_depth_limits = [5, 10, 20, 50, 100, 500, 1000, 5000]
    limit = min(allowed_depth_limits, key=lambda value: abs(value - limit))
    if not symbol:
        return JsonResponse({'error': 'Invalid symbol'}, status=400)

    try:
        depth, base_url = _binance_get('/api/v3/depth', {'symbol': symbol, 'limit': limit})
    except RuntimeError as exc:
        return JsonResponse({'error': 'Unable to reach Binance', 'detail': str(exc), 'symbol': symbol}, status=502)
    depth['symbol'] = symbol
    depth['limit'] = limit
    depth['apiBaseUrl'] = base_url
    return JsonResponse(depth)


@require_GET
def binance_trades(request):
    symbol = _symbol(request)
    limit = _limit(request, default=30, maximum=1000)
    if not symbol:
        return JsonResponse({'error': 'Invalid symbol'}, status=400)

    try:
        trades, base_url = _binance_get('/api/v3/trades', {'symbol': symbol, 'limit': limit})
    except RuntimeError as exc:
        return JsonResponse({'error': 'Unable to reach Binance', 'detail': str(exc), 'symbol': symbol}, status=502)
    return JsonResponse({'trades': trades, 'symbol': symbol, 'limit': limit, 'apiBaseUrl': base_url})


def _json_body(request):
    try:
        return json.loads(request.body.decode('utf-8') or '{}')
    except json.JSONDecodeError:
        return {}


def _money(value, default='0.00'):
    raw = str(value if value not in (None, '') else default)
    raw = raw.replace(',', '').replace(' ', '').strip()
    try:
        amount = Decimal(raw)
    except (InvalidOperation, ValueError):
        amount = Decimal(default)
    return amount.quantize(Decimal('0.01'))


def _price(value, default='0.00'):
    raw = str(value if value not in (None, '') else default)
    raw = raw.replace(',', '').replace(' ', '').strip()
    try:
        amount = Decimal(raw)
    except (InvalidOperation, ValueError):
        amount = Decimal(default)
    return amount.quantize(Decimal('0.00000001'))


def _is_staff(user):
    return bool(user and user.is_authenticated and user.is_staff)


def _wallet_for(user):
    wallet, _ = Wallet.objects.get_or_create(user=user)
    return wallet


def _profile_for(user):
    profile, _ = ClientProfile.objects.get_or_create(user=user, defaults={'full_name': user.get_full_name() or user.username})
    return profile


def _local_iso(value):
    if not value:
        return None
    return timezone.localtime(value).isoformat()


def _user_payload(user):
    profile = _profile_for(user)
    wallet = _wallet_for(user)
    return {
        'id': user.id,
        'username': user.username,
        'full_name': profile.full_name or user.get_full_name() or user.username,
        'account_code': profile.account_code,
        'credit_score': profile.credit_score,
        'is_verified': profile.is_verified,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'wallet': {
            'available_balance': str(wallet.available_balance),
            'frozen_balance': str(wallet.frozen_balance),
            'total_assets': str(wallet.total_assets),
        },
    }


def _deposit_payload(item):
    return {
        'id': item.id,
        'user_id': item.user_id,
        'username': item.user.username,
        'amount': str(item.amount),
        'network': item.network,
        'status': item.status,
        'note': item.note,
        'created_at': _local_iso(item.created_at),
        'reviewed_at': _local_iso(item.reviewed_at),
    }


def _withdrawal_payload(item):
    data = _deposit_payload(item)
    data['address'] = item.address
    return data


def _capital_payload(item):
    return {
        'id': item.id,
        'record_type': item.record_type,
        'amount': str(item.amount),
        'balance_after': str(item.balance_after),
        'status': item.status,
        'note': item.note,
        'created_at': _local_iso(item.created_at),
    }




def _trade_payload(item):
    return {
        'id': item.id,
        'user_id': item.user_id,
        'username': item.user.username,
        'market_name': item.market_name,
        'api_symbol': item.api_symbol,
        'side': item.side,
        'amount': str(item.amount),
        'duration_seconds': item.duration_seconds,
        'entry_price': str(item.entry_price),
        'close_price': str(item.close_price) if item.close_price is not None else None,
        'status': item.status,
        'result': item.result,
        'profit_loss': str(item.profit_loss),
        'created_at': _local_iso(item.created_at),
        'closed_at': _local_iso(item.closed_at),
    }


def _close_trade_as_auto_loss(order):
    """Close an expired open order as a loss when no admin approval was given in time."""
    wallet, _ = Wallet.objects.select_for_update().get_or_create(user=order.user)

    wallet.frozen_balance = max(Decimal('0.00'), wallet.frozen_balance - order.amount)
    wallet.save(update_fields=['frozen_balance', 'updated_at'])

    loss_amount = -order.amount

    order.status = TradeOrder.STATUS_CLOSED
    order.result = TradeOrder.RESULT_LOSS
    order.profit_loss = loss_amount
    order.close_price = order.entry_price
    order.closed_by = None
    order.closed_at = timezone.now()
    order.save(update_fields=['status', 'result', 'profit_loss', 'close_price', 'closed_by', 'closed_at'])

    CapitalRecord.objects.create(
        user=order.user,
        record_type=CapitalRecord.TYPE_TRADE,
        amount=loss_amount,
        balance_after=wallet.available_balance,
        status='auto_lost',
        note=f'Trade expired without admin approval: {order.market_name} {order.side} loss',
        created_by=None,
    )

    return order


def _auto_close_expired_orders(user):
    now = timezone.now()

    with transaction.atomic():
        orders = TradeOrder.objects.select_for_update().filter(
            user=user,
            status=TradeOrder.STATUS_OPEN,
        )

        for order in orders:
            end_time = order.created_at + timedelta(seconds=order.duration_seconds)
            if end_time <= now:
                _close_trade_as_auto_loss(order)




def _auto_close_all_expired_orders():
    now = timezone.now()

    with transaction.atomic():
        orders = (
            TradeOrder.objects
            .select_for_update()
            .select_related('user')
            .filter(status=TradeOrder.STATUS_OPEN)
        )

        for order in orders:
            end_time = order.created_at + timedelta(seconds=order.duration_seconds)
            if end_time <= now:
                _close_trade_as_auto_loss(order)

def _require_auth(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    return None


def _require_staff(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error
    if not request.user.is_staff:
        return JsonResponse({'error': 'Admin access required'}, status=403)
    return None


@require_GET
def app_me(request):
    if not request.user.is_authenticated:
        return JsonResponse({'authenticated': False, 'is_staff': False})
    return JsonResponse({'authenticated': True, 'user': _user_payload(request.user), 'is_staff': request.user.is_staff})


@require_POST
def app_register(request):
    data = _json_body(request)
    username = str(data.get('username', '')).strip()
    password = str(data.get('password', '')).strip()
    full_name = str(data.get('full_name', '')).strip()
    if len(username) < 3:
        return JsonResponse({'error': 'The account name must contain at least 3 characters.'}, status=400)
    if len(password) < 4:
        return JsonResponse({'error': 'The password must contain at least 4 characters.'}, status=400)
    if User.objects.filter(username__iexact=username).exists():
        return JsonResponse({'error': 'This account already exists.'}, status=400)
    user = User.objects.create_user(username=username, password=password, first_name=full_name)
    profile = _profile_for(user)
    profile.full_name = full_name or username
    profile.save(update_fields=['full_name'])
    django_login(request, user)
    return JsonResponse({'authenticated': True, 'user': _user_payload(user)})


@require_POST
def app_login(request):
    data = _json_body(request)
    username = str(data.get('username', '')).strip()
    password = str(data.get('password', '')).strip()
    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({'error': 'Incorrect account or password.'}, status=400)
    if not user.is_active:
        return JsonResponse({'error': 'This account is disabled.'}, status=403)
    django_login(request, user)
    return JsonResponse({'authenticated': True, 'user': _user_payload(user)})


@require_POST
def app_logout(request):
    django_logout(request)
    return JsonResponse({'ok': True})


@require_GET
def app_records(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    _auto_close_expired_orders(request.user)

    deposits = Deposit.objects.filter(user=request.user).select_related('user')[:100]
    withdrawals = Withdrawal.objects.filter(user=request.user).select_related('user')[:100]
    capital = CapitalRecord.objects.filter(user=request.user).select_related('user')[:100]
    trades = TradeOrder.objects.filter(user=request.user).select_related('user')[:100]

    return JsonResponse({
        'user': _user_payload(request.user),
        'deposits': [_deposit_payload(item) for item in deposits],
        'withdrawals': [_withdrawal_payload(item) for item in withdrawals],
        'capital': [_capital_payload(item) for item in capital],
        'trades': [_trade_payload(item) for item in trades],
    })


@require_POST
def app_deposit_request(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error
    data = _json_body(request)
    amount = _money(data.get('amount'))
    network = str(data.get('network') or 'USDT-TRC20').strip()
    if amount <= 0:
        return JsonResponse({'error': 'Invalid amount.'}, status=400)
    deposit = Deposit.objects.create(
        user=request.user,
        amount=amount,
        network=network,
        status=Deposit.STATUS_PENDING,
        note='Client deposit request from web app',
        created_by=request.user,
    )
    return JsonResponse({'ok': True, 'deposit': _deposit_payload(deposit), 'message': 'Your deposit is waiting for admin approval.'})


@require_POST
def app_withdrawal_request(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error
    data = _json_body(request)
    amount = _money(data.get('amount'))
    network = str(data.get('network') or 'USDT-TRC20').strip()
    address = str(data.get('address') or '').strip()
    if amount <= 0:
        return JsonResponse({'error': 'Invalid amount.'}, status=400)
    if not address:
        return JsonResponse({'error': 'Address is required.'}, status=400)
    wallet = _wallet_for(request.user)
    if wallet.available_balance < amount:
        return JsonResponse({'error': 'Insufficient balance.'}, status=400)
    withdrawal = Withdrawal.objects.create(
        user=request.user,
        amount=amount,
        network=network,
        address=address,
        status=Withdrawal.STATUS_PENDING,
        note='Client withdrawal request from web app',
        created_by=request.user,
    )
    return JsonResponse({'ok': True, 'withdrawal': _withdrawal_payload(withdrawal), 'message': 'Your withdrawal is waiting for admin approval.'})


@require_GET
def app_admin_clients(request):
    staff_error = _require_staff(request)
    if staff_error:
        return staff_error
    users = User.objects.select_related('wallet', 'client_profile').filter(is_staff=False).order_by('-date_joined')[:300]
    return JsonResponse({'clients': [_user_payload(user) for user in users]})


@require_POST
def app_admin_create_client(request):
    staff_error = _require_staff(request)
    if staff_error:
        return staff_error
    data = _json_body(request)
    username = str(data.get('username', '')).strip()
    password = str(data.get('password', '')).strip() or '123456'
    full_name = str(data.get('full_name', '')).strip()
    initial_deposit = _money(data.get('initial_deposit', '0'))
    if len(username) < 3:
        return JsonResponse({'error': 'Invalid account name.'}, status=400)
    if User.objects.filter(username__iexact=username).exists():
        return JsonResponse({'error': 'This account already exists.'}, status=400)
    user = User.objects.create_user(username=username, password=password, first_name=full_name)
    profile = _profile_for(user)
    profile.full_name = full_name or username
    profile.created_by = request.user
    profile.save(update_fields=['full_name', 'created_by'])
    if initial_deposit > 0:
        deposit = Deposit.objects.create(
            user=user,
            amount=initial_deposit,
            network=str(data.get('network') or 'USDT-TRC20'),
            status=Deposit.STATUS_PENDING,
            note='Initial deposit created by admin',
            created_by=request.user,
        )
        approve_deposit(deposit, request.user)
    return JsonResponse({'ok': True, 'client': _user_payload(user)})


@require_POST
def app_admin_delete_client(request):
    staff_error = _require_staff(request)
    if staff_error:
        return staff_error

    data = _json_body(request)
    user_id = data.get('user_id')

    try:
        user = User.objects.get(pk=user_id, is_staff=False, is_superuser=False)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Client not found.'}, status=404)

    if user.pk == request.user.pk:
        return JsonResponse({'error': 'You cannot delete the currently connected account.'}, status=400)

    username = user.username
    user.delete()

    return JsonResponse({'ok': True, 'message': 'Client account deleted successfully.', 'username': username})


@require_GET
def app_admin_deposits(request):
    staff_error = _require_staff(request)
    if staff_error:
        return staff_error
    deposits = Deposit.objects.select_related('user').all()[:300]
    return JsonResponse({'deposits': [_deposit_payload(item) for item in deposits]})


@require_POST
def app_admin_add_deposit(request):
    staff_error = _require_staff(request)
    if staff_error:
        return staff_error
    data = _json_body(request)
    user_id = data.get('user_id')
    amount = _money(data.get('amount'))
    network = str(data.get('network') or 'USDT-TRC20').strip()
    auto_approve = bool(data.get('auto_approve', True))

    if not user_id:
        return JsonResponse({'error': 'Please select the deposit account first.'}, status=400)
    if amount <= 0:
        return JsonResponse({'error': 'Invalid amount.'}, status=400)

    try:
        user = User.objects.get(pk=user_id, is_staff=False, is_superuser=False)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Client not found.'}, status=404)

    deposit = Deposit.objects.create(
        user=user,
        amount=amount,
        network=network,
        status=Deposit.STATUS_PENDING,
        note=str(data.get('note') or 'Approved deposit added by admin'),
        created_by=request.user,
    )
    if auto_approve:
        deposit = approve_deposit(deposit, request.user)
    return JsonResponse({'ok': True, 'deposit': _deposit_payload(deposit), 'client': _user_payload(user)})


@require_GET
def app_admin_withdrawals(request):
    staff_error = _require_staff(request)
    if staff_error:
        return staff_error
    withdrawals = Withdrawal.objects.select_related('user').all()[:300]
    return JsonResponse({'withdrawals': [_withdrawal_payload(item) for item in withdrawals]})


@require_POST
def app_admin_review_money(request):
    staff_error = _require_staff(request)
    if staff_error:
        return staff_error
    data = _json_body(request)
    kind = str(data.get('kind') or '').strip()
    item_id = data.get('id')
    action = str(data.get('action') or '').strip()
    try:
        if kind == 'deposit':
            item = Deposit.objects.get(pk=item_id)
            item = approve_deposit(item, request.user) if action == 'approve' else reject_deposit(item, request.user)
            return JsonResponse({'ok': True, 'deposit': _deposit_payload(item), 'client': _user_payload(item.user)})
        if kind == 'withdrawal':
            item = Withdrawal.objects.get(pk=item_id)
            item = approve_withdrawal(item, request.user) if action == 'approve' else reject_withdrawal(item, request.user)
            return JsonResponse({'ok': True, 'withdrawal': _withdrawal_payload(item), 'client': _user_payload(item.user)})
    except (Deposit.DoesNotExist, Withdrawal.DoesNotExist):
        return JsonResponse({'error': 'Request not found.'}, status=404)
    except ValueError as exc:
        return JsonResponse({'error': str(exc)}, status=400)
    return JsonResponse({'error': 'Invalid action.'}, status=400)

@require_POST
def app_trade_order(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    data = _json_body(request)
    market_name = str(data.get('market_name') or 'XAU/USD').strip()
    api_symbol = str(data.get('api_symbol') or 'BTCUSDT').strip().upper()
    side = str(data.get('side') or '').strip().lower()
    amount = _money(data.get('amount'))
    entry_price = _price(data.get('entry_price'))

    try:
        duration_seconds = int(data.get('duration_seconds') or 900)
    except (TypeError, ValueError):
        duration_seconds = 900

    if duration_seconds not in ALLOWED_TRADE_DURATIONS:
        duration_seconds = 900

    if side not in [TradeOrder.SIDE_BUY, TradeOrder.SIDE_SELL]:
        return JsonResponse({'error': 'Invalid order side.'}, status=400)

    if amount <= 0:
        return JsonResponse({'error': 'Invalid amount.'}, status=400)

    with transaction.atomic():
        wallet, _ = Wallet.objects.select_for_update().get_or_create(user=request.user)

        if wallet.available_balance < amount:
            return JsonResponse({'error': 'Insufficient balance.'}, status=400)

        wallet.available_balance -= amount
        wallet.frozen_balance += amount
        wallet.save(update_fields=['available_balance', 'frozen_balance', 'updated_at'])

        order = TradeOrder.objects.create(
            user=request.user,
            market_name=market_name,
            api_symbol=api_symbol,
            side=side,
            amount=amount,
            duration_seconds=duration_seconds,
            entry_price=entry_price,
            created_by=request.user,
        )

    return JsonResponse({
        'ok': True,
        'message': 'Order placed successfully.',
        'order': _trade_payload(order),
        'user': _user_payload(request.user),
    })


@require_POST
def app_trade_expire(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    data = _json_body(request)
    order_id = data.get('id')

    try:
        with transaction.atomic():
            order = TradeOrder.objects.select_for_update().get(pk=order_id, user=request.user)

            if order.status == TradeOrder.STATUS_CLOSED:
                return JsonResponse({
                    'ok': True,
                    'expired': True,
                    'order': _trade_payload(order),
                    'user': _user_payload(request.user),
                })

            end_time = order.created_at + timedelta(seconds=order.duration_seconds)
            now = timezone.now()

            if end_time > now:
                remaining = int((end_time - now).total_seconds())
                return JsonResponse({
                    'ok': True,
                    'expired': False,
                    'remaining_seconds': remaining,
                    'order': _trade_payload(order),
                })

            order = _close_trade_as_auto_loss(order)

    except TradeOrder.DoesNotExist:
        return JsonResponse({'error': 'Order not found.'}, status=404)

    return JsonResponse({
        'ok': True,
        'expired': True,
        'message': 'Order expired and was automatically lost.',
        'order': _trade_payload(order),
        'user': _user_payload(request.user),
    })


@require_GET
def app_admin_trades(request):
    staff_error = _require_staff(request)
    if staff_error:
        return staff_error

    _auto_close_all_expired_orders()

    trades = TradeOrder.objects.select_related('user').all()[:500]
    return JsonResponse({'trades': [_trade_payload(item) for item in trades]})


@require_POST
def app_admin_close_trade(request):
    staff_error = _require_staff(request)
    if staff_error:
        return staff_error

    data = _json_body(request)
    order_id = data.get('id')
    result = str(data.get('result') or '').strip().lower()
    profit_loss = _money(data.get('profit_loss'))
    close_price = _price(data.get('close_price'))

    if result not in [TradeOrder.RESULT_WIN, TradeOrder.RESULT_LOSS, TradeOrder.RESULT_DRAW]:
        return JsonResponse({'error': 'Invalid trade result.'}, status=400)

    try:
        order = TradeOrder.objects.select_related('user').get(pk=order_id)
    except TradeOrder.DoesNotExist:
        return JsonResponse({'error': 'Order not found.'}, status=404)

    if order.status != TradeOrder.STATUS_OPEN:
        return JsonResponse({'error': 'This order is already closed.'}, status=400)

    with transaction.atomic():
        order = TradeOrder.objects.select_for_update().get(pk=order.pk)
        end_time = order.created_at + timedelta(seconds=order.duration_seconds)
        if end_time <= timezone.now():
            order = _close_trade_as_auto_loss(order)
            return JsonResponse({
                'error': 'This order has expired and was automatically lost.',
                'order': _trade_payload(order),
                'client': _user_payload(order.user),
            }, status=400)

        wallet, _ = Wallet.objects.select_for_update().get_or_create(user=order.user)

        wallet.frozen_balance = max(Decimal('0.00'), wallet.frozen_balance - order.amount)

        final_return = order.amount + profit_loss
        if final_return < 0:
            final_return = Decimal('0.00')

        wallet.available_balance += final_return
        wallet.save(update_fields=['available_balance', 'frozen_balance', 'updated_at'])

        order.status = TradeOrder.STATUS_CLOSED
        order.result = result
        order.profit_loss = profit_loss
        order.close_price = close_price
        order.closed_by = request.user
        order.closed_at = timezone.now()
        order.save(update_fields=['status', 'result', 'profit_loss', 'close_price', 'closed_by', 'closed_at'])

        CapitalRecord.objects.create(
            user=order.user,
            record_type=CapitalRecord.TYPE_TRADE,
            amount=profit_loss,
            balance_after=wallet.available_balance,
            status='approved',
            note=f'Trade closed by admin: {order.market_name} {order.side} {result}',
            created_by=request.user,
        )

    return JsonResponse({
        'ok': True,
        'message': 'Order closed successfully.',
        'order': _trade_payload(order),
        'client': _user_payload(order.user),
    })


@require_POST
def app_admin_adjust_balance(request):
    staff_error = _require_staff(request)
    if staff_error:
        return staff_error

    data = _json_body(request)
    user_id = data.get('user_id')
    amount = _money(data.get('amount'))
    note = str(data.get('note') or 'Admin balance adjustment').strip()

    try:
        user = User.objects.get(pk=user_id, is_staff=False)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Client not found.'}, status=404)

    with transaction.atomic():
        wallet, _ = Wallet.objects.select_for_update().get_or_create(user=user)
        new_balance = wallet.available_balance + amount

        if new_balance < 0:
            return JsonResponse({'error': 'Insufficient balance.'}, status=400)

        wallet.available_balance = new_balance
        wallet.save(update_fields=['available_balance', 'updated_at'])

        CapitalRecord.objects.create(
            user=user,
            record_type=CapitalRecord.TYPE_ADJUSTMENT,
            amount=amount,
            balance_after=wallet.available_balance,
            status='approved',
            note=note,
            created_by=request.user,
        )

    return JsonResponse({
        'ok': True,
        'message': 'Balance adjusted successfully.',
        'client': _user_payload(user),
    })

