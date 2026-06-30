from django.contrib import admin
from django.contrib import messages

from .models import (
    CapitalRecord,
    ClientProfile,
    Deposit,
    Wallet,
    Withdrawal,
    approve_deposit,
    approve_withdrawal,
    reject_deposit,
    reject_withdrawal,
)


@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'account_code', 'credit_score', 'is_verified', 'created_at')
    search_fields = ('user__username', 'full_name', 'account_code')
    list_filter = ('is_verified', 'created_at')


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'available_balance', 'frozen_balance', 'updated_at')
    search_fields = ('user__username',)


@admin.action(description='Approve selected deposits and update balance')
def approve_deposits(modeladmin, request, queryset):
    count = 0
    for deposit in queryset:
        approve_deposit(deposit, request.user)
        count += 1
    messages.success(request, f'{count} deposit(s) approved.')


@admin.action(description='Reject selected deposits')
def reject_deposits(modeladmin, request, queryset):
    count = 0
    for deposit in queryset:
        reject_deposit(deposit, request.user)
        count += 1
    messages.success(request, f'{count} deposit(s) rejected.')


@admin.register(Deposit)
class DepositAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'network', 'status', 'created_by', 'reviewed_by', 'created_at')
    search_fields = ('user__username', 'network', 'note')
    list_filter = ('status', 'network', 'created_at')
    actions = [approve_deposits, reject_deposits]


@admin.action(description='Approve selected withdrawals and deduct balance')
def approve_withdrawals(modeladmin, request, queryset):
    count = 0
    for withdrawal in queryset:
        try:
            approve_withdrawal(withdrawal, request.user)
            count += 1
        except ValueError as exc:
            messages.error(request, f'{withdrawal.user}: {exc}')
    messages.success(request, f'{count} withdrawal(s) approved.')


@admin.action(description='Reject selected withdrawals')
def reject_withdrawals(modeladmin, request, queryset):
    count = 0
    for withdrawal in queryset:
        reject_withdrawal(withdrawal, request.user)
        count += 1
    messages.success(request, f'{count} withdrawal(s) rejected.')


@admin.register(Withdrawal)
class WithdrawalAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'network', 'address', 'status', 'reviewed_by', 'created_at')
    search_fields = ('user__username', 'network', 'address', 'note')
    list_filter = ('status', 'network', 'created_at')
    actions = [approve_withdrawals, reject_withdrawals]


@admin.register(CapitalRecord)
class CapitalRecordAdmin(admin.ModelAdmin):
    list_display = ('user', 'record_type', 'amount', 'balance_after', 'status', 'created_by', 'created_at')
    search_fields = ('user__username', 'note')
    list_filter = ('record_type', 'status', 'created_at')
    readonly_fields = ('created_at',)
