# Architecture Specification: [SYSTEM OR SLICE]

**Created**: [DATE]
**Status**: Draft
**Related**: `docs/architecture.md`, `docs/adr/`, `specs/system-architecture.md`

## Context

[Who uses this, what problem it solves, which repos it touches.]

## Containers

| Container | Runtime | Image / chart | Notes |
|---|---|---|---|
| `bjjeire-frontend` | Caddy + Vite bundle | GHCR, Flux | SPA, MSAL |
| `bjjeire-api` | Java 25 Spring Boot | GHCR, Flux | REST, Entra JWT |
| MongoDB | Mongo | in-cluster | collections in `specs/database-contracts/` |
| `bjjeire-seeder` | Spring `seeder` profile | Job | `seeder/data/` |

Do **not** substitute Azure Container Apps, Cosmos DB, or `azd` unless an ADR
explicitly changes the topology.

## Data contracts

Link each document type:

- [ ] `specs/database-contracts/<entity>.md`

## API contracts

- OpenAPI: produced by `OpenApiContractIT`, published to GHCR
- Pact: `src/bjjeire-app/pacts/BjjEireWeb-BjjEireApi.json`

## Security

- Public reads, Entra JWT writes
- Cloudflare Access at the edge (env-dependent)
- Rate limit fail-open/closed behaviour per environment values
- Feature flags fail closed

## Delivery

```
spec → tests → code → images+contracts (this repo) → Flux (bjjeire-gitops) → AKS
```

## Quality gates

- Path-filtered CI (ADR-0003)
- OpenAPI breaking-change gate (ADR-0002)
- Frontend API compatibility (`gen:api-types` + `tsc`)
- Acceptance: `bjjeire-tests` via `bjjeire-ci-templates`

## Out of scope

[Explicit non-goals]
