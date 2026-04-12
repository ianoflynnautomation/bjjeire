

# BJJ Éire

<p align="center">
  <img src="docs/bjjeire.jpg" alt="BJJ Éire" width="800" />
</p>

> A community directory of Brazilian Jiu-Jitsu events and gyms across Ireland.

[![CI Pipeline](https://github.com/ianoflynnautomation/bjjeire/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ianoflynnautomation/bjjeire/actions/workflows/ci.yml)
[![Release](https://github.com/ianoflynnautomation/bjjeire/actions/workflows/release.yml/badge.svg)](https://github.com/ianoflynnautomation/bjjeire/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org)

---

## Overview

BJJ Éire is an open-source web application that helps the Irish BJJ community discover gyms and stay up to date with upcoming events. It is built as a modern full-stack application — a React SPA served by Caddy, backed by a .NET 10 REST API and MongoDB, deployed to AKS via Flux GitOps with Cloudflare CDN.

---

## Tech Stack

| Layer          | Technology                                                                 |
|----------------|----------------------------------------------------------------------------|
| Frontend       | React 19, Vite 7, TypeScript, Tailwind CSS 4, TanStack Query v5, React Router 7 |
| Web Server     | Caddy (HTTP only — TLS terminated at Istio gateway / Cloudflare edge)      |
| Backend        | .NET 10 Web API, MediatR, AutoMapper, MongoDB.Driver                       |
| Auth           | Microsoft Entra ID (Azure AD), MSAL Browser                               |
| CDN & DNS      | Cloudflare (free tier) — proxied DNS, CDN caching, DDoS protection, Web Analytics |
| Observability  | OpenTelemetry, Prometheus, Grafana, Jaeger, Loki, Seq                      |
| Infrastructure | AKS, Flux v2 GitOps, Istio service mesh, Helm, Docker, GHCR               |
| Secrets        | Azure Key Vault + External Secrets Operator                                |
| Dev Tooling    | .NET Aspire, Docker Compose, Dev Container (VS Code / GitHub Codespaces)   |

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

**Pull pre-built images from GitHub Container Registry:**

```bash
docker login ghcr.io

GHCR_OWNER=ianoflynnautomation \
docker compose --profile app \
  -f docker-compose.yml \
  -f docker-compose.override.ghcr.yml \
  up --pull always --wait
```

```bash
docker compose --profile app \
  -f docker-compose.yml \
  -f docker-compose.override.ghcr.yml \
  down
```

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

# Cloudflare Web Analytics (baked in at Docker build time — get token from Cloudflare dashboard)
VITE_APP_CF_BEACON_TOKEN=your-cf-beacon-token

# GitHub Container Registry (for docker-compose.override.ghcr.yml)
GHCR_OWNER=your-github-username-or-org
API_IMAGE_TAG=latest
FRONTEND_IMAGE_TAG=latest
```

> The `VITE_APP_*` variables are injected as Docker build arguments and embedded into the frontend bundle at image build time. `VITE_APP_CF_BEACON_TOKEN` is a public token — safe to commit to `.env.example` but keep your real token out of source control. The analytics beacon only loads in production builds and is silently skipped if the token is absent.

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

This runs restore, build, format checks, and the full test suite (unit + integration).

**Frontend:**

```bash
bash build-react.sh
```

Runs TypeScript type-checking, ESLint, Prettier, and Vitest.

**Unit and integration tests directly:**

```bash
dotnet test BjjEire.sln --filter "Category!=Ignore"
```

---

## CI/CD

Two GitHub Actions workflows run on every push and pull request to `main`:

| Workflow | File | Purpose |
|---|---|---|
| CI Pipeline | [`ci.yml`](.github/workflows/ci.yml) | Lint, build, and test (.NET + React) |
| Build & Push | [`build-push-ghcr.yml`](.github/workflows/build-push-ghcr.yml) | Build multi-platform Docker images and push to GHCR |
| Release | [`release.yml`](.github/workflows/release.yml) | Automate versioned releases via release-please |

Docker images are published to `ghcr.io/ianoflynnautomation/bjjeire-api`, `ghcr.io/ianoflynnautomation/bjjeire-frontend`, and `ghcr.io/ianoflynnautomation/bjjeire-seeder`. Images are tagged with the git SHA, semver version (on tags), and `latest` on `main`.

After a frontend release, the workflow automatically purges the Cloudflare CDN cache for `index.html` so users see the new version immediately.

---

## Deployment Architecture

```
User → Cloudflare CDN (DNS + proxy) → Azure LB → Istio Gateway → HTTPRoute → Pod
```

The app is deployed to **Azure Kubernetes Service (AKS)** via **Flux v2 GitOps**:

- **Flux ImageUpdateAutomation** watches GHCR for new semver tags and opens PRs to update image tags in the GitOps repo
- **Istio** service mesh handles mTLS between pods, Gateway API for ingress, and HTTP→HTTPS redirect
- **cert-manager** provisions wildcard Let's Encrypt TLS certs via Cloudflare DNS-01 challenge
- **ExternalDNS** manages Cloudflare DNS records (proxied orange-cloud) from Gateway annotations
- **External Secrets Operator** syncs secrets from Azure Key Vault into Kubernetes

### Repos

| Repo | Purpose |
|---|---|
| `bjjeire` (this repo) | App source — API, frontend, seeder, CI/CD |
| `bjjeire-deploy` | Helm charts — umbrella + sub-charts (api, frontend, mongodb) |
| `bjjeire-gitops` | Flux GitOps — HelmRelease, ExternalSecrets, NetworkPolicy, image automation |
| `bjjeire-terraform-azurerm-aks` | Terraform — AKS cluster, storage, identity |

---

## GitHub Secrets

### Required for CI/CD (`release.yml`)

| Secret | Purpose |
|---|---|
| `VITE_APP_MSAL_CLIENT_ID` | Azure AD SPA client ID (baked into frontend bundle) |
| `VITE_APP_MSAL_AUTHORITY` | Azure AD authority URL |
| `VITE_APP_MSAL_API_SCOPE` | API scope for MSAL token requests |
| `VITE_APP_URL` | Production app URL (e.g. `https://bjjeire.com`) |
| `VITE_APP_CF_BEACON_TOKEN` | Cloudflare Web Analytics beacon token |
| `VITE_APP_CONTACT_EMAIL` | Contact email shown in footer |
| `VITE_APP_SOCIAL_INSTAGRAM_URL` | Instagram profile URL |
| `VITE_APP_SOCIAL_FACEBOOK_URL` | Facebook page URL |
| `VITE_APP_GITHUB_URL` | GitHub repo URL |
| `CLOUDFLARE_ZONE_ID` | Cloudflare zone ID for CDN cache purge |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with `Zone.Cache Purge` permission |

### Azure Key Vault secrets (synced via ESO)

| KV Secret Name | Maps to | Purpose |
|---|---|---|
| `bjj-mongodb-root-password` | `ConnectionStrings__Mongodb` | MongoDB root password |
| `bjj-api-kestrel-cert-password` | Kestrel cert password | HTTPS cert for API pod |
| `bjj-api-kestrel-pfx` | PFX cert file | Kestrel TLS certificate |
| `bjj-azure-ad-tenant-id` | `AzureAd__TenantId` | Azure AD tenant |
| `bjj-azure-ad-client-id` | `AzureAd__ClientId` | Azure AD API client |
| `bjj-azure-ad-audience` | `AzureAd__Audience` | Azure AD API audience |
| `bjj-donation-bitcoin-address` | `Donation__BitcoinAddress` | BTC donation address |
| `ghcr-pat` | GHCR pull secret | Image pull authentication |
| `cloudflare-api-token` | ExternalDNS + cert-manager | DNS management + TLS provisioning |

---

---

## Versioning & Releases

This project follows [Semantic Versioning 2.0](https://semver.org) and [Conventional Commits](https://www.conventionalcommits.org).

### How it works

- **API** is versioned independently with the tag prefix `api-v` (e.g. `api-v1.2.3`). Version is resolved at build time by [MinVer](https://github.com/adamralph/minver) — no manual `.csproj` edits needed.
- **Frontend** is versioned independently with the tag prefix `frontend-v` (e.g. `frontend-v1.2.3`). Version is tracked in `package.json` and exposed at runtime as `__APP_VERSION__`.
- [release-please](https://github.com/googleapis/release-please) opens a PR automatically when conventional commits land on `main`. Merging the PR creates the git tag, GitHub Release, and CHANGELOG.

### Commit message format

```
<type>(<optional scope>): <description>

[optional body]

[optional footer — BREAKING CHANGE: ...]
```

| Type | Effect |
|---|---|
| `feat:` | bumps MINOR |
| `fix:` | bumps PATCH |
| `feat!:` / `BREAKING CHANGE:` | bumps MAJOR |
| `chore:`, `docs:`, `refactor:`, `ci:` | no version bump |

### Creating a prerelease

Tag manually with the appropriate suffix:

```bash
git tag api-v1.2.0-beta.1
git push origin api-v1.2.0-beta.1
```

The Docker image will be tagged `1.2.0-beta.1` and the GitHub Release will be marked as a prerelease automatically.

---

## Seed Data

The project ships with example gyms and events in `src/BjjEire.Seeder/data/` so the app is useful out of the box. The seeder is idempotent — running it multiple times is safe.

### Run locally (Docker Compose)

Start the app stack first, then seed on demand:

```bash
docker compose --profile app \
  -f docker-compose.yml \
  -f docker-compose.override.local.yml \
  up --build --wait
```

```bash
docker compose --profile seed \
  -f docker-compose.yml \
  -f docker-compose.override.local.yml \
  run --rm seeder
```

### Run locally (dotnet)

```bash
# Preview what would change — no writes
dotnet run --project src/BjjEire.Seeder -- --dry-run

# Seed all collections
dotnet run --project src/BjjEire.Seeder

# Seed a single collection
dotnet run --project src/BjjEire.Seeder -- --collection Gym

# Override environment gate (e.g. pointing at a staging DB)
ConnectionStrings__Mongodb="mongodb://user:pass@host:27017/bjjeire" \
  dotnet run --project src/BjjEire.Seeder -- --force
```

### Adding new data

1. Edit `src/BjjEire.Seeder/data/gyms.json` or `data/bjj-events.json`
2. Each document must have a stable `id` field (24-character hex ObjectId) — generate one with `python3 -c "from bson import ObjectId; print(ObjectId())"`
3. Open a pull request — CI validates JSON schema on every PR
4. After merge, a maintainer applies the seed to production

### Seed a new collection type

1. Add a JSON file to `src/BjjEire.Seeder/data/`
2. Register it in `src/BjjEire.Seeder/CollectionRunner.cs`:

```csharp
("Instructor", s => s.SeedAsync<Instructor>("Instructor", "data/instructors.json")),
```

---

## Contributing

Contributions are welcome. Please open an issue to discuss any significant changes before submitting a pull request.

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org) — enforced by commitlint
4. Open a pull request against `main`

---

## License

MIT — Copyright (c) BJJ Éire contributors. See [LICENSE](LICENSE) for details.
