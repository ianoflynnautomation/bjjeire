FROM node:20-alpine AS build

ARG SERVICES_API_HTTPS_0
ARG SERVICES_API_HTTP_0

WORKDIR /app

COPY src/bjjeire-app/package.json src/bjjeire-app/package-lock.json ./
RUN npm ci

COPY src/bjjeire-app/ .

ENV SERVICES_API_HTTPS_0=${SERVICES_API_HTTPS_0}
ENV SERVICES_API_HTTP_0=${SERVICES_API_HTTP_0}
ENV NODE_OPTIONS="--max_old_space_size=4096"

RUN npm run build

FROM nginx:1.25-alpine

COPY certs/aspnetapp.crt /etc/nginx/certs/aspnetapp.crt
COPY certs/aspnetapp.key /etc/nginx/certs/aspnetapp.key
RUN chmod 644 /etc/nginx/certs/aspnetapp.crt /etc/nginx/certs/aspnetapp.key

COPY infra/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]