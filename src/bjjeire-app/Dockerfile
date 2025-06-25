FROM node:20-alpine AS build

WORKDIR /app

#COPY src/bjjeire-app/package.json src/bjjeire-app/package-lock.json ./
COPY src/bjjeire-app/package.json ./
RUN npm ci --production=false

COPY src/bjjeire-app/ .
RUN npm run build -- --output-dir dist

FROM nginx:1.25-alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]