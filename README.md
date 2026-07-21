# Digifinexxx Django + React

Application web React servie par Django, avec interface fidèle aux captures fournies, contact client Telegram et données publiques Binance.

## Lancer le projet

```powershell
cd D:\Programmation\digifinexprod\digifinexxx
.\.venv\Scripts\activate
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Ouvrir ensuite :

```text
http://127.0.0.1:8000/
```

## Développement React

```powershell
cd frontend
npm install
npm run dev
```

Ou depuis le dossier principal :

```powershell
npm start
```

## Recompiler React pour Django

```powershell
cd frontend
npm install
npm run build
cd ..
python manage.py collectstatic --noinput
python manage.py runserver
```

## API Binance utilisées

Le backend Django expose des proxys vers les endpoints publics Binance suivants :

- `/api/binance/ticker/?symbol=BTCUSDT` → `GET https://api.binance.com/api/v3/ticker/24hr`
- `/api/binance/tickers/` → `GET https://api.binance.com/api/v3/ticker/24hr`
- `/api/binance/klines/?symbol=BTCUSDT&interval=1m&limit=1000` → `GET https://api.binance.com/api/v3/klines`
- `/api/binance/depth/?symbol=BTCUSDT&limit=50` → `GET https://api.binance.com/api/v3/depth`
- `/api/binance/trades/?symbol=BTCUSDT&limit=30` → `GET https://api.binance.com/api/v3/trades`

Le frontend utilise aussi les WebSockets publics Binance :

- `wss://stream.binance.com:9443/ws/btcusdt@kline_1m`
- `wss://stream.binance.com:9443/ws/!ticker@arr`
- `wss://stream.binance.com:9443/ws/btcusdt@depth`
- `wss://stream.binance.com:9443/ws/btcusdt@trade`

## Contact client

Le contact client est Telegram : `@Manage_digifinex`.
