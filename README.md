# BJJ Eire: Local Development & Kubernetes Setup

[![CI Pipeline](https://github.com/<OWNER>/<REPO>/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/<OWNER>/<REPO>/actions/workflows/ci.yml)
[![Azure DevOps Build Status](https://dev.azure.com/<ORG>/<PROJECT>/_apis/build/status/<PIPELINE_NAME>?branchName=main)](https://dev.azure.com/<ORG>/<PROJECT>/_build/latest?definitionId=<DEFINITION_ID>&branchName=main)
[![Docker Image Version (latest by date)](https://img.shields.io/docker/v/<ACR_NAME>/<API_IMAGE_NAME>?label=API%20Image&sort=date)](https://portal.azure.com/#@/resource/subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCE_GROUP>/providers/Microsoft.ContainerRegistry/registries/<ACR_NAME>/repository)
[![Docker Image Version (latest by date)](https://img.shields.io/docker/v/<ACR_NAME>/<FRONTEND_IMAGE_NAME>?label=Frontend%20Image&sort=date)](https://portal.azure.com/#@/resource/subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCE_GROUP>/providers/Microsoft.ContainerRegistry/registries/<ACR_NAME>/repository)

---

## Table of Contents
- [Docker Compose Setup](#docker-compose-setup)
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

## 4. Access the Application

Once the `deploy-local.sh` script completes successfully, your application should be accessible via your web browser:

- **Frontend UI:** [https://app.bjj.local](https://app.bjj.local)  
- **Backend API:** [https://api.bjj.local](https://api.bjj.local)

port forward 

```bash
kubectl port-forward svc/bjj-app-frontend 8080:80 -n bjj-app   
```
https
```bash
kubectl port-forward svc/bjj-app-frontend 8443:443 -n bjj-app
kubectl port-forward svc/bjj-app-frontend 8443:443 -n bjj-app
```
---

## 🔍 Verification

You can verify the deployment status using `kubectl` commands:

```bash
minikube status
```
Check running pods in the bjj-app namespace:

```bash
kubectl get pods -n bjj-app
```
You should see pods for bjj-api, bjj-frontend, and mongodb in a Running state.

Check services:

```bash
kubectl get services -n bjj-app
```
Check ingresses:
```bash
kubectl get ingress -n bjj-app
kubectl get ingress -n ingress-nginx
```
View logs for a specific pod (replace <pod-name> with actual pod name):

```bash
kubectl logs <pod-name> -n bjj-app
```
# 🏗️ Key Components

## Docker Images

The deployment builds and loads two custom Docker images into your Minikube environment:

- `bjj-api:local`: For the backend API service.
- `bjj-frontend:local`: For the frontend application.

These images are built from Dockerfiles located in the `src` directory.

---

## Kubernetes Namespace

All application components are deployed into the dedicated `bjj-app` namespace to keep them isolated.

---

## Kubernetes Secrets

Several Kubernetes secrets are created to securely store sensitive information:

- `bjj-frontend-tls-secret`: TLS certificate and key for the frontend ingress.
- `bjj-api-kestrel-cert-secret`: PFX certificate for the Kestrel server in the API.
- `bjj-api-kestrel-cert-password`: Password for the API Kestrel certificate.
- `bjj-mongodb-root-password`: Root password for the MongoDB database.
- `bjj-tls-secret`: General TLS secret for ingress (might be redundant if `bjj-frontend-tls-secret` is used for both).

> ⚠️ **Security Warning (Local Development Only):**  
> The `bjj-api-kestrel-cert-password` and `bjj-mongodb-root-password` secrets are currently created using hardcoded values from files or literals.  
> This approach is **highly discouraged** for production environments.  
> For production, consider using more secure methods like:
> - External secret management systems (e.g., Azure Key Vault, HashiCorp Vault)
> - Interactive prompts for sensitive values

---

## NGINX Ingress Controller

The NGINX Ingress Controller is installed in the `ingress-nginx` namespace. It manages incoming HTTP/HTTPS traffic and routes it to the correct services within the cluster based on the ingress rules defined in the Helm chart.

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

## 🐛 Troubleshooting

**Minikube Not Starting:**

- Ensure Docker is running.
- Try:
  ```bash
  minikube delete --profile minikube


Check Minikube logs: 
```bash
minikube logs
```

Images Not Found/Loaded:

Ensure eval "$(minikube docker-env)" was run correctly (the script handles this).

Verify the Docker images exist locally: 
```bash
docker images | grep bjj
```

Manually load images: 
```bash
minikube image load bjj-api:local bjj-frontend:local
```

Application Not Accessible via app.bjj.local:

Confirm Minikube IP:
```bash
minikube ip
```

Check your /etc/hosts file for correct entries.

Verify Ingress status: 
```bash
kubectl get ingress -n bjj-app
```

Check NGINX Ingress Controller health: 
```bash
kubectl get pods -n ingress-nginx
```

Ensure no other local services are using ports 80/443 that might conflict.

Pod CrashLoopBackOff/Error:

Check pod logs: 
```bash
kubectl logs <pod-name> -n bjj-app
```

Describe the pod for events: 
```bash
kubectl describe pod <pod-name> -n bjj-app
```

Common issues include incorrect environment variables, missing secrets, or misconfigured volumes.

Certificate Errors:

Ensure your local certificates in certs/local-certs are valid and correctly referenced in the create_secrets function and values-local.yaml.

Confirm secrets are created: kubectl get secrets -n bjj-app

## 🧹 Cleanup
To stop and remove the Minikube cluster and all deployed resources:

Delete the Minikube cluster:

```bash
minikube delete --profile minikube
```
Remove host file entries:
Manually remove the api.bjj.local and app.bjj.local entries from your /etc/hosts file.

```bash
sudo sed -i '' "/api.bjj.local/d" /etc/hosts
sudo sed -i '' "/app.bjj.local/d" /etc/hosts
```

```bash
sudo sed -i '' "/api.bjj.local/d" /etc/hosts
sudo sed -i '' "/app.bjj.local/d" /etc/hosts
```
