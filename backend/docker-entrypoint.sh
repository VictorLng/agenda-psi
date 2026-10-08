#!/bin/sh
set -e
[ -f .env ] || cp .env.example .env
[ -d vendor ] || composer install --no-interaction --prefer-dist
grep -q '^APP_KEY=.\+' .env || php artisan key:generate --force
php artisan migrate --force
exec php artisan serve --host=0.0.0.0 --port=8000
