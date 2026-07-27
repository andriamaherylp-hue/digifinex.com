# Multi-account trade card controls

The admin's open-trade area now manages every trading account independently inside its own card.

Each open-order card contains:

- Result type: Win or Loss
- Profit/Loss amount: for example `100` or `-50`
- Close price
- A close button that affects only that card/order

The API now validates that winning P/L values are positive, losing P/L values are negative, the close price is positive, and a loss does not exceed the traded amount.
