export default function TradingAccountCard({
  order,
  index,
  remainingSeconds,
  form,
  onFieldChange,
  onClose,
  isClosing = false,
  formatMoney,
}) {
  const result = form?.result || 'win'
  const profitLoss = form?.profit_loss ?? ''
  const closePrice = form?.close_price ?? ''
  const numericProfitLoss = Number(profitLoss)
  const numericClosePrice = Number(closePrice)
  const hasValidProfitLoss = profitLoss !== '' && Number.isFinite(numericProfitLoss) && numericProfitLoss !== 0
  const hasValidClosePrice = closePrice !== '' && Number.isFinite(numericClosePrice) && numericClosePrice > 0
  const canClose = hasValidProfitLoss && hasValidClosePrice && !isClosing
  const side = String(order.side || '').toLowerCase()

  return (
    <article className="trade-account-card">
      <div className="trade-account-head">
        <div className="avatar" aria-hidden="true">{index + 1}</div>
        <div className="trade-account-identity">
          <b>{order.username}</b>
          <small>Account: {order.account_code || order.username}</small>
          <span>● Active</span>
        </div>
      </div>

      <div className="trade-line">
        <b>Instrument</b>
        <strong>{order.market_name}</strong>
      </div>
      <div className="trade-line">
        <b>Order type</b>
        <strong className={side === 'buy' ? 'admin-buy' : 'admin-sell'}>
          {side === 'buy' ? 'Buy' : 'Sell'}
        </strong>
      </div>
      <div className="trade-line">
        <b>Amount</b>
        <strong>${formatMoney(order.amount)}</strong>
      </div>
      <div className="trade-line">
        <b>Entry price</b>
        <strong>{order.entry_price}</strong>
      </div>

      <div className="trade-control">
        <label htmlFor={`result-${order.id}`}>Result type</label>
        <select
          id={`result-${order.id}`}
          value={result}
          onChange={(event) => onFieldChange(order.id, 'result', event.target.value)}
        >
          <option value="win">Win</option>
          <option value="loss">Loss</option>
        </select>
      </div>

      <div className="trade-control">
        <label htmlFor={`profit-loss-${order.id}`}>Profit/Loss</label>
        <input
          id={`profit-loss-${order.id}`}
          type="number"
          inputMode="decimal"
          step="0.01"
          value={profitLoss}
          onChange={(event) => onFieldChange(order.id, 'profit_loss', event.target.value)}
          placeholder="100 or -50"
        />
      </div>

      <div className="trade-control">
        <label htmlFor={`close-price-${order.id}`}>Close price</label>
        <input
          id={`close-price-${order.id}`}
          type="number"
          inputMode="decimal"
          step="0.00000001"
          min="0"
          value={closePrice}
          onChange={(event) => onFieldChange(order.id, 'close_price', event.target.value)}
          placeholder="Close price"
        />
      </div>

      <div className="trade-line">
        <b>Duration</b>
        <strong>{order.duration_seconds}s</strong>
      </div>
      <div className="trade-line">
        <b>Remaining</b>
        <strong className={`admin-countdown ${remainingSeconds <= 30 ? 'danger' : ''}`}>
          {remainingSeconds}s
        </strong>
      </div>

      <button
        type="button"
        className="close-trade-btn"
        disabled={!canClose}
        onClick={() => onClose(order.id)}
      >
        {isClosing ? 'Closing…' : '🔒 Close order'}
      </button>
    </article>
  )
}
