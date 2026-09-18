# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md` or `specs/features/<feature>.md`

## Summary

[Primary requirement + technical approach]

## Technical Context

**Language/Version**: Java 25 (API) · TypeScript 5.x / React 19 (SPA)

**Primary Dependencies**: Spring Boot 4, Spring Data MongoDB, Vite 7, MSAL

**Storage**: MongoDB collections per `specs/database-contracts/`

**Testing**: JUnit + Testcontainers (API) · Vitest (SPA) · Playwright in `bjjeire-tests`

**Target Platform**: AKS (Flux) · local docker-compose / minikube

**Project Type**: Modular monolith (API + SPA in this repo; acceptance in `bjjeire-tests`)

**Constraints**: OpenAPI/Pact gates; path-filtered CI; dark theme only; GeoJSON `[lng, lat]`

**Scale/Scope**: Ireland-wide BJJ directory (gyms, events, competitions, stores)

## Constitution Check

*GATE: Must pass before research. Re-check after design.*

- [ ] Package-by-feature respected (ADR-0001)
- [ ] Wire-shape change has OpenAPI/Pact/spec updates (ADR-0002)
- [ ] No new CI job left out of the aggregator (ADR-0003), except `atest_analyze`
- [ ] No light-theme or ad-hoc UI strings (ADR-0007, ADR-0008)
- [ ] No new cloud stack (`azd` / Cosmos / Container Apps)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/
└── tasks.md
```

Living (brownfield) features may instead update:

```text
specs/features/<feature>.md
specs/database-contracts/<entity>.md
```

### Source Code

```text
src/bjjeire-api/src/main/java/com/bjjeire/api/<feature>/
src/bjjeire-app/src/features/<feature>/
src/bjjeire-app/src/pages/
seeder/data/<entity>/
# acceptance (other repo)
bjjeire-tests/tests/features/<feature>/
bjjeire-tests/src/ui/pages/<feature>/
bjjeire-tests/src/api/features/<feature>/
```

**Structure Decision**: Follow the existing feature slice. Do not invent a new top-level layout.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| | | |
