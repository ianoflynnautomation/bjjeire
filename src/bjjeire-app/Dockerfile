FROM node:24-alpine AS build

WORKDIR /app

ENV HUSKY=0

COPY src/bjjeire-app/package.json src/bjjeire-app/package-lock.json ./
RUN npm ci

COPY src/bjjeire-app/ .

ARG NODE_ENV=production
ARG VITE_APP_MSAL_CLIENT_ID
ARG VITE_APP_MSAL_AUTHORITY
ARG VITE_APP_MSAL_API_SCOPE
ARG VITE_APP_CF_BEACON_TOKEN
ARG VITE_APP_URL
ENV NODE_ENV=${NODE_ENV}
ENV VITE_APP_MSAL_CLIENT_ID=${VITE_APP_MSAL_CLIENT_ID}
ENV VITE_APP_MSAL_AUTHORITY=${VITE_APP_MSAL_AUTHORITY}
ENV VITE_APP_MSAL_API_SCOPE=${VITE_APP_MSAL_API_SCOPE}
ENV VITE_APP_CF_BEACON_TOKEN=${VITE_APP_CF_BEACON_TOKEN}
ENV VITE_APP_URL=${VITE_APP_URL}

RUN npm run build

FROM caddy:alpine
ARG APP_VERSION=dev
LABEL org.opencontainers.image.version="${APP_VERSION}"

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv

EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
