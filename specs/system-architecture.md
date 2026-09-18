# System architecture

**Status**: Living (brownfield)
**Detailed human doc**: [docs/architecture.md](../docs/architecture.md)
**Diagram**: [docs/diagrams/architecture.drawio.svg](../docs/diagrams/architecture.drawio.svg)

A community directory of Brazilian Jiu-Jitsu gyms, events, competitions, and
stores across Ireland. Read-mostly SPA; writes are authenticated.

## Runtime topology

```
Browser (MSAL SPA)
  → Cloudflare (DNS, CDN, WAF, Access)
    → Istio ingress (AKS)
      → bjjeire-frontend (Caddy + Vite bundle)
      → bjjeire-api (Java 25 Spring Boot)
           → MongoDB (Gym, BjjEvent, Competition, Store, AuditLog)
           → Azure Blob (images)
           → Entra ID (JWT audience bjjeire-api-<env>)
           → OTLP collector
      → bjjeire-seeder (one-shot Job)
```

This repository **does not provision the cluster**. Azure, Cloudflare, Entra,
and Flux bootstrap live in sibling terraform/gitops repos. This repository
publishes images and contracts to GHCR.

## Containers

| Name | Source | Notes |
|---|---|---|
| `bjjeire-api` | `src/bjjeire-api` | REST, Entra JWT, rate limit, read-only mode |
| `bjjeire-frontend` | `src/bjjeire-app` + `Caddyfile` | `VITE_APP_*` baked at image build |
| `bjjeire-seeder` | `seeder.Dockerfile` | Spring profile `seeder` |

## API shape

Package-by-feature under `com.bjjeire.api.{gym,event,competition,store}`.

| Feature | Route constant | Collection |
|---|---|---|
| Gyms | `/api/v1/gym` | `Gym` |
| Events | `/api/v1/bjjevent` | `BjjEvent` |
| Competitions | `/api/v1/competition` | `Competition` |
| Stores | `/api/v1/store` | `Store` |
| Feature flags | `/api/v1/featureflag` | (config) |
| Donate | `/api/v1/donate` | (static) |

List endpoints: `page` (1-based), `pageSize` (1–100), optional `county`.
Envelope: `PagedResponse<T>`. Errors: `ProblemDetail` (`urn:bjjeire`).

Public GET; POST/PUT/DELETE require Bearer token.

## Frontend

React 19 + Vite 7 + TypeScript. Feature folders mirror the API. Paginated
lists use `usePaginatedQuery`. Client-side search filters the loaded page
(acceptance tests therefore search-then-assert count, not "visible on page 1").

Feature flags: `DEFAULT_FLAGS → remote → test overrides`. Failed remote fetch
fails closed and redirects feature routes to `/about`.

## Contracts

- OpenAPI from `OpenApiContractIT` → GHCR `bjjeire-openapi-contract`
- Pact `BjjEireWeb-BjjEireApi.json` → GHCR `bjjeire-web-pacts`
- Breaking OpenAPI change blocks the PR and blocks publish on main

## Spec2Cloud mapping (what not to generate)

| Spec2Cloud default | BjjEire actual |
|---|---|
| Azure Container Apps | AKS + Istio + Flux |
| Cosmos DB (Mongo API) | MongoDB in-cluster |
| `azd up` / `infra/main.bicep` | `bjjeire-gitops` HelmRelease |
| Local Azurite | docker-compose / minikube |

`speckit.verify` locally: compose or minikube port-forward, then Playwright.
`speckit.deploy` is out of this repo's hands — change cluster values in
gitops/deploy, not by adding `azure.yaml` here.

## Quality

See constitution (`.specify/memory/constitution.md`) and ADR-0001…0009.
