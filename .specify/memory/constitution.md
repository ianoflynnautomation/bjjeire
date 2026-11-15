# BjjEire Constitution

Living principles for every spec, plan, task list, and agent run in this
repository. These are already true of the codebase and ADRs — they are not
aspirational.

## Core Principles

### I. Spec → Contract → Tests → Code → Cloud

A behavioural change starts as a feature spec under `specs/features/`. The
HTTP and document shapes are contracts (`specs/database-contracts/`, the
published OpenAPI artifact, Pact). Tests are written against those contracts
before implementation. This repository publishes images and contracts; Flux
in `bjjeire-gitops` deploys them using the chart in `bjjeire-deploy`. Agents
must not invent an `azd` / Container Apps / Cosmos topology that this system
does not use.

### II. Package-by-feature (NON-NEGOTIABLE)

The Java API is one flat package per feature (`event`, `gym`, `competition`,
`store`, and for in-house tournaments `tournament`, `competitor`,
`registration`) holding controller, service, DTOs, domain, mapper, validator, and
repository together. Shared code lives only in `common`, `audit`,
`deactivation`, `web`, `config`, and `seeder`. New backend types go in their
feature package. See ADR-0001.

### III. Contracts are artifacts, not comments

The served OpenAPI document and the SPA Pact file are published to GHCR and
gated in CI. Renaming a DTO, command, or domain type is a breaking API
change. A PR that changes the wire shape MUST update the feature spec, the
database contract, the SPA types, and the Playwright Zod schemas in
`bjjeire-tests` in the same change set (or an explicit follow-up issue).
See ADR-0002.

### IV. Test-first at the layer that owns the behaviour

- API/domain: JUnit unit tests first, then Testcontainers `*IT` against real
  MongoDB. Never mock Mongo in integration tests.
- SPA: Vitest unit/integration first (`renderWithProviders`, factories).
- Acceptance: Playwright in `bjjeire-tests` against seeded data. Those tests
  are the product's external contract, not this repo's unit suite.

Red → Green → Refactor. Do not ship implementation for a new behaviour
without a failing test already in place.

### V. Public reads, authenticated writes, fail-closed flags

List/get endpoints of the directory are public. Directory
create/update/delete require the admin's Entra JWT
(`Authorization: Bearer`, scope `access_as_writer`). That rule is the
catch-all: any write not named below needs the admin authority.

Two additions serve in-house tournaments and nothing else:

- **Competitor routes** (`/api/v1/competitor`, `/api/v1/registration`)
  require a token from the competitor issuer. A competitor may read and
  change only their own profile and sign-ups, and has no authority over the
  directory or over tournaments. See ADR-0012.
- **The Stripe webhook** is the one write with no bearer token. It is
  authenticated by Stripe's signature. See ADR-0013.

Tournament, competitor and registration routes are governed by the
`Tournaments` flag, not by read-only mode. Read-only mode keeps protecting
the directory.

Feature flags fail closed: a failed flag fetch redirects feature routes to
`/about`. Agents must not "fix" that by stubbing flags in production code.

## Additional Constraints

### Data

- MongoDB document IDs are 24-char hex ObjectIds.
- GeoJSON coordinates are `[longitude, latitude]` — the most common data bug.
- Seeder JSON uses `"isAvailable": false`, never `null`.
- Environments hold full datasets. Never assert a fixture is on page 1 of an
  unfiltered list.

### Frontend

- Three themes: light, dark and competition, applied by `useTheme` (ADR-0011,
  which supersedes ADR-0007). Colours come from the semantic tokens in
  `src/bjjeire-app/src/index.css`. `PageLayout` stays transparent.
- All user-visible strings live in `src/bjjeire-app/src/config/ui-content.ts`.
- Data test IDs live in `src/bjjeire-app/src/constants/*DataTestIds.ts`.
- `VITE_APP_*` values are baked at image build time (ADR-0006).

### Delivery

- Path filters gate almost every CI job (ADR-0003). A job not listed in
  `pr_complete.needs` / `main_complete.needs` gates nothing.
- `atest_analyze` is advisory and must stay out of aggregators (ADR-0005).
- Images are promoted by digest (ADR-0004).
- Reusable workflows are SHA-pinned to `bjjeire-ci-templates`.

### Cloud (Spec2Cloud mapping)

This product already has a cloud architecture. Spec2Cloud `verify`/`deploy`
commands that assume `azure.yaml` + Bicep + Container Apps do **not** apply
as-is. Deploy is Flux reconciliation from `bjjeire-gitops`. Local verify is
`docker-compose` / minikube, not Azurite. Document Azure topology in
`specs/system-architecture.md`; do not generate a parallel stack.

## Development Workflow

1. Read the ADR table in `AGENTS.md` for the surface you are touching.
2. Update or add `specs/features/<feature>.md` and any database contract.
3. Write tests at the owning layer; confirm they fail for the right reason.
4. Implement in the feature package / feature folder.
5. Run the smallest verification: targeted Maven tests, then `npm run lint && npm run typecheck && npm test` for SPA changes.
6. If the OpenAPI surface moved, expect `check_openapi_breaking` and
   `check_frontend_api_compat` to fire — fix the SPA in the same PR.

## Governance

This constitution supersedes local convenience. PRs and agentic reviews
(`spec-review`, `schema-drift`) must check it. Amendments require an ADR,
a constitution version bump, and a migration note for in-flight specs.

### Amendment 1.1.0 (2026-11-13)

Principle V gained competitor routes and the Stripe webhook; principle II
gained three feature packages (ADR-0012, ADR-0013). Migration for in-flight
specs: none needed. A spec that adds a write must say which of the three
kinds it is (admin, competitor, signed webhook); anything else is still an
admin write.

**Version**: 1.1.0 | **Ratified**: 2026-09-18 | **Last Amended**: 2026-11-13
