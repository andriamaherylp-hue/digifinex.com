#!/usr/bin/env bash
set -e

echo "===== Python dependencies ====="
python -m pip install --upgrade pip
pip install -r requirements.txt

echo "===== React build ====="
cd frontend

rm -rf node_modules

npm install --include=dev

echo "===== Installed binaries ====="
ls -la node_modules/.bin || true

npx vite build

cd ..

echo "===== Django ====="
python manage.py collectstatic --noinput
python manage.py migrate
