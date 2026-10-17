# Architecture

A community directory of Brazilian Jiu-Jitsu events, gyms, competitions, and
stores across Ireland. React SPA served by Caddy, Java Spring Boot REST API,
MongoDB persistence, deployed to AKS by Flux from a separate GitOps repo.

## Runtime topology

```mermaid
flowchart LR
    U["Browser<br>MSAL SPA"] --> CF["Cloudflare<br>DNS · CDN · WAF · Access"]
    CF --> IN["Istio ingress<br>AKS"]
    IN --> FE["bjjeire-frontend<br>Caddy serving the Vite bundle"]
    IN --> API["bjjeire-api<br>Spring Boot"]
    API --> DB[("MongoDB")]
    SEED["bjjeire-seeder<br>one-shot Job"] --> DB
    API --> BLOB["Azure Blob<br>images"]

    U -.->|"acquire token"| ENTRA["Microsoft Entra ID"]
    ENTRA -.->|"JWT"| API
    API -.->|"OTLP"| OTEL["OpenTelemetry collector"]

    classDef ext fill:#F3F4F6,stroke:#6B7280
    class ENTRA,BLOB,OTEL,CF ext
```

The SPA and API are separate images behind the same ingress. The browser
authenticates against Entra with MSAL and attaches the resulting JWT; the API
validates it against the `bjjeire-api-<env>` audience. Nothing in this
repository provisions the cluster or the edge — see
[repository boundaries](#repository-boundaries).

A detailed, editable version is
[`diagrams/architecture.drawio.svg`](diagrams/architecture.drawio.svg).

## End user flow

A visitor reads the public catalogue. `GET` of `/api/v1/featureflag` and of
the event, gym, competition, store, and donate resources needs no account.
`/` redirects to the first enabled section among events, gyms, competitions,
and stores, or to `/about` when none are enabled. `POST`, `PUT`, `PATCH`, and
`DELETE` require an Entra bearer token with the writer role. The SPA attaches
that token only on a non-GET request when an MSAL account is present.

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

The same sequence is on the [README](../README.md#end-user-flow). Edit both
together. How a change is built and shipped is the [delivery flow](#delivery-flow).

## Repository layout

```
pom.xml                      # aggregator
src/
  bjjeire-api/               # Java 25 · Spring Boot 4
    src/main/java/com/bjjeire/api/
    src/main/resources/      # application.yml, application-seeder.yml
    Dockerfile, seeder.Dockerfile
  bjjeire-app/               # React 19 · Vite 7 · TypeScript
    src/
    Dockerfile
seeder/data                  # seed JSON for real data
seeder/data-test             # seed JSON for test environments
tools/images                 # image assets shipped in the frontend container
Caddyfile                    # frontend web server config
docker-compose*.yml          # local and CI stacks
.github/workflows/           # see ci-cd.md
```

## API — package by feature

The Java API is **package-by-feature**, not layered. One flat package per
feature holds its controller, service, DTOs, domain model, validation, mapper,
and repository together:

```
com/bjjeire/api/
  event/          competition/     gym/          store/
  common/         audit/           deactivation/
  web/            config/          seeder/
```

A feature package is self-contained. `event/` holds `BjjEventController`,
`BjjEventService` and `BjjEventServiceImpl`, `BjjEventRepository`, `BjjEvent`, `BjjEventDto`,
`BjjEventMapper`, `BjjEventDtoValidator`, the command/response records, and the
feature's enums (`EventStatus`, `PricingType`, `WeekDay`) — roughly 25 types
that only that feature uses.

**New backend code goes in its feature package**, never in a shared layered
package. See [ADR-0001](adr/0001-package-by-feature-api.md).

| Shared package | Holds |
|---|---|
| `common` | `County`, `Location`, `GeoCoordinates`, `PagedResponse`, `PaginationRequest`, `ApiRoutes`, `ApiCache`, `ValidObjectId` |
| `web` | `ApiExceptionHandler`, `FeatureFlagController`, `DonateController`, `OperationalEndpointController` |
| `config` | Security, Mongo, OpenAPI, rate limiting, read-only mode, request logging, security headers |
| `audit` | Audit trail |
| `deactivation` | Soft-delete / deactivation across features |
| `seeder` | Seed loading, run under the `seeder` Spring profile |

Controllers stay thin and delegate to services.

### Cross-cutting filters

`config/` registers a filter chain worth knowing about before debugging a
request: `SecurityConfig` (Entra JWT validation), `RateLimitFilter`,
`ReadOnlyModeFilter`, `SecurityHeadersFilter`, `RequestLoggingFilter`, and
`ClientIps` for resolving the caller behind Cloudflare.

`MongoIndexInitializer` creates the compound indexes the list queries use and
rewrites a missing `endDate` to a sentinel so those queries stay one range. A
failure to build any of those indexes stops startup.

`ApiCache` is an in-process cache with a five-minute write expiry. A write or
deactivation sweep evicts entries only on the replica that performed it. Other
replicas can serve the previous page until that entry expires.

### Conventions

- **GeoJSON coordinates are `[longitude, latitude]`.** This is the opposite of
  how people say it, and it is the most common data bug in this codebase.
- Paginated endpoints return `PagedResponse` with `PaginationMetadata`.
- Seeder JSON uses `"isAvailable": false`, never `null`.

## Frontend

```
src/bjjeire-app/src/
  features/       bjjevents · competitions · gyms · stores · feature-flags
  pages/          one page component per route
  components/     shared UI
  hooks/          usePaginatedQuery and friends
  services/       API clients
  contracts/      Pact consumer tests
  config/         ui-content.ts — all user-visible strings
  constants/      *DataTestIds.ts
  lib/            CVA variants
  types/          generated API types
  testing/        test utilities
```

Conventions the linters do not catch:

- Cross-folder imports use `@/`; same-folder imports stay relative.
- Components are `memo(function ComponentName())`.
- **All user-visible strings** live in `config/ui-content.ts`.
- Data test IDs come from `constants/*DataTestIds.ts` — never inline literals.
- CVA variants live in `lib/`.
- **Three themes:** light (bright), dark, and competition, applied by `useTheme` ([ADR-0011](adr/0011-light-dark-competition-themes.md)). `PageLayout` stays transparent.
- Paginated lists use `usePaginatedQuery`.
- `useSearchParams` tests need `MemoryRouter` from `react-router`.

The bundle is served by Caddy in the `bjjeire-frontend` image, with images from
`tools/images` copied in and cached at the Cloudflare edge.

## Contract testing

Two contracts are generated in CI and published as OCI artifacts to GHCR:

```mermaid
flowchart LR
    API["Spring Boot<br>springdoc"] -->|OpenApiContractIT| SPEC["openapi-v1.json"]
    SPA["Vitest Pact tests"] -->|test:pact| PACT["BjjEireWeb-BjjEireApi.json"]

    SPEC --> GATE{"breaking<br>change?"}
    GATE -->|yes| BLOCK["block PR / block publish"]
    GATE -->|no| PUB["publish to GHCR"]
    PACT --> PUB

    SPEC -.->|"gen:api-types + tsc"| COMPAT["frontend compatibility check"]
```

- **OpenAPI** is produced by an integration test (`OpenApiContractIT`) against
  springdoc, so the published spec is the one the running app actually serves.
- **Pact** is the consumer contract the SPA asserts against.
- Both are pushed to `ghcr.io/<owner>/bjjeire-openapi-contract` and
  `bjjeire-web-pacts`, tagged `<sha>`, `main`, and `latest`.
- A breaking OpenAPI change blocks the PR *and* blocks publish on main.

Details: [ADR-0002](adr/0002-contracts-as-oci-artifacts.md) and
[contract-testing.md](contract-testing.md).

## Configuration

`.env` drives local runs; `secrets/mongodb_password.txt` holds the database
password. The API reads Entra settings from `ENTRA_ISSUER_URI` and
`ENTRA_AUDIENCE`.

**`VITE_APP_*` variables are Docker build arguments**, baked into the bundle at
image build time — not read at runtime. Changing one requires a rebuild, and a
stale value ships a frontend pointing at the wrong API or tenant. See
[ADR-0006](adr/0006-vite-config-is-baked-at-image-build.md).

## Repository boundaries

| Repository | Owns |
|---|---|
| **bjjeire** (this repo) | API, SPA, seeder, their images and contracts |
| [bjjeire-terraform-azurerm-aks](https://github.com/ianoflynnautomation/bjjeire-terraform-azurerm-aks) | Azure, Cloudflare, Entra, identities, Key Vault, and the CI variables this repo reads |
| [bjjeire-terraform-gitops-flux-bootstrap](https://github.com/ianoflynnautomation/bjjeire-terraform-gitops-flux-bootstrap) | Flux bootstrap |
| [bjjeire-gitops](https://github.com/ianoflynnautomation/bjjeire-gitops) | Everything in-cluster: Flux, Istio, observability, app releases |
| [bjjeire-deploy](https://github.com/ianoflynnautomation/bjjeire-deploy) | The `bjj-eire` umbrella Helm chart |
| [bjjeire-tests](https://github.com/ianoflynnautomation/bjjeire-tests) | Playwright suites this repo's CI calls |
| [bjjeire-ci-templates](https://github.com/ianoflynnautomation/bjjeire-ci-templates) | Reusable workflows and composite actions |

This repository publishes **images and contracts**. It does not deploy them —
Flux does, from `bjjeire-gitops`, using the chart from `bjjeire-deploy`.
A code change reaching production is three repositories' worth of movement.

## Delivery flow

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
still allows the tag. Contract publish does not wait for the image build, and
the image build does not wait for contract publish.

`release.yml` retags `:main` as `vX.Y.Z` and `latest` only when release-please
cuts a release. It does not wait on `ci-main.yml`. If `:main` is missing, that
job fails and is re-run after promotion. The dev ImagePolicy matches
`^vX.Y.Z$`, so a `:main` tag alone does not move the cluster.

Image automation is installed only on the dev cluster
(`kubernetes/apps/overlays/aks-bjjeire-dev-sdc-01`). `ImageUpdateAutomation`
checks out `main`, commits `chore(flux): update bjj-eire image tags`, and
pushes that branch. There is no Flux pull request to review. Staging and prod
overlays carry `$imagepolicy` markers, and their kustomizations do not install
the automation. A person opens the pull request that changes those tags.
After it merges, Flux on that cluster reconciles the HelmRelease.

The sequences to edit when a CI job is added or removed are
[CI PR](ci-cd.md#ci-pr-sequence) and [CI Main](ci-cd.md#ci-main-sequence).
Each one is followed by the job DAG in the same file. Keep this picture at the
workflow boundary. The same sequence is on the
[README](../README.md#delivery-flow). Edit both together.

## Where to go next

- [ci-cd.md](ci-cd.md) — CI PR and CI main sequences, job graphs, and path filters
- [adr/](adr/) — why the platform is shaped this way
- [contract-testing.md](contract-testing.md) — Pact and OpenAPI workflow
- [acceptance-ci-debug.md](acceptance-ci-debug.md) — debugging a red acceptance job
- [cutover-checklist.md](cutover-checklist.md) — release cutover steps
