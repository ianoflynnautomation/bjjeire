FROM node:20-alpine AS build

WORKDIR /app

COPY src/bjjeire-app/package.json src/bjjeire-app/package-lock.json ./
RUN npm ci

ARG SERVICES_API_HTTPS_0
ARG SERVICES_API_HTTP_0

ENV SERVICES_API_HTTPS_0=${SERVICES_API_HTTPS_0}
ENV SERVICES_API_HTTP_0=${SERVICES_API_HTTP_0}

COPY src/bjjeire-app/ .
# RUN npm run build -- --output-dir dist
RUN npm run build

FROM nginx:1.25-alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]