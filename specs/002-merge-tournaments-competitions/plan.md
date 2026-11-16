# Implementation Plan: Merge tournaments into competitions

**Branch**: `feat/merge-tournaments-into-competitions` | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-merge-tournaments-competitions/spec.md`

## Summary

Rename the in-house "tournament" capability to **BJJ Éire competitions**
(`BjjEireCompetition` in code and storage) and re-home it inside the
Competitions feature. The behaviour of `#5001`–`#5042` doesn't change. What
changes:
- **Names**: API prefix `/api/v1/bjjeire-competition`, package `bjjeirecompetition`, collections, one stored field and one enum value, wire field names that said "tournament", the full-competition problem URN, and all visible copy, mail and Stripe text.
- **SPA**: the `/tournaments` pages go away. BJJ Éire competition pages live under `/competitions/:slug` and `/admin/competitions`. The Competitions page gains a featured section of upcoming BJJ Éire competitions, fed by a public list that now returns upcoming ones only.
- **Feature switch**: `Tournaments` → `BjjEireCompetitions`.
- **Data**: old collections are dropped at startup and the test seed moves.
- **Docs**: one ADR, a constitution amendment, folded living specs, and the matching `bjjeire-tests` changes.

Design decisions: [research.md](research.md). Stored shape: [data-model.md](data-model.md).
Interface deltas: [contracts/rename.yaml](contracts/rename.yaml). Validation: [quickstart.md](quickstart.md).

## Technical Context

**Language/Version**: Java 25 (API) · TypeScript 5.x / React 19 (SPA)

**Primary Dependencies**: Spring Boot 4, Spring Data MongoDB, Stripe Java SDK, Vite 7, MSAL, TanStack Query

**Storage**: MongoDB. `Tournament` → `BjjEireCompetition`, `TournamentRegistration` → `BjjEireCompetitionRegistration`, legacy dropped (R4).

**Testing**: JUnit + Testcontainers (API) · Vitest + MSW + Pact (SPA) · Playwright in `bjjeire-tests`

**Target Platform**: AKS (Flux) · local docker-compose / minikube

**Project Type**: Modular monolith (API + SPA in this repo; acceptance in `bjjeire-tests`)

**Constraints**:
- OpenAPI and Pact gates break by design (ADR-0002) and must pass by the end of the same PR.
- Path-filtered CI.
- Three themes.
- No behaviour change to `#5001`–`#5042`.

**Scale/Scope**: About 225 files here: 114 API (25 main classes in `tournament`, plus `registration`, `competitor`, `web`, `config` and `seeder` references, and about 10 test classes) and 111 SPA (`features/tournaments`, `features/tournament-admin`, pages, types, content, test IDs, factories, MSW, Pact). Plus about 15 docs and spec files, and `bjjeire-tests`.

## Constitution Check

*GATE: Must pass before research. Re-check after design.*

- [x] **Package-by-feature respected (ADR-0001).** `tournament` becomes `bjjeirecompetition`, still one flat feature package. `competitor` and `registration` are unchanged. Principle II names `tournament`, so the constitution is amended in this change (FR-013), not violated.
- [x] **Wire-shape change has OpenAPI/Pact/spec updates (ADR-0002).** contracts/rename.yaml lists every delta. The SPA types, Pact, feature spec, database contracts and `bjjeire-tests` Zod schemas change in the same change set.
- [x] **No new CI job left out of the aggregator (ADR-0003), except `atest_analyze`.** No CI job is added or renamed.
- [x] **All three themes still work and no ad-hoc UI strings (ADR-0011, ADR-0008).** The featured section uses existing card variants and tokens. Copy goes in `ui-content` and the content files, and test IDs in `*DataTestIds.ts`.
- [x] **No new cloud stack.** None.
- [x] **Principle V (public reads, authenticated writes, fail-closed flags).** Auth rules are unchanged. The renamed switch still answers 404 before auth and fails closed in the SPA. Read-only mode still protects only the directory.
- [x] **Principle IV (test first).** Every rename is driven by renaming the tests first, which then fail to compile or fail on the new routes and names. The new behaviour (upcoming-only list, featured section, flag combinations, legacy drop) gets new failing tests before code.

**Post-design re-check**: still passing. R3 changes what the public list returns, but it's a new route (part of the rename) with one consumer. R4's startup drop is temporary and logged.

## Project Structure

### Documentation (this feature)

