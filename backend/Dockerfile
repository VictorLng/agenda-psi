FROM php:8.3-cli-alpine

RUN apk add --no-cache postgresql-dev libzip-dev unzip git \
    && docker-php-ext-install pdo_pgsql bcmath zip pcntl

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www
