
import React from "react";

export default function TradingAccountCard({order, onClose}) {
  return (
    <div className="trading-account-card">
      <h3>{order.email || order.username}</h3>
      <p>Account: {order.account_name || order.account_code}</p>
      <hr/>
      <p>Instrument: <b>{order.market_name}</b></p>
      <p>Type: <b>{order.side}</b></p>
      <p>Amount: ${order.amount}</p>
      <p>Entry price: {order.entry_price}</p>

      <select defaultValue="pending">
        <option value="pending">Select result</option>
        <option value="win">Gain</option>
        <option value="loss">Loss</option>
      </select>

      <input placeholder="Close price"/>

      <p>Duration: {order.duration_seconds}s</p>

      <button onClick={() => onClose && onClose(order.id)}>
        Close order
      </button>
    </div>
  );
}
