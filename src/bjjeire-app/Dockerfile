FROM node:24-alpine AS build

ARG SERVICES_API_HTTPS_0
ARG SERVICES_API_HTTP_0

WORKDIR /app

# Disable husky git-hook setup (no .git in Docker build context)
ENV HUSKY=0

COPY src/bjjeire-app/package.json src/bjjeire-app/package-lock.json ./
RUN npm ci

COPY src/bjjeire-app/ .

ARG NODE_ENV=production
ARG VITE_APP_MSAL_CLIENT_ID
ARG VITE_APP_MSAL_AUTHORITY
ARG VITE_APP_MSAL_API_SCOPE
ARG VITE_APP_CF_BEACON_TOKEN
ENV SERVICES_API_HTTPS_0=${SERVICES_API_HTTPS_0}
ENV SERVICES_API_HTTP_0=${SERVICES_API_HTTP_0}
ENV NODE_ENV=${NODE_ENV}
ENV VITE_APP_MSAL_CLIENT_ID=${VITE_APP_MSAL_CLIENT_ID}
ENV VITE_APP_MSAL_AUTHORITY=${VITE_APP_MSAL_AUTHORITY}
ENV VITE_APP_MSAL_API_SCOPE=${VITE_APP_MSAL_API_SCOPE}
ENV VITE_APP_CF_BEACON_TOKEN=${VITE_APP_CF_BEACON_TOKEN}

RUN npm run build

FROM nginx:alpine
ARG APP_VERSION=dev
LABEL org.opencontainers.image.version="${APP_VERSION}"

RUN addgroup -g 101 -S nginx 2>/dev/null || true && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx 2>/dev/null || true && \
    mkdir -p /var/cache/nginx /var/run /var/log/nginx /etc/nginx/certs /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx \
        /var/cache/nginx \
        /var/run \
        /var/run/nginx.pid \
        /var/log/nginx \
        /etc/nginx/certs \
        /etc/nginx/conf.d \
        /usr/share/nginx/html && \
    chmod -R 755 /var/cache/nginx /var/run /var/log/nginx && \
    chmod 700 /etc/nginx/certs

COPY infra/nginx/default.conf.template /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