```text
specs/002-merge-tournaments-competitions/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/rename.yaml
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

On build, these living files change. `/build-feature` folds this record back
into them:

```text
specs/features/competitions.md            ← absorbs specs/features/tournaments.md (deleted)
specs/stc/competitions/{spec.md,contract.yaml,traceability.md}  ← absorb specs/stc/tournaments/ (deleted)
specs/database-contracts/bjjeire-competition.md               ← was tournament.md
specs/database-contracts/bjjeire-competition-registration.md  ← was tournament-registration.md
specs/database-contracts/competitor.md    (history field names)
specs/001-tournament-registration/        (slice 5 tasks/contracts re-pointed; otherwise historical)
docs/adr/0015-bjjeire-competitions-inside-competitions.md (new)
.specify/memory/constitution.md           (1.2.0)
AGENTS.md, README.md, specs/README.md, docs/architecture.md, docs/stripe-local.md
```

### Source Code

```text
src/bjjeire-api/src/main/java/com/bjjeire/api/
├── bjjeirecompetition/     ← was tournament/ (all classes renamed per research R1)
├── registration/           (TournamentRegistration* → BjjEireCompetitionRegistration*; field and URN renames)
├── competitor/             (history DTO field names; registration collection constant)
├── web/                    (FeatureFlag, gate filter, ProblemTypes, routes)
├── config/                 (MongoIndexInitializer: new names, legacy drop)
├── common/                 (ApiCache tag)
└── seeder/                 (collection entry)
src/bjjeire-api/src/main/resources/application.yml   (flag, return-URL comment)
src/bjjeire-api/src/test/java/com/bjjeire/api/bjjeirecompetition/   ← was tournament/

src/bjjeire-app/src/
├── features/bjjeire-competitions/        ← was features/tournaments/ (list page removed; card reused as featured)
├── features/bjjeire-competition-admin/   ← was features/tournament-admin/
├── features/competitions/                (featured section added to the page)
├── features/registrations/, features/competitor/   (field renames, copy)
├── features/feature-flags/definitions.ts
├── components/layout/navigation/         (nav item removed, prefetch)
├── config/paths.ts, config/ui-content.ts, config/content/bjjeire-competitions.ts
├── constants/bjjEireCompetitionDataTestIds.ts
├── pages/                                (TournamentsPage deleted; Tournament*Page → BjjEireCompetition*Page)
├── types/bjjeire-competitions.ts
└── testing/, contracts/pact/

seeder/data-test/bjjeire-competitions/    ← was seeder/data-test/tournaments/
.env.example, docker-compose.yml, docker-compose.override.java-local.yml

# acceptance (other repo, edited from here)
bjjeire-tests/specs/features/competitions.md     ← absorbs tournaments.md
bjjeire-tests/tests/features/competitions/       ← absorbs tests/features/tournaments/
bjjeire-tests/src/{ui,api}/…                     (page objects, clients, Zod schemas)
```

**Structure Decision**: Follow the existing slices. It's one rename of the
feature package and folders plus a small addition to the Competitions page.
No new top-level layout.

### Suggested order (for `/speckit-tasks`)

1. **Governance first.** ADR-0015 and the constitution 1.2.0 amendment, so the build has its authority.
2. **API rename, tests first.** Rename the test package, test data and route constants. Watch them fail. Rename main code, collections, indexes, flag, URN, wire fields and mail/Stripe copy. Get `mvn -pl src/bjjeire-api test` green.
3. **API behaviour.** Upcoming-only list with the Irish-date cache key (R3), and the legacy collection drop (R4). Each starts as a failing IT.
4. **Seeder and config.** Move the test seed; rename the flag in env and compose files and the README.
5. **SPA rename, tests first.** Folders, types, Pact, MSW, factories, routes, nav, copy, problem messages. Delete the tournaments list page.
6. **SPA behaviour.** Featured section on Competitions (`#3006`–`#3008`) and flag-combination routing (`#3014`, `#3015`). Each starts as a failing integration test.
7. **Living docs fold** (R9) and the slice 5 re-point (FR-014).
8. **`bjjeire-tests`** fold and new T6 scenarios (R10).
9. **Final checks.** The SC-004 grep and the quickstart walk-through.

Steps 2 and 5 are mechanical and large. Keep each as a commit that compiles
and is green on its own, so `spec-verifier` and reviewers can follow the
history.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Temporary startup drop of legacy collections (R4) | Every environment, production included, holds empty `Tournament*` collections created by the index initializer; the owner wants old data deleted, not migrated | Manual drops per environment are easy to miss on the dev cluster and in previews, and would leave SC-004 failing |
