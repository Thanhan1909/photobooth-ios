FROM webdevops/php-apache:8.4
RUN echo "LimitRequestLine 12000" > /opt/docker/etc/httpd/conf.d/limits.conf \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get update \
    && apt-get install -y --no-install-recommends build-essential git gphoto2 libimage-exiftool-perl rsync udisks2 python3 ca-certificates curl gnupg nodejs \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
RUN chown -R application:application /app
USER application
RUN npm ci && npm run build
