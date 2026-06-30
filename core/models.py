from decimal import Decimal
import secrets
import string

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models, transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

User = get_user_model()


def make_account_code():
    alphabet = string.ascii_uppercase + string.digits
    return 'YH' + ''.join(secrets.choice(alphabet) for _ in range(6))


class ClientProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='client_profile'
    )
    full_name = models.CharField(max_length=150, blank=True)
    account_code = models.CharField(max_length=20, unique=True, default=make_account_code)
    credit_score = models.PositiveIntegerField(default=100)
    is_verified = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='created_clients'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.username} - {self.account_code}'


class Wallet(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wallet'
    )
    available_balance = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal('0.00')
    )
    frozen_balance = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal('0.00')
    )
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total_assets(self):
        return self.available_balance + self.frozen_balance

    def __str__(self):
        return f'{self.user.username}: {self.available_balance}'


class MoneyRequest(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    NETWORK_CHOICES = [
        ('USDT-TRC20', 'USDT-TRC20'),
        ('USDT-ERC20', 'USDT-ERC20'),
        ('BTC', 'BTC'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    network = models.CharField(max_length=30, choices=NETWORK_CHOICES, default='USDT-TRC20')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    note = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='%(class)s_created'
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='%(class)s_reviewed'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']


class Deposit(MoneyRequest):
    def __str__(self):
        return f'Deposit {self.user.username} {self.amount} {self.status}'


class Withdrawal(MoneyRequest):
    address = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f'Withdrawal {self.user.username} {self.amount} {self.status}'


class CapitalRecord(models.Model):
    TYPE_DEPOSIT = 'deposit'
    TYPE_WITHDRAWAL = 'withdrawal'
    TYPE_ADJUSTMENT = 'adjustment'
    TYPE_TRADE = 'trade'

    TYPE_CHOICES = [
        (TYPE_DEPOSIT, 'Deposit'),
        (TYPE_WITHDRAWAL, 'Withdrawal'),
        (TYPE_ADJUSTMENT, 'Adjustment'),
        (TYPE_TRADE, 'Trade'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='capital_records'
    )
    record_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    balance_after = models.DecimalField(max_digits=14, decimal_places=2)
    status = models.CharField(max_length=20, default='approved')
    note = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='capital_records_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} {self.record_type} {self.amount}'


class TradeOrder(models.Model):
    SIDE_BUY = 'buy'
    SIDE_SELL = 'sell'

    STATUS_OPEN = 'open'
    STATUS_CLOSED = 'closed'
    STATUS_CANCELLED = 'cancelled'

    RESULT_PENDING = 'pending'
    RESULT_WIN = 'win'
    RESULT_LOSS = 'loss'
    RESULT_DRAW = 'draw'

    SIDE_CHOICES = [
        (SIDE_BUY, 'Buy'),
        (SIDE_SELL, 'Sell'),
    ]

    STATUS_CHOICES = [
        (STATUS_OPEN, 'Open'),
        (STATUS_CLOSED, 'Closed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    RESULT_CHOICES = [
        (RESULT_PENDING, 'Pending'),
        (RESULT_WIN, 'Win'),
        (RESULT_LOSS, 'Loss'),
        (RESULT_DRAW, 'Draw'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='trade_orders'
    )
    market_name = models.CharField(max_length=50)
    api_symbol = models.CharField(max_length=30, default='BTCUSDT')
    side = models.CharField(max_length=10, choices=SIDE_CHOICES)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    duration_seconds = models.PositiveIntegerField(default=900)
    entry_price = models.DecimalField(max_digits=18, decimal_places=8, default=Decimal('0.00'))
    close_price = models.DecimalField(max_digits=18, decimal_places=8, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_OPEN)
    result = models.CharField(max_length=20, choices=RESULT_CHOICES, default=RESULT_PENDING)
    profit_loss = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='trade_orders_created'
    )
    closed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='trade_orders_closed'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} {self.market_name} {self.side} {self.amount} {self.status}'


@receiver(post_save, sender=User)
def create_user_finance(sender, instance, created, **kwargs):
    if not created:
        return

    ClientProfile.objects.get_or_create(
        user=instance,
        defaults={'full_name': instance.get_full_name() or instance.username}
    )
    Wallet.objects.get_or_create(user=instance)


def approve_deposit(deposit, admin_user=None):
    with transaction.atomic():
        deposit = Deposit.objects.select_for_update().get(pk=deposit.pk)

        if deposit.status == Deposit.STATUS_APPROVED:
            return deposit

        wallet, _ = Wallet.objects.select_for_update().get_or_create(user=deposit.user)
        wallet.available_balance += deposit.amount
        wallet.save(update_fields=['available_balance', 'updated_at'])

        deposit.status = Deposit.STATUS_APPROVED
        deposit.reviewed_by = admin_user
        deposit.reviewed_at = timezone.now()
        deposit.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'updated_at'])

        CapitalRecord.objects.create(
            user=deposit.user,
            record_type=CapitalRecord.TYPE_DEPOSIT,
            amount=deposit.amount,
            balance_after=wallet.available_balance,
            status=deposit.status,
            note=deposit.note or 'Deposit approved by admin',
            created_by=admin_user,
        )

        return deposit


def reject_deposit(deposit, admin_user=None):
    deposit.status = Deposit.STATUS_REJECTED
    deposit.reviewed_by = admin_user
    deposit.reviewed_at = timezone.now()
    deposit.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'updated_at'])
    return deposit


def approve_withdrawal(withdrawal, admin_user=None):
    with transaction.atomic():
        withdrawal = Withdrawal.objects.select_for_update().get(pk=withdrawal.pk)

        if withdrawal.status == Withdrawal.STATUS_APPROVED:
            return withdrawal

        wallet, _ = Wallet.objects.select_for_update().get_or_create(user=withdrawal.user)

        if wallet.available_balance < withdrawal.amount:
            raise ValueError('Insufficient balance.')

        wallet.available_balance -= withdrawal.amount
        wallet.save(update_fields=['available_balance', 'updated_at'])

        withdrawal.status = Withdrawal.STATUS_APPROVED
        withdrawal.reviewed_by = admin_user
        withdrawal.reviewed_at = timezone.now()
        withdrawal.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'updated_at'])

        CapitalRecord.objects.create(
            user=withdrawal.user,
            record_type=CapitalRecord.TYPE_WITHDRAWAL,
            amount=-withdrawal.amount,
            balance_after=wallet.available_balance,
            status=withdrawal.status,
            note=withdrawal.note or 'Withdrawal approved by admin',
            created_by=admin_user,
        )

        return withdrawal


def reject_withdrawal(withdrawal, admin_user=None):
    withdrawal.status = Withdrawal.STATUS_REJECTED
    withdrawal.reviewed_by = admin_user
    withdrawal.reviewed_at = timezone.now()
    withdrawal.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'updated_at'])
    return withdrawal