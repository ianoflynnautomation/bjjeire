# Docker Compose Setup

This project utilizes a modular Docker Compose setup to manage different environments and optional services. The core application services are defined in a base `docker-compose.yml` file, with environment-specific configurations and optional components defined in separate override files. This approach provides flexibility for:

- Running locally with services built from source.
- Deploying to testing/staging environments by pulling pre-built images from Azure Container Registry (ACR).
- Optionally enabling comprehensive observability tools (monitoring, logging, tracing).

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [File Structure](#file-structure)
- [How to Run](#how-to-run)
  - [Running Core App Services (Local Build)](#running-core-app-services-local-build)
  - [Running Core App Services (ACR Images)](#running-core-app-services-acr-images)
  - [Running Core App Services (Local Build) + Observability](#running-core-app-services-local-build--observability)
  - [Running Core App Services (ACR Images) + Observability](#running-core-app-services-acr-images--observability)
- [Managing Environment Variables](#managing-environment-variables)
- [Managing Secrets](#managing-secrets)
- [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (includes Docker Engine and Docker Compose)
- Access to your Azure Container Registry (ACR) if you plan to use pre-built images.
- A `.env` file (see [Managing Environment Variables](#managing-environment-variables)).
- A `secrets/` directory with the necessary secret files (see [Managing Secrets](#managing-secrets)).

---

## File Structure

The Docker Compose configuration is split into the following files:

### `docker-compose.yml`
- **Base Application Services**: Defines the core `api`, `frontend`, and `mongodb` services with their common configurations (ports, volumes, environment variable placeholders, networks, health checks).
- **Global Anchors**: Contains reusable YAML anchors (`x-defaults`, `x-healthcheck-curl`, `x-healthcheck-wget`).
- **Common Volumes & Secrets**: Declares all named volumes and secrets used across all services.
- Does **not** specify `build` or `image` for `api` and `frontend`, allowing these to be overridden.

### `docker-compose.override.local.yml`
- **Local Development Override**: Specifies the `build` instruction for `api` and `frontend`, telling Docker Compose to build these images from their local Dockerfiles.
- Can also contain environment-specific overrides for local development (e.g., `ASPNETCORE_ENVIRONMENT: "Development"`).

### `docker-compose.override.acr.yml`
- **ACR Image Pull Override**: Specifies the `image` instruction for `api` and `frontend`, instructing Docker Compose to pull pre-built images from your Azure Container Registry.
- Useful for testing, staging, or production environments where images are already built and pushed by your CI/CD pipeline.
- ⚠️ Remember to update `youracrname.azurecr.io` with your actual ACR login server!

### `docker-compose.override.observability.yml`
- **Observability Services**: Defines all monitoring, logging, and tracing services (`mongo-exporter`, `otel-collector`, `prometheus`, `grafana`, `jaeger`, `loki`, `node_exporter`, `seq`, `etcd`, `postgres-1`, `postgres-2`, `haproxy`, `redis-primary`, `redis-replica`, `redis-sentinel-1`, `grafana-nginx`).
- These services are configured to use specific profiles: `["monitoring"]`, allowing them to be started selectively.

---

## How to Run

Docker Compose uses the `-f` flag to combine multiple Compose files. The order matters: files specified later will override definitions in earlier files for the same service.

### Running Core App Services (Local Build)

This is ideal for local development, where you want to build the `api` and `frontend` images directly from your source code.

```bash
docker compose --profile app -f docker-compose.yml -f docker-compose.override.local.yml up --build --wait
```

To stop:

```bash
docker compose --profile app -f docker-compose.yml -f docker-compose.override.local.yml down
```

### Running Core App Services (ACR Images)

Use this scenario for deploying to testing/staging environments, pulling pre-built images from your Azure Container Registry.
First, log in to your Azure Container Registry:

```bash
docker login youracrname.azurecr.io
```

(Replace youracrname.azurecr.io with your actual ACR login server. You'll be prompted for username/password or token.)
Then, run Docker Compose:

```bash
docker compose --profile app -f docker-compose.yml -f docker-compose.override.acr.yml up --pull always --wait
```

To stop:

```bash
docker compose --profile app -f docker-compose.yml -f docker-compose.override.acr.yml down
```

###  Running Core App Services (Local Build) + Observability

To include the monitoring and logging stack while developing locally:

```bash
docker compose --profile app --profile monitoring -f docker-compose.yml -f docker-compose.override.local.yml -f docker-compose.override.observability.yml up --build --wait
```
To stop:

```bash
docker compose --profile app --profile monitoring -f docker-compose.yml -f docker-compose.override.local.yml -f docker-compose.override.observability.yml down
```

### Running Core App Services (ACR Images) + Observability

To run your pre-built app services with the full observability stack, pulling all images from registries:
Ensure you are logged into ACR (see Running Core App Services (ACR Images) (#running-core-app-services-acr-images)).

```bash
docker compose --profile app --profile monitoring -f docker-compose.yml -f docker-compose.override.acr.yml -f docker-compose.override.observability.yml up --pull always --wait
```

To stop:

```bash
docker compose --profile app --profile monitoring -f docker-compose.yml -f docker-compose.override.acr.yml -f docker-compose.override.observability.yml down
```

# Kubernetes Setup

### How to Use These Files:

To deploy to your local Minikube/Kind cluster:

```bash
helm upgrade --install bjj-app ./bjj-app --namespace bjj-app --values ./bjj-app/values-local.yaml --create-namespace --debug
```

To deploy to your Azure AKS cluster:

```bash
helm upgrade --install bjj-app ./bjj-app --namespace bjj-app --values ./bjj-app/values-aks.yaml --create-namespace --debug
```


create secrets for local. cd to charts.

```bash
kubectl create secret tls bjj-frontend-tls-secret --cert=../certs/local-certs/bjj-frontend.crt --key=../certs/local-certs/bjj-frontend.key --namespace bjj-app
kubectl create secret generic bjj-api-kestrel-cert-secret --from-file=aspnetapp.pfx=../certs/local-certs/bjj-api-kestrel.pfx --namespace bjj-app 
kubectl create secret generic bjj-api-kestrel-cert-password --from-file=cert-password=../certs/local-certs/bjj-api-kestrel-password.txt --namespace bjj-app
kubectl create secret generic bjj-mongodb-root-password --from-literal=mongodb-password='securepassword123' --namespace bjj-app
kubectl create secret tls bjj-tls-secret --cert=../certs/local-certs/bjj-frontend.crt --key=../certs/local-certs/bjj-frontend.key --namespace bjj-app
```

build local docker files for frontend and api 

api
```bash
docker build -t bjj-api:local -f ./src/BjjEire.Api/Dockerfile .
```

frontend
```bash
ianoflynn@Mac BjjEire % docker build -t bjj-frontend:local -f ./src/bjjeire-app/Dockerfile . --build-arg SERVICES_API_HTTP_0=http://api.bjj.local --build-arg SERVICES_API_HTTPS_0=https://api.bjj.local --build-arg PORT=80
```

```bash
helm upgrade --install bjj-app ./bjj-app \
  --namespace bjj-app \
  --values ./bjj-app/values-local.yaml \
  --set-file secrets.frontendTlsCert.value=./local-certs/bjj-frontend-tls.crt \
  --set-file secrets.frontendTlsKey.value=./local-certs/bjj-frontend-tls.key \
  --set-file secrets.apiKestrelCertVolume.value=./local-certs/kestrel.pfx \
  --set secrets.apiKestrelCertPassword.value='mycertpassword' \
  --set secrets.mongodbRootPassword.value='securepassword123' \
  --create-namespace --debug
  ```


  bjj-app Kubernetes Deployment Guide
This document provides a comprehensive guide for deploying the bjj-app Helm chart to a local Minikube Kubernetes cluster, including a summary of common issues encountered and their solutions.

1. Overview and Key Learnings
Deploying applications to Kubernetes, especially in local development environments, often involves navigating challenges related to dependency management, networking, and Helm templating. This guide captures the best practices and specific solutions that led to a successful deployment of the bjj-app stack (MongoDB, API, Frontend).

Key Learnings & Best Practices Applied:

Helm Chart Structure: Organize Helm templates (templates/) with one Kubernetes resource per file for clarity and maintainability.

Local Secret Management: Use kubectl create secret for local development secrets (certificates, passwords) and configure Helm to not manage these resources in development environments. This avoids sensitive data in values.yaml and simplifies troubleshooting.

Kubernetes DNS & Service Discovery: Implement initContainers and robust Nginx configurations to gracefully handle service dependencies and DNS resolution during application startup.

Local Load Balancing: Utilize Minikube addons like MetalLB and the minikube tunnel command to expose LoadBalancer services locally.

Systematic Troubleshooting: Leverage kubectl logs, kubectl describe pod, and network utilities (nslookup, curl, nc) for effective root cause analysis.

2. Prerequisites
Ensure you have the following tools installed and configured on your local machine:

Minikube: Latest stable version recommended.

kubectl: Compatible with your Kubernetes version.

Helm 3: Latest stable version.

Docker Desktop (with Kubernetes enabled) or a VM Hypervisor (VirtualBox/HyperKit): Chosen based on your Minikube driver.

openssl: For generating local development certificates (usually pre-installed on macOS/Linux).

Your application Dockerfiles and source code (for bjj-api and bjj-frontend).

3. Initial Helm Chart Setup
This section outlines the foundational configuration of your Helm chart.

A. Helm Chart File Structure
Maintain a clean and logical chart structure:

Chart.yaml: Chart metadata.

values.yaml: Defines default values for the chart. (Required, even if empty).

values-local.yaml: Overrides values.yaml for local development-specific configurations.

templates/: Contains individual Kubernetes manifest templates.

Each file typically defines a single Kubernetes resource (e.g., api-deployment.yaml, frontend-service.yaml, mongodb-pvc.yaml).

Common helper templates (_helpers.tpl) for labels and names.

B. Example values-local.yaml Configuration
Your values-local.yaml should contain environment-specific settings.

# bjj-app/values-local.yaml
```yaml
nameOverride: "bjj-app"
fullnameOverride: "bjj-app"

replicaCount: 1 # Typically 1 for local development

image:
  repository: bjj-api
  frontendRepository: bjj-frontend
  pullPolicy: IfNotPresent
  tag: "local" # Use 'local' tag for locally built images

service:
  api:
    type: ClusterIP
    port: 80
    httpsPort: 443
  frontend:
    type: ClusterIP
    port: 80
    httpsPort: 443

ingress:
  enabled: true
  className: nginx
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "false"
  hosts:
    - host: api.bjj.local
      paths:
        - path: /
          pathType: Prefix
          serviceName: ""
          servicePort: 80
    - host: app.bjj.local
      paths:
        - path: /
          pathType: Prefix
          serviceName: ""
          servicePort: 80
  tls:
    - secretName: bjj-tls-secret # Refers to a Secret created by kubectl
      hosts:
        - api.bjj.local
        - app.bjj.local

resources: # Define appropriate resource requests/limits for local dev
  api:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 250m
      memory: 256Mi
  frontend:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 250m
      memory: 256Mi
  mongodb:
    limits:
      cpu: 1000m
      memory: 1Gi
    requests:
      cpu: 500m
      memory: 512Mi

environment: # Application-specific environment variables
  api:
    ASPNETCORE_ENVIRONMENT: Development
    ASPNETCORE_URLS: "http://+:80;https://+:443"
    CorsOptions__AllowedOrigins: "https://app.bjj.local,http://app.bjj.local,http://bjj-app-frontend:80,https://bjj-app-frontend:443"
    Serilog__WriteTo__1__Args__serverUrl: http://seq:80 # Example for external services, ensure they are running or remove
    Serilog__WriteTo__2__Args__endpoint: http://otel-collector:4317 # Example for external services
    Serilog__Properties__Application: BjjWorld.Api
    OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4317
    OTEL_RESOURCE_ATTRIBUTES__service.name: BjjWorld.Api

  frontend:
    NODE_ENV: production
    PORT: 80

  mongodb:
    MONGODB_USER: admin
    MONGODB_HOST: mongodb
    MONGODB_PORT: 27017
    MONGODB_DB: Mongodb

mongodbVolume:
  enabled: true
  size: 10Gi
  storageClassName: standard # Minikube's default is often 'standard'

apiKestrelCertVolume:
  enabled: true
  name: bjj-api-kestrel-cert-secret # Secret created by kubectl
  mountPath: /https

frontendNginxCertVolume:
  enabled: true
  name: bjj-frontend-tls-secret # Secret created by kubectl
  certMountPath: /etc/nginx/certs/aspnetapp.crt
  keyMountPath: /etc/nginx/certs/aspnetapp.key

secrets: # Define names/keys of secrets referenced by chart, but NOT their values for local dev
  apiKestrelCertPassword:
    enabled: true
    create: false # IMPORTANT: Set to false for secrets managed by kubectl
    name: bjj-api-kestrel-cert-password
    key: cert-password

  mongodbRootPassword:
    enabled: true
    create: false # IMPORTANT: Set to false for secrets managed by kubectl
    name: bjj-mongodb-root-password
    key: mongodb-password

  frontendTlsCert:
    enabled: true
    create: false # IMPORTANT: Set to false for secrets managed by kubectl
    name: bjj-frontend-tls-secret
    key: tls.crt

  frontendTlsKey:
    enabled: true
    create: false # IMPORTANT: Set to false for secrets managed by kubectl
    name: bjj-frontend-tls-secret
    key: tls.key

namespace: bjj-app

azure:
  enabled: false # Ensure false for local development to skip Azure Key Vault resources
  tenantId: ""
  keyVaultName: ""

frontendNginxConfig: |
  worker_processes auto;
  error_log /var/log/nginx/error.log warn;
  pid /var/run/nginx.pid;

  events {
      worker_connections 1024;
  }

  http {
      # Critical for dynamic service discovery in Kubernetes
      resolver 10.96.0.10 valid=5s; # Replace with your Minikube cluster DNS IP (e.g., from `cat /etc/resolv.conf` in Minikube VM)
      resolver_timeout 5s;

      access_log /var/log/nginx/access.log combined;
      server_tokens off;

      server {
          listen 80;
          listen 443 ssl;
          server_name _;

          ssl_certificate /etc/nginx/certs/aspnetapp.crt;
          ssl_certificate_key /etc/nginx/certs/aspnetapp.key;

          gzip on;
          gzip_vary on;
          gzip_proxied any;
          gzip_comp_level 6;
          gzip_buffers 16 8k;
          gzip_http_version 1.1;
          gzip_min_length 256;
          gzip_types
              application/atom+xml
              application/geo+json
              application/javascript
              application/x-javascript
              application/json
              application/ld+json
              application/manifest+json
              application/rdf+xml
              application/rss+xml
              application/vnd.ms-fontobject
              application/wasm
              application/x-web-app-manifest+json
              application/xhtml+xml
              application/xml
              font/eot
              font/otf
              font/ttf
              image/svg+xml
              image/x-icon
              text/cache-manifest
              text/css
              text/javascript
              text/plain
              text/vcard
              text/vnd.rim.location.xloc
              text/vtt
              text/x-component
              text/x-cross-domain-policy;

          root /usr/share/nginx/html;

          location ~* \.(?:css|js|jpg|jpeg|gif|png|ico|svg|woff|woff2|ttf|eot)$ {
              expires 1y;
              add_header Cache-Control "public";
              access_log off;
          }

          location / {
              try_files $uri $uri/ /index.html;
          }

          location /api/ {
              set $api_upstream bjj-app-api.bjj-app.svc.cluster.local; # Correct FQDN for the API service
              proxy_pass http://$api_upstream:80/; # Use variable for dynamic resolution

              proxy_set_header Host $host;
              proxy_set_header X-Real-IP $remote_addr;
              proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
              proxy_set_header X-Forwarded-Proto $scheme;

              proxy_set_header Upgrade $http_upgrade;
              proxy_set_header Connection 'upgrade';
              proxy_cache_bypass $http_upgrade;

              proxy_pass_header Content-Security-Policy;
              proxy_pass_header Permissions-Policy;
          }

          location /health {
              access_log off;
              return 200 "OK";
              add_header Content-Type text/plain;
          }

          location ~ /\. {
              deny all;
          }
      }
  }
```

4. Initial Cluster & Application Deployment Steps
Follow these steps for a clean installation of your application.

A. Clean Minikube Environment (If starting from scratch or after issues)
```bash
minikube stop
minikube delete --all # WARNING: This deletes your Minikube VM and ALL its contents!
minikube start --driver=docker # Or your preferred driver (e.g., --driver=virtualbox)
```

B. Rebuild Application Images into Minikube's Docker Daemon
If you are using image.tag: "local" in your values-local.yaml, you must build your Docker images directly into Minikube's Docker daemon.

Point Docker client to Minikube:

```bash
eval $(minikube docker-env)
```

Navigate to your API Dockerfile directory:

```bash
cd <path/to/your/bjj-api-project-root>
docker build -t bjj-api:local .
```

Navigate to your Frontend Dockerfile directory:

```bash
cd <path/to/your/bjj-frontend-project-root>
docker build -t bjj-frontend:local .
```

Verify images are present in Minikube:

```bash
docker images | grep bjj-api
docker images | grep bjj-frontend
```

Revert Docker client to host (optional, but good practice):

```bash
eval $(minikube docker-env -u)
```

C. Install Ingress Controller and MetalLB
A fresh Minikube cluster needs an Ingress Controller and MetalLB for external access.

Install Nginx Ingress Controller:

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx --namespace ingress-nginx --create-namespace
```

Enable and Configure MetalLB (for LoadBalancer Service External IP):

```bash
minikube addons enable metallb
minikube addons configure metallb
```

When prompted for IP ranges, use a range within your minikube ip's subnet (e.g., if minikube ip is 192.168.49.2, use 192.168.49.100 - 192.168.49.150).

Verify MetalLB assigned IP:

```bash
kubectl get svc ingress-nginx-controller -n ingress-nginx -w # Watch for IP to appear
```

Note the EXTERNAL-IP (e.g., 192.168.49.100).

D. Recreate Kubernetes Secrets
These are needed by your application and are not managed by Helm (as per secrets.create: false in your values).

# Ensure you are in your Helm chart root, or adjust paths to ./local-certs
# Create namespace if it doesn't exist after a full Minikube delete
kubectl create namespace bjj-app --dry-run=client -o yaml | kubectl apply -f -

# Create Secrets
```bash
kubectl create secret tls bjj-frontend-tls-secret --cert=../certs/local-certs/bjj-frontend.crt --key=../certs/local-certs/bjj-frontend.key --namespace bjj-app
kubectl create secret generic bjj-api-kestrel-cert-secret --from-file=aspnetapp.pfx=../certs/local-certs/bjj-api-kestrel.pfx --namespace bjj-app 
kubectl create secret generic bjj-api-kestrel-cert-password --from-file=cert-password=../certs/local-certs/bjj-api-kestrel-password.txt --namespace bjj-app
kubectl create secret generic bjj-mongodb-root-password --from-literal=mongodb-password='securepassword123' --namespace bjj-app
kubectl create secret tls bjj-tls-secret --cert=../certs/local-certs/bjj-frontend.crt --key=../certs/local-certs/bjj-frontend.key --namespace bjj-app
```

E. Deploy Your Helm Chart
Apply your application's Helm chart with the local values.

```bash
helm upgrade --install bjj-app ./bjj-app --namespace bjj-app --values ./bjj-app/values-local.yaml --create-namespace --debug
```

F. Monitor Pod Status
Verify that all pods in your bjj-app namespace become 1/1 Running.

```bash
kubectl get pods -w -n bjj-app
```

5. Accessing Your Application UI
Once all pods are 1/1 Running, access your application.

A. Update Your Local hosts File
Map your application domains to the MetalLB assigned EXTERNAL-IP.

Get the MetalLB EXTERNAL-IP:

```bash
kubectl get svc ingress-nginx-controller -n ingress-nginx -o wide
```

(Note the IP in the EXTERNAL-IP column, e.g., 192.168.49.100).

Edit your hosts file (Requires Administrator/Root privileges):

macOS/Linux: sudo nano /etc/hosts

Windows: Open Notepad as Administrator, then File > Open, navigate to C:\Windows\System32\drivers\etc, select hosts (change file type to "All Files").

Add the mappings (replace <METAL_LB_EXTERNAL_IP>):

# Kubernetes local domains for bjj-app
```
<METAL_LB_EXTERNAL_IP> app.bjj.local
<METAL_LB_EXTERNAL_IP> api.bjj.local
```

Save the hosts file.

B. Flush DNS Caches
Ensure your operating system and browser use the updated hosts file.

Flush OS DNS cache:

macOS: sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

Windows: ipconfig /flushdns

Clear Browser DNS cache (e.g., Microsoft Edge):

Open edge://net-internals/#dns in the address bar.

Click "Clear host cache".

Close and re-open Edge completely.

C. Run minikube tunnel (in a separate terminal)
This command is crucial for LoadBalancer services in Minikube. It establishes the necessary network routes and must run continuously in a dedicated terminal window while you want to access your application.

minikube tunnel

D. Access in Browser
Open your web browser and navigate to:

Frontend UI: http://app.bjj.local

API Health: https://api.bjj.local/health (Accept any self-signed certificate warnings for local development).

6. Common Troubleshooting During Runtime
ERR_CONNECTION_TIMED_OUT (Host to App/Ingress IP):

Most likely: Local firewall blocking connection to Minikube IP (192.168.49.x). Temporarily disable firewall or add rules.

Crucial: Ensure minikube tunnel is running continuously in a separate terminal.

VPN interference: Disconnect or temporarily uninstall VPN clients.

Test basic connectivity with curl http://<METAL_LB_EXTERNAL_IP> or nc -vz <METAL_LB_EXTERNAL_IP> 80.

Pod Pending (MongoDB): Check kubectl describe pod <pod-name> for FailedScheduling due to PVC not found. Ensure mongodb-pvc.yaml is deployed by Helm and PVC is Bound (kubectl get pvc).

Pod CrashLoopBackOff or 0/1 Ready:

Get kubectl logs <pod-name> -c <container-name> and kubectl describe pod <pod-name>.

API CryptographicException (PFX password): Recreate bjj-api-kestrel-cert-password secret with correct password (--from-file or --from-literal).

Frontend host not found in upstream (Nginx):

Verify initContainer is correctly waiting for the API's health check (curl -k -s -f https://bjj-app-api.bjj-app.svc.cluster.local:443/health).

Confirm frontendNginxConfig in values-local.yaml contains resolver and set $api_upstream/proxy_pass $api_upstream in the ConfigMap (inspect kubectl get configmap ... -o yaml). Clean up any extra lines/comments in values-local.yaml.

ErrImagePull / ImagePullBackOff:

Ensure eval $(minikube docker-env) is run before docker build -t <image>:local . to build images directly into Minikube's daemon.

This README provides a robust foundation for deploying and troubleshooting your bjj-app locally.