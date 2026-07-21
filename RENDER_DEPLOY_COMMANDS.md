# Render deployment

Environment variables:
- PYTHON_VERSION=3.12.4
- NODE_VERSION=20.19.0
- NPM_CONFIG_PRODUCTION=false
- DJANGO_SETTINGS_MODULE=belou.settings

Local installation:

python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt

cd frontend
npm install
npm run build
cd ..

python manage.py migrate
python manage.py runserver

Render:
Build Command:
bash build.sh

Start Command:
gunicorn belou.wsgi:application --bind 0.0.0.0:$PORT
