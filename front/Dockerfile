FROM nginx:stable-alpine

WORKDIR /usr/share/nginx/html

COPY . .

RUN mkdir -p vendor/bootstrap \
    && wget -q -O vendor/bootstrap/bootstrap.min.css \
       https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css \
    && wget -q -O vendor/bootstrap/bootstrap.bundle.min.js \
       https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js

EXPOSE 80
