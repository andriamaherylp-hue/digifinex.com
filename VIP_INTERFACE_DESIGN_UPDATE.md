# VIP interface design update

This update changes only the presentation of authenticated accounts where `is_vip` is enabled.

## Preserved without functional changes

- Existing pages, buttons, icons and navigation options
- Trading, deposit, withdrawal, orders and account logic
- API calls, Django views, models and database behaviour
- Rotating home banners and their variable text
- Regular-account design

## VIP visual improvements

- Cream, white and champagne-gold interface based on the selected reference
- Premium card borders, shadows and navigation highlights
- Gold/black assets summary card on the account page
- New shield-shaped VIP badge without “Level 6”
- VIP treatment applied automatically only when the account has `is_vip=true`
- The existing rotating banner remains visible and receives a VIP frame and badge

## Files changed

- `frontend/src/App.jsx`
- `frontend/src/styles.css`
- `frontend/src/assets/vip-badge.svg`
