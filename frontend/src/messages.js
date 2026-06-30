const MESSAGES_EN = {
  languageName: 'English',
  loginSuccess: 'Login successful',
  loginError: 'Incorrect account or password',
  registerSuccess: 'Account created successfully',
  registerError: 'Unable to create account',
  depositSent: 'Deposit request submitted successfully. Waiting for admin approval.',
  withdrawalSent: 'Withdrawal request submitted successfully. Waiting for admin approval.',
  clientCreated: 'Client account created successfully',
  clientDeleted: 'Client account deleted successfully',
  deleteClient: 'Delete account',
  deleteClientConfirm: 'Delete this client account? This action cannot be undone.',
  depositApproved: 'Deposit approved and balance updated',
  approved: 'Approved',
  rejected: 'Rejected',
  adminOnly: 'Admin access required',
  balanceAdjusted: 'Balance adjusted successfully',
  orderPlaced: 'Order placed successfully',
  orderClosed: 'Order closed successfully',
  orderAutoLost: 'Order expired and was automatically lost.',
  insufficientBalance: 'Insufficient balance',
  serverError: 'Server error. Please try again later.',
  selectDepositClient: 'Please select the deposit account first.',
  selectAdjustClient: 'Please select a client first.',
  enterAmount: 'Please enter an amount.',
  depositTarget: 'Deposit target account',
  selectedAccount: 'Selected account',
  availableBalance: 'Available balance',
  orderRecord: 'Order Record',
  positionList: 'Position List',
  closePositionRecord: 'Close Position Record',
  orderNumber: 'Order Number',
  amount: 'Amount',
  profitAndLoss: 'Profit and Loss',
  purchasePrice: 'Purchase Price',
  transactionPrice: 'Transaction Price',
  holdingTime: 'Holding Time',
  closeTime: 'Close Time',
  noOrderRecord: 'No order record',
  buy: 'Buy',
  sell: 'Sell',
}

export function resolveLanguage() {
  return 'en'
}

export const APP_LANGUAGE = 'en'
export const M = MESSAGES_EN
