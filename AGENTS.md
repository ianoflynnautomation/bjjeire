# BjjEire — Agent Instructions

This is the single source of agent instructions for this repository.
`CLAUDE.md` points here — keep changes in this file.

## Read this before you change anything

Several things here look like inconsistencies and are deliberate. The reasoning
lives in [docs/adr/](docs/adr/); read the relevant record before reversing one.

| If you are touching… | Read first |
|---|---|
| Where a new backend class goes | [ADR-0001](docs/adr/0001-package-by-feature-api.md) |
| The API's HTTP surface | [ADR-0002](docs/adr/0002-contracts-as-oci-artifacts.md) — a breaking change blocks the merge |
| A CI workflow or a path filter | [ADR-0003](docs/adr/0003-path-filtered-ci-with-aggregator-gate.md) — a job not in the aggregator gates nothing |
| Image tagging or promotion | [ADR-0004](docs/adr/0004-promote-images-by-digest.md) |
| `atest_analyze` / flaky tests | [ADR-0005](docs/adr/0005-flake-analysis-is-advisory.md) — never add it to an aggregator |
| Any `VITE_APP_*` value | [ADR-0006](docs/adr/0006-vite-config-is-baked-at-image-build.md) — baked at build time, not runtime |
| Colours, themes, `PageLayout` | [ADR-0007](docs/adr/0007-dark-theme-only.md) |
| User-visible copy or test IDs | [ADR-0008](docs/adr/0008-ui-strings-and-test-ids-are-centralised.md) |
| Test reporting jobs | [ADR-0009](docs/adr/0009-audit-report-on-every-pipeline.md) |

Architecture: [docs/architecture.md](docs/architecture.md).
Pipelines: [docs/ci-cd.md](docs/ci-cd.md).
Full index: [docs/README.md](docs/README.md).

## Working Style

- Inspect nearby code before changing anything. Follow existing patterns instead of inventing new structure.
- Prefer `rg` and `rg --files` for search.
- Use `apply_patch` for manual edits. Do not use destructive git commands to clean the tree.
- Never revert unrelated user changes. This repo may be dirty.
- Prefer non-interactive commands. Run the smallest useful verification for the code you changed.
- Make reasonable assumptions, but pause if a choice would change architecture, data shape, or public API.

## Project Overview

Full-stack BJJ directory for Ireland:

- Java 25 Spring Boot API in `src/bjjeire-api`
- React 19 + TypeScript SPA in `src/bjjeire-app`
- MongoDB persistence

## Verification Commands

### Java
```bash
mvn clean verify
mvn -pl src/bjjeire-api test
mvn -pl src/bjjeire-api spring-boot:run
```

### React
```bash
cd src/bjjeire-app
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
```

### Verification Order

- Frontend: `lint -> typecheck -> test`
- Backend: prefer targeted Maven tests first, then `mvn clean verify` when needed

## Architecture Guardrails

- The Java API is package-by-feature: one flat package per feature (`event`, `gym`, `competition`, `store`) with its controller, service, DTOs, domain model, and repository together. Shared code lives in `common`, `audit`, `deactivation`, `web`, and `config`.
- Controllers stay thin and delegate use cases to services.
- Put new backend code in its feature package, not in a shared/layered package.
- GeoJSON coordinates are `[longitude, latitude]`.

## Frontend Guardrails

- Cross-folder imports use `@/`; same-folder imports stay relative.
- Components use `memo(function ComponentName())`.
- All user-visible strings live in `src/bjjeire-app/src/config/ui-content.ts`.
- Data test IDs come from `src/bjjeire-app/src/constants/*DataTestIds.ts`.
- CVA variants live in `src/bjjeire-app/src/lib/`.
- Dark theme only; do not introduce light `PageLayout` backgrounds.
- Paginated list endpoints use `usePaginatedQuery`.

## Testing Guardrails

- TDD first: write the failing test before implementation.
- `useSearchParams` tests must use `MemoryRouter` from `react-router`.
- Wrap nullable array defaults in `useMemo(() => data ?? [], [data])`.
- `useEffect` cleanup functions need an explicit return type when returning cleanup.
- Seeder JSON must use `"isAvailable": false`, never `null`.

## Config Notes

- `.env` is required.
- `secrets/` should contain `mongodb_password.txt`.
- `VITE_APP_*` variables are baked in at Docker build time, not runtime.

## CI Guardrails

Full detail in [docs/ci-cd.md](docs/ci-cd.md). The parts that bite:

- **Path filters gate almost every job.** If a job you expected did not run,
  check [`.github/path-filters.yml`](.github/path-filters.yml) before assuming
  the pipeline is broken. A filter that is too narrow lets a breaking change
  through untested.
- **`java_api_image` is deliberately narrower than `java_api`** — a test-only
  change runs tests without rebuilding an image.
- **Adding a job does not gate merges** until it is also in `pr_complete.needs`
  (or `main_complete.needs`). The one job that must stay out is
  `atest_analyze`.
- **Reusable workflows are SHA-pinned** to `bjjeire-ci-templates` v1.6.2. Bump
  the pin deliberately; do not float on a tag or `@main`.
- **Changing the API surface breaks two checks by design**:
  `check_openapi_breaking` and `check_frontend_api_compat`. Fix the SPA in the
  same pull request.
- Force the Compose smoke suite on any PR with the **`run-smoke`** label.
- Never commit secrets. Azure auth is OIDC (`id-token: write`), and
  `VITE_APP_*` values are public build arguments, not secrets.

## Release Conventions

- API version tags use `api-v*`.
- Frontend version tags use `frontend-v*`.
- Conventional Commits: `feat:`, `fix:`, `feat!:`.
- This repository publishes **images and contracts**; it does not deploy them.
  Flux does, from `bjjeire-gitops`, using the chart from `bjjeire-deploy`.
