# BJJ Éire

A directory of Brazilian Jiu-Jitsu events and gyms in Ireland — React SPA + .NET 9 API + MongoDB.

<!-- Badges -->
[![CI Pipeline](https://github.com/<OWNER>/<REPO>/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/<OWNER>/<REPO>/actions/workflows/ci.yml)
[![Azure DevOps Build Status](https://dev.azure.com/<ORG>/<PROJECT>/_apis/build/status/<PIPELINE_NAME>?branchName=main)](https://dev.azure.com/<ORG>/<PROJECT>/_build/latest?definitionId=<DEFINITION_ID>&branchName=main)
[![Docker Image Version (latest by date)](https://img.shields.io/docker/v/<ACR_NAME>/<API_IMAGE_NAME>?label=API%20Image&sort=date)](https://portal.azure.com/#@/resource/subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCE_GROUP>/providers/Microsoft.ContainerRegistry/registries/<ACR_NAME>/repository)
[![Docker Image Version (latest by date)](https://img.shields.io/docker/v/<ACR_NAME>/<FRONTEND_IMAGE_NAME>?label=Frontend%20Image&sort=date)](https://portal.azure.com/#@/resource/subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCE_GROUP>/providers/Microsoft.ContainerRegistry/registries/<ACR_NAME>/repository)

---

## ✨ Key Features

- Browse and filter BJJ events and gyms across Ireland
- .NET 9 REST API with Microsoft Entra ID (Azure AD) authentication
- React 19 + Vite SPA with MSAL browser authentication
- MongoDB with Docker Compose or Kubernetes (Minikube + Helm)
- Observability stack: OpenTelemetry, Prometheus, Grafana, Jaeger, Loki, Seq
- Dev Container ready (VS Code / GitHub Codespaces)

---

## 📦 Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- A `.env` file (see [⚡ Configuration](#️-configuration))
- A `secrets/` directory with `cert_password.txt` and `mongodb_password.txt`
- Azure AD app registration (for API authentication)

---

## ⚡ Quick Start

### Local build (from source)

```bash
docker compose --profile app \
  -f docker-compose.yml \
  -f docker-compose.override.local.yml \
  up --build --wait
```

```bash
docker compose --profile app \
  -f docker-compose.yml \
  -f docker-compose.override.local.yml \
  down
```

### Pull from Azure Container Registry

```bash
docker login youracrname.azurecr.io

docker compose --profile app \
  -f docker-compose.yml \
  -f docker-compose.override.acr.yml \
  up --pull always --wait
```

```bash
docker compose --profile app \
  -f docker-compose.yml \
  -f docker-compose.override.acr.yml \
  down
```

### With observability stack

```bash
docker compose --profile app --profile monitoring \
  -f docker-compose.yml \
  -f docker-compose.override.local.yml \
  -f docker-compose.override.observability.yml \
  up --build --wait
```

```bash
docker compose --profile app --profile monitoring \
  -f docker-compose.yml \
  -f docker-compose.override.local.yml \
  -f docker-compose.override.observability.yml \
  down
```

| Service  | URL                    |
|----------|------------------------|
| API      | https://localhost:5001 |
| Frontend | https://localhost:60743|
| MongoDB  | localhost:27017        |

---

## 🛠 Configuration

Copy `.env.example` to `.env` and fill in the values:

```env
ASPNETCORE_ENVIRONMENT=Development
MONGODB_USER=admin
MONGODB_PASSWORD=your-password
AZURE_AD_TENANT_ID=your-tenant-id
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_AUDIENCE=api://your-client-id
VITE_APP_MSAL_CLIENT_ID=your-spa-client-id
VITE_APP_MSAL_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
VITE_APP_MSAL_API_SCOPE=api://your-api-client-id/Events.ReadWrite
```

> **Note:** MSAL env vars are baked into the frontend at Docker build time via `ARG`/`ENV` in the Dockerfile.

---

## ☸️ Kubernetes (Minikube)

```bash
./setup-helm.sh
./setup-minikube.sh
```

The script starts Minikube, loads local Docker images, installs the NGINX ingress controller, deploys via Helm, and updates `/etc/hosts` with `api.bjj.local` and `app.bjj.local`. Requires `sudo` for the hosts file step.

See [`charts/README.md`](charts/README.md) for verification and cleanup.

---

## Contributing

Open an issue or pull request on GitHub.

## License

MIT — Copyright (c) BjjWorld. All rights reserved.
