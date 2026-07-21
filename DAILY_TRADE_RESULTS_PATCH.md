# Daily trade results patch

This patch adds a daily trade gain/loss calculation to the user dashboard.

## Rule implemented

- Time zone: `America/New_York` (Manhattan / New York City).
- Reset time: every day at 12:00 PM noon New York time.
- The displayed result is the sum of `profit_loss` for the user's closed trades inside the active noon-to-noon window.
- The same value is returned for both dashboard fields:
  - `Account Results`
  - `Today`

## Files changed

- `core/views.py`
  - Added the New York noon-to-noon accounting window.
  - Added `trade_results` in `/api/app/me/` and `/api/app/records/` user payloads.
- `frontend/src/App.jsx`
  - Replaced the fixed `0` values with the backend daily result.
- `frontend/src/styles.css`
  - Added green/red display for positive/negative results.

## Local test commands

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd frontend
npm install --include=dev
npm run build
cd ..
python manage.py collectstatic --noinput
python manage.py migrate
python manage.py runserver
```

Open:

```text
http://127.0.0.1:8000/
```

## Git commands

```powershell
git status
git add .
git commit -m "Add daily trade results reset at New York noon"
git push origin main
```

## Render

After pushing to GitHub:

```text
Manual Deploy → Clear build cache & deploy
```
