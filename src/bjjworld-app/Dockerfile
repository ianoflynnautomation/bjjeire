FROM node:20-alpine AS build

WORKDIR /app

COPY src/bjjworld-app/package.json src/bjjworld-app/package-lock.json ./
RUN npm ci --production=false

COPY src/bjjworld-app/ .
RUN npm run build

# Nginx stage
FROM nginx:1.25-alpine

COPY certs/aspnetapp.crt /etc/nginx/certs/aspnetapp.crt
COPY certs/aspnetapp.key /etc/nginx/certs/aspnetapp.key
RUN chmod 644 /etc/nginx/certs/aspnetapp.crt /etc/nginx/certs/aspnetapp.key

# Copy the NGINX configuration template
COPY --from=build /app/nginx/default.conf.template /etc/nginx/templates/default.conf.template
# Copy the built React/Vite app
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]