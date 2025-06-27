FROM node:24-alpine AS build

ARG SERVICES_API_HTTPS_0
ARG SERVICES_API_HTTP_0
ARG NODE_ENV

WORKDIR /app

COPY src/bjjeire-app/package.json src/bjjeire-app/package-lock.json ./
RUN npm ci

COPY src/bjjeire-app/ .

ENV SERVICES_API_HTTPS_0=${SERVICES_API_HTTPS_0}
ENV SERVICES_API_HTTP_0=${SERVICES_API_HTTP_0}
ENV NODE_ENV=${NODE_ENV}

RUN npm run build

FROM nginx:1.25-alpine

RUN mkdir -p /etc/nginx/certs/ && \
    chmod 700 /etc/nginx/certs/

COPY infra/nginx/default.conf.template /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]