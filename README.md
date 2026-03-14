

# BJJ Éire

<p align="center">
  <img src="docs/bjjeire.jpg" alt="BJJ Éire" width="800" />
</p>

> A community directory of Brazilian Jiu-Jitsu events and gyms across Ireland.

[![CI Pipeline](https://github.com/ianoflynnautomation/bjjeire/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ianoflynnautomation/bjjeire/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org)

---

## Overview

BJJ Éire is an open-source web application that helps the Irish BJJ community discover gyms and stay up to date with upcoming events. It is built as a modern full-stack application — a React SPA served behind Nginx, backed by a .NET 10 REST API and MongoDB.

---

## Tech Stack

| Layer          | Technology                                                                 |
|----------------|----------------------------------------------------------------------------|
| Frontend       | React 19, Vite 7, TypeScript, Tailwind CSS 4, TanStack Query v5, React Router 7 |
| Backend        | .NET 10 Web API, MediatR, AutoMapper, MongoDB.Driver                       |
| Auth           | Microsoft Entra ID (Azure AD), MSAL Browser                               |
| Observability  | OpenTelemetry, Prometheus, Grafana, Jaeger, Loki, Seq                      |
| Infrastructure | Docker Compose, Kubernetes (Minikube + Helm), Azure Container Registry     |
| Dev Tooling    | .NET Aspire, Dev Container (VS Code / GitHub Codespaces)                   |

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (or Docker + Docker Compose v2)
- A `.env` file — copy from `.env.example` (see [Configuration](#configuration))
- A `secrets/` directory containing `cert_password.txt` and `mongodb_password.txt`
- An Azure AD app registration for API and SPA authentication

### Quick Start

**Build and run locally from source:**

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

**Pull pre-built images from Azure Container Registry:**

```bash
docker login youracrname.azurecr.io

docker compose --profile app \
  -f docker-compose.yml \
  -f docker-compose.override.acr.yml \
  up --pull always --wait
```

**With the full observability stack:**

```bash
docker compose --profile app --profile monitoring \
  -f docker-compose.yml \
  -f docker-compose.override.local.yml \
  -f docker-compose.override.observability.yml \
  up --build --wait
```

**Service endpoints:**

| Service          | URL                       |
|------------------|---------------------------|
| Frontend         | https://localhost:60743   |
| API              | https://localhost:5001    |
| MongoDB          | localhost:27017           |
| Grafana          | http://localhost:3000     |
| Jaeger           | http://localhost:16686    |
| Seq              | http://localhost:5341     |

---

## Configuration

Copy `.env.example` to `.env` and populate the values:

```env
ASPNETCORE_ENVIRONMENT=Development

# MongoDB
MONGODB_USER=admin
MONGODB_PASSWORD=your-password

# Azure Entra ID — API
AZURE_AD_TENANT_ID=your-tenant-id
AZURE_AD_CLIENT_ID=your-api-client-id
AZURE_AD_AUDIENCE=api://your-api-client-id

# MSAL — SPA (baked in at Docker build time via ARG/ENV)
VITE_APP_MSAL_CLIENT_ID=your-spa-client-id
VITE_APP_MSAL_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
VITE_APP_MSAL_API_SCOPE=api://your-api-client-id/Events.ReadWrite
```

> The `VITE_APP_*` variables are injected as Docker build arguments and embedded into the frontend bundle at image build time.

---

## Local Development

The project supports .NET Aspire for an orchestrated local development experience:

```bash
dotnet run --project src/BjjEire.Aspire.AppHost
```

This starts the API, wires up service discovery, and opens the Aspire dashboard at `https://localhost:17191`.

For frontend development:

```bash
cd src/bjjeire-app
npm install
npm run dev
```

Trust the ASP.NET Core developer certificate if you haven't already:

```bash
dotnet dev-certs https --trust
```

---

## Testing

**Backend:**

```bash
bash build-dotnet.sh
```

This runs restore, build, format checks, and the full test suite (excluding Docker-dependent functional tests in CI).

**Frontend:**

```bash
bash build-react.sh
```

Runs TypeScript type-checking, ESLint, Prettier, and Vitest.

**Unit and integration tests directly:**

```bash
dotnet test BjjEire.sln --filter "Category!=Functional"
```

---

## CI/CD

GitHub Actions runs the full pipeline on every push and pull request to `main`:

- .NET restore, build, format, and test
- React type-check, lint, format, and test
- Docker image build and push to Azure Container Registry (on `main`)

Pipeline configuration: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

---

## Contributing

Contributions are welcome. Please open an issue to discuss any significant changes before submitting a pull request.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org)
4. Open a pull request against `main`

---

## License

MIT — Copyright (c) BJJ Éire contributors. See [LICENSE](LICENSE) for details.

