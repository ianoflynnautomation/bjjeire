# BJJ Eire: Local Development & Kubernetes Setup

<!-- Badges -->
[![CI Pipeline](https://github.com/<OWNER>/<REPO>/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/<OWNER>/<REPO>/actions/workflows/ci.yml)
[![Azure DevOps Build Status](https://dev.azure.com/<ORG>/<PROJECT>/_apis/build/status/<PIPELINE_NAME>?branchName=main)](https://dev.azure.com/<ORG>/<PROJECT>/_build/latest?definitionId=<DEFINITION_ID>&branchName=main)
[![Docker Image Version (latest by date)](https://img.shields.io/docker/v/<ACR_NAME>/<API_IMAGE_NAME>?label=API%20Image&sort=date)](https://portal.azure.com/#@/resource/subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCE_GROUP>/providers/Microsoft.ContainerRegistry/registries/<ACR_NAME>/repository)
[![Docker Image Version (latest by date)](https://img.shields.io/docker/v/<ACR_NAME>/<FRONTEND_IMAGE_NAME>?label=Frontend%20Image&sort=date)](https://portal.azure.com/#@/resource/subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCE_GROUP>/providers/Microsoft.ContainerRegistry/registries/<ACR_NAME>/repository)

---

## Dev Container Setup

This project includes a ready-to-use [Dev Container](https://containers.dev/) configuration for rapid onboarding and consistent development environments in VS Code or GitHub Codespaces.

- **Base Image:** `mcr.microsoft.com/devcontainers/base:ubuntu`
- **Custom Features:**
  - Docker-in-Docker (for building/running containers inside the devcontainer)
  - Minikube, Helm, and kubectl (for local Kubernetes development)
  - .NET 9 SDK
  - Node.js 24 (with node-gyp dependencies)
- **VS Code Extensions:**
  - Kubernetes, Docker, YAML, C#, ESLint, Prettier, Pascal Case, .NET Test Explorer, Spell Checker
- **Ports Auto-Forwarded:**
  - 5003 (API HTTP), 5001 (API HTTPS)
  - 60742 (Frontend HTTP), 60743 (Frontend HTTPS)
  - 27017 (MongoDB)
- **Post-Create Command:** Runs `bash ./post-create-commands.sh` to finalize setup
- **Default User:** `vscode`
- **Workspace Directory:** `/workspaces/BjjEire`
- **Environment Variable:** `BJJ_PROVISIONING_METHOD=helm`

> **Tip:** Open this project in VS Code and install the "Dev Containers" extension for a seamless, pre-configured development experience.

---

## Table of Contents
- [Docker Compose Setup](#docker-compose-setup)
  - [Prerequisites](#prerequisites)
  - [File Structure](#file-structure)
  - [How to Run](#how-to-run)
- [Kubernetes Setup](#kubernetes-setup)
  - [BJJ Application Deployment to Minikube](#bjj-application-deployment-to-minikube)
  - [Prerequisites](#prerequisites-1)
  - [Local Setup and Deployment](#local-setup-and-deployment)

---

# Docker Compose Setup

This project utilizes a modular Docker Compose setup to manage different environments and optional services. The core application services are defined in a base `docker-compose.yml` file, with environment-specific configurations and optional components defined in separate override files. This approach provides flexibility for:

- Running locally with services built from source.
- Deploying to testing/staging environments by pulling pre-built images from Azure Container Registry (ACR).
- Optionally enabling comprehensive observability tools (monitoring, logging, tracing).

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

> **Warning:**
> Remember to update `youracrname.azurecr.io` with your actual ACR login server!

### `docker-compose.override.observability.yml`
- **Observability Services**: Defines all monitoring, logging, and tracing services (`mongo-exporter`, `otel-collector`, `prometheus`, `grafana`, `jaeger`, `loki`, `node_exporter`, `seq`, `etcd`, `postgres-1`, `postgres-2`, `haproxy`, `redis-primary`, `redis-replica`, `redis-sentinel-1`, `grafana-nginx`).
- These services are configured to use specific profiles: `["monitoring"]`, allowing them to be started selectively.

---

## How to Run

Docker Compose uses the `-f` flag to combine multiple Compose files. The order matters: files specified later will override definitions in earlier files for the same service.

### Running Core App Services (Local Build)

```bash
docker compose --profile app -f docker-compose.yml -f docker-compose.override.local.yml up --build --wait
```

To stop:

```bash
docker compose --profile app -f docker-compose.yml -f docker-compose.override.local.yml down
```

### Running Core App Services (ACR Images)

First, log in to your Azure Container Registry:

```bash
docker login youracrname.azurecr.io
```

(Replace `youracrname.azurecr.io` with your actual ACR login server. You'll be prompted for username/password or token.)

Then, run Docker Compose:

```bash
docker compose --profile app -f docker-compose.yml -f docker-compose.override.acr.yml up --pull always --wait
```

To stop:

```bash
docker compose --profile app -f docker-compose.yml -f docker-compose.override.acr.yml down
```

### Running Core App Services (Local Build) + Observability

```bash
docker compose --profile app --profile monitoring -f docker-compose.yml -f docker-compose.override.local.yml -f docker-compose.override.observability.yml up --build --wait
```

To stop:

```bash
docker compose --profile app --profile monitoring -f docker-compose.yml -f docker-compose.override.local.yml -f docker-compose.override.observability.yml down
```

### Running Core App Services (ACR Images) + Observability

> **Note:**
> Ensure you are logged into ACR (see [Running Core App Services (ACR Images)](#running-core-app-services-acr-images)).

```bash
docker compose --profile app --profile monitoring -f docker-compose.yml -f docker-compose.override.acr.yml -f docker-compose.override.observability.yml up --pull always --wait
```

To stop:

```bash
docker compose --profile app --profile monitoring -f docker-compose.yml -f docker-compose.override.acr.yml -f docker-compose.override.observability.yml down
```

---

# Kubernetes Setup

## BJJ Application Deployment to Minikube

This repository contains the necessary scripts and Helm charts to deploy the **BJJ application**, consisting of a **Backend API** and a **Frontend UI**, to a local **Minikube Kubernetes cluster**.

The deployment automates the following tasks:

### 🚀 Deployment Overview
- **Minikube Initialization**: Starts a Minikube cluster using the Docker driver.
- **Docker Image Management**: Builds local Docker images for the API and Frontend services and loads them into Minikube's Docker daemon.
- **Kubernetes Resource Creation**: Sets up a dedicated namespace and creates necessary secrets for certificates and database passwords.
- **Ingress Controller Deployment**: Installs the NGINX Ingress Controller to manage external access to the services.
- **Helm Chart Deployment**: Deploys the application services (API, Frontend, MongoDB) using a Helm chart configured for local development.
- **Local DNS Configuration**: Updates your `/etc/hosts` file to enable local domain access (e.g., `app.bjj.local`, `api.bjj.local`).

---

## 📋 Prerequisites

Before you begin, ensure you have the following tools installed on your system:

- **Minikube**: [Installation Guide](https://minikube.sigs.k8s.io/docs/start/)
- **Kubectl**: [Installation Guide](https://kubernetes.io/docs/tasks/tools/)
- **Helm**: [Installation Guide](https://helm.sh/docs/intro/install/)
- **Docker**: [Installation Guide](https://docs.docker.com/get-docker/)

---

## 🛠️ Local Setup and Deployment

Follow these steps to deploy the BJJ application to your local Minikube cluster:

1. **Clone the Repository**

```bash
git clone <your-repository-url>
cd <your-repository-name>
```

2. **Run the Deployment Script**

Execute the main deployment script. This script will automate all the necessary steps, from starting Minikube to deploying your application.

```bash
./setup-helm.sh
./setup-minikube.sh
```

The script will provide output at each stage of the deployment process. Please be patient, as some steps (like Minikube startup or image building) can take a few minutes.

> ⚠️ **Important Note for sudo on macOS/Linux**
> The script modifies your `/etc/hosts` file, which requires sudo permissions. You will be prompted to enter your password during this step.

---

## Helm Chart

The application's Kubernetes manifests are managed via a Helm chart located at `charts/bjj-app`.

The `values-local.yaml` file (located at `charts/bjj-app/values-local.yaml`) provides the specific configurations for this local Minikube deployment, including:

- Image names and tags
- Service types (`ClusterIP`)
- Ingress rules for `api.bjj.local` and `app.bjj.local`
- Resource requests and limits for API, Frontend, and MongoDB
- Environment variables specific to the local environment
- Persistent Volume Claim for MongoDB
- Mount paths for application certificates

---

## Local DNS (`/etc/hosts`)

The `deploy-local.sh` script automatically updates your system's `/etc/hosts` file with entries that map:

- `api.bjj.local`
- `app.bjj.local`

to your Minikube cluster's IP address. This allows you to access the application using these friendly domain names.

---

For troubleshooting, verification, and cleanup instructions, see [charts/README.md](charts/README.md).
