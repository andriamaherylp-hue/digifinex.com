from django.urls import path

from . import views

urlpatterns = [
    path('me/', views.app_me, name='app_me'),
    path('register/', views.app_register, name='app_register'),
    path('login/', views.app_login, name='app_login'),
    path('logout/', views.app_logout, name='app_logout'),
    path('records/', views.app_records, name='app_records'),

    path('deposit-request/', views.app_deposit_request, name='app_deposit_request'),
    path('withdrawal-request/', views.app_withdrawal_request, name='app_withdrawal_request'),

    path('trade/order/', views.app_trade_order, name='app_trade_order'),
    path('trade/expire/', views.app_trade_expire, name='app_trade_expire'),

    path('admin/clients/', views.app_admin_clients, name='app_admin_clients'),
    path('admin/create-client/', views.app_admin_create_client, name='app_admin_create_client'),
    path('admin/delete-client/', views.app_admin_delete_client, name='app_admin_delete_client'),
    path('admin/deposits/', views.app_admin_deposits, name='app_admin_deposits'),
    path('admin/add-deposit/', views.app_admin_add_deposit, name='app_admin_add_deposit'),
    path('admin/withdrawals/', views.app_admin_withdrawals, name='app_admin_withdrawals'),
    path('admin/review/', views.app_admin_review_money, name='app_admin_review_money'),

    path('admin/trades/', views.app_admin_trades, name='app_admin_trades'),
    path('admin/close-trade/', views.app_admin_close_trade, name='app_admin_close_trade'),
    path('admin/adjust-balance/', views.app_admin_adjust_balance, name='app_admin_adjust_balance'),
]
