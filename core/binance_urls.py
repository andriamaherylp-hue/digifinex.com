from django.urls import path

from .views import binance_depth, binance_klines, binance_ticker, binance_tickers, binance_trades

urlpatterns = [
    path('ticker/', binance_ticker, name='binance_ticker'),
    path('tickers/', binance_tickers, name='binance_tickers'),
    path('klines/', binance_klines, name='binance_klines'),
    path('depth/', binance_depth, name='binance_depth'),
    path('trades/', binance_trades, name='binance_trades'),
]
