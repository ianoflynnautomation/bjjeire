# BJJ Eire

<p align="center">
  <img src="docs/bjjeire.jpg" alt="BJJ Eire" width="800" />
</p>

> A community directory of Brazilian Jiu-Jitsu events and gyms across Ireland.

[![Release](https://github.com/ianoflynnautomation/bjjeire/actions/workflows/release.yml/badge.svg)](https://github.com/ianoflynnautomation/bjjeire/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Java](https://img.shields.io/badge/Java-25-007396?logo=openjdk)](https://openjdk.org/projects/jdk/25/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4-6DB33F?logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org)

## Overview

BJJ Eire is a full-stack application with a React SPA served by Caddy, a Java 25 Spring Boot REST API, and MongoDB persistence.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, TypeScript, Tailwind CSS 4, TanStack Query v5, React Router 7 |
| Web Server | Caddy |
| Backend | Java 25, Spring Boot 4, Spring Web, Spring Data MongoDB, Spring Security |
| Auth | Microsoft Entra ID, MSAL Browser |
| Database | MongoDB |
| Infrastructure | Docker, GHCR, AKS, Flux v2, Istio, Helm |
| Observability | OpenTelemetry, Prometheus, Grafana, Jaeger, Loki |

## Getting Started

### Prerequisites

- Docker Desktop or Docker with Compose v2
- Java 25
- Maven 3.9+
- Node.js for frontend development
- A `.env` file
- A `secrets/` directory containing `mongodb_password.txt`
- A Microsoft Entra ID app registration for API and SPA authentication

### Run with Docker Compose

```bash
docker compose --profile app -f docker-compose.yml -f docker-compose.override.local.yml up --build --wait
```

```bash
docker compose --profile app -f docker-compose.yml -f docker-compose.override.local.yml down
```

### Pull Images from GHCR

```bash
docker login ghcr.io
GHCR_OWNER=ianoflynnautomation docker compose --profile app -f docker-compose.yml -f docker-compose.override.ghcr.yml up --pull always --wait
```

## Configuration

Use `.env` for local configuration:

```env
SPRING_PROFILES_ACTIVE=local
SERVER_PORT=8080
MONGODB_USER=admin
MONGODB_PASSWORD=your-password
MONGODB_DB=Mongodb
ENTRA_ISSUER_URI=https://login.microsoftonline.com/your-tenant-id/v2.0
ENTRA_AUDIENCE=api://your-api-client-id
VITE_APP_MSAL_CLIENT_ID=your-spa-client-id
VITE_APP_MSAL_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
VITE_APP_MSAL_API_SCOPE=api://your-api-client-id/Events.ReadWrite
VITE_APP_CF_BEACON_TOKEN=your-cf-beacon-token
GHCR_OWNER=your-github-username-or-org
API_IMAGE_TAG=latest
FRONTEND_IMAGE_TAG=latest
```

`VITE_APP_*` variables are injected as Docker build arguments and embedded into the frontend bundle at image build time.

## Local Development

Run the backend:

```bash
mvn -pl src/bjjeire-api spring-boot:run
```

Run the frontend:

```bash
cd src/bjjeire-app
npm install
npm run dev
```

## Testing

Backend:

```bash
mvn clean verify
```

Frontend:

```bash
bash build-react.sh
```

## CI/CD

GitHub Actions build, test, release, and publish Docker images to GHCR:

| Workflow | File | Purpose |
|---|---|---|
| Build & Push | `.github/workflows/build-push-ghcr.yml` | Build multi-platform Docker images and push to GHCR |
| Release | `.github/workflows/release.yml` | Automate versioned releases via release-please |

## Versioning

- API tags use `api-v*`.
- Frontend tags use `frontend-v*`.
- Conventional Commits drive release-please.

## License

MIT. See [LICENSE](LICENSE) for details.
