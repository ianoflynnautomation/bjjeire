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


