#!/usr/bin/env bash
set -o errexit

python -m pip install -r requirements.txt

cd frontend
npm install --include=dev
npm run build
cd ..

python manage.py collectstatic --noinput
python manage.py migrate

if [ "$CREATE_SUPERUSER" = "true" ]; then
python manage.py shell -c "
import os
from django.contrib.auth import get_user_model

User = get_user_model()

username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'belou')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'belou@gmail.com')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'tabory147')

user, created = User.objects.get_or_create(
    username=username,
    defaults={
        'email': email,
        'is_staff': True,
        'is_superuser': True,
    }
)

user.email = email
user.is_staff = True
user.is_superuser = True

if password:
    user.set_password(password)

user.save()

print('Superuser ready:', username)
"
fi