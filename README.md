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

![Architecture](docs/diagrams/architecture.drawio.svg)

## Documentation

| | |
|---|---|
| **[Architecture](docs/architecture.md)** | Runtime topology, package-by-feature API. The [end user flow](#end-user-flow) and [delivery flow](#delivery-flow) are below |
| **[CI/CD](docs/ci-cd.md)** | [CI PR sequence](docs/ci-cd.md#ci-pr-sequence), [CI Main sequence](docs/ci-cd.md#ci-main-sequence), job graphs, path filters, promotion |
| **[Decisions (ADRs)](docs/adr/)** | Why the API is package-by-feature, why contracts ship as OCI artifacts, why flake analysis gates nothing |
| **[All docs](docs/)** | Full index |
| **[AGENTS.md](AGENTS.md)** | Conventions and guardrails — for coding agents and new contributors alike |

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
docker compose --profile app -f docker-compose.yml -f docker-compose.override.java-local.yml up --build --wait

docker compose --profile seed -f docker-compose.yml -f docker-compose.override.java-local.yml run --rm --build seeder
```

```bash
docker compose --profile app -f docker-compose.yml -f docker-compose.override.java-local.yml down
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

## End user flow

A visitor reads the public catalogue. List and detail GETs need no account.
Home sends the visitor to the first enabled section, or to About when none
are enabled. A write sends an Entra bearer token and needs the writer role.

```mermaid
sequenceDiagram
    participant User as Visitor
    participant Edge as Cloudflare
    participant SPA as bjjeire-app
    participant API as bjjeire-api
    participant DB as MongoDB

    User->>Edge: Open the site
    Edge->>SPA: Serve the bundle through Istio
    SPA->>API: GET /api/v1/featureflag
    API-->>SPA: Return the enabled sections
    SPA-->>User: Show events, gyms, competitions, or stores
    User->>SPA: Open a list
    SPA->>API: GET /api/v1/gym, bjjevent, competition, or store
    API->>DB: Read the page
    DB-->>API: Return documents
    API-->>SPA: Return JSON
    SPA-->>User: Render the page
```

The same picture is in [docs/architecture.md](docs/architecture.md#end-user-flow).

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

GitHub Actions build, test, release, and publish Docker images and contracts to
GHCR. Job sequences, gating rules, and failure modes are in
[docs/ci-cd.md](docs/ci-cd.md).

### Delivery flow

`ci-pr.yml` decides whether a pull request can merge. `ci-main.yml` publishes
what this repository owns. Neither workflow deploys to a cluster.

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant PR as ci-pr.yml
    participant Main as ci-main.yml
    participant GHCR as GHCR
    participant Rel as release.yml
    participant Flux as Flux
    participant Git as bjjeire-gitops

    Dev->>PR: Open a pull request to main
    PR->>PR: Path filters, then the merge gates
    PR-->>Dev: pr_complete
    Dev->>Main: Merge to main
    par Contracts and images
        Main->>GHCR: Publish OpenAPI and Pact
    and
        Main->>GHCR: Push image digests
        Main->>GHCR: Tag the accepted digests :main
    end
    Rel->>GHCR: Retag :main as vX.Y.Z and latest
    Flux->>GHCR: Select the highest vX.Y.Z tag in policy range
    Flux->>Git: Commit the dev overlay tag onto main
    Git-->>Flux: Reconcile the dev HelmRelease
    Dev->>Git: Open a pull request for the staging or prod tag
    Git-->>Dev: Review and merge
    Git-->>Flux: Reconcile that cluster
```

Ephemeral acceptance sits between the image push and the `:main` tag when
`ACCEPTANCE_AKS_ENABLED` is true. While that flag is off, a skipped acceptance
still allows the tag. Contract publish and the image build overlap.

`release.yml` retags `:main` only when release-please cuts a release, and it
does not wait on `ci-main.yml`. Flux follows `vX.Y.Z`, not `:main`. On dev,
image automation commits that tag straight to `bjjeire-gitops` `main`. It does
not open a pull request. Staging and prod change through a reviewed pull
request in that repo, and Flux reconciles after the merge.

The same picture is in [docs/architecture.md](docs/architecture.md#delivery-flow).
The job sequences are [CI PR](docs/ci-cd.md#ci-pr-sequence) and
[CI Main](docs/ci-cd.md#ci-main-sequence).

| Workflow | File | Purpose |
|---|---|---|
| **CI PR** | `.github/workflows/ci-pr.yml` | Merge gate: build, test, contract checks, Compose `@smoke`. `pr_complete` is the required check |
| **CI Main** | `.github/workflows/ci-main.yml` | Publish contracts, build images, ephemeral acceptance, promote digests to `:main` |
| Build & Push | `.github/workflows/build-push-ghcr.yml` | Multi-arch image build, scan, attest, push |
| PR Env Validation | `.github/workflows/pr-env-validation.yml` | Opt-in `deploy-preview` label: Flux preview on AKS + Playwright acceptance |
| Release | `.github/workflows/release.yml` | Versioned releases via release-please |
| Audit Release Report | `.github/workflows/audit-release.yml` | Compliance pack (release ID, SHA-256 catalog, PDF + Step Summary) |

Debugging a red acceptance job: [docs/acceptance-ci-debug.md](docs/acceptance-ci-debug.md).
Audit-ready release PDF: [docs/release-test-report.md](docs/release-test-report.md).

## Versioning

- API tags use `api-v*`.
- Frontend tags use `frontend-v*`.
- Conventional Commits drive release-please.

## License

MIT. See [LICENSE](LICENSE) for details.
