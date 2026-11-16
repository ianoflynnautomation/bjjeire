---
description: "Tasks for merging in-house tournaments into Competitions as BJJ Éire competitions"
---

# Tasks: Merge tournaments into competitions

**Input**: Design documents from `specs/002-merge-tournaments-competitions/`

**Prerequisites**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/rename.yaml](contracts/rename.yaml), [quickstart.md](quickstart.md)

**Tests**: Required. TDD is a constitution rule (principle IV). For a rename, "failing test first" means renaming or re-pointing the test before the code, and watching it fail (compile error or 404). New behaviour gets a new failing test.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story id (US1–US5, from spec.md)
- Name the feature package or folder. Give an exact file path only when the path is itself a contract, and derive the rest from the code while building.
- Research decisions are cited as R1–R11 ([research.md](research.md)).

## Path Conventions

- API: `src/bjjeire-api/src/main/java/com/bjjeire/api/bjjeirecompetition/` (was `tournament/`)
- SPA: `src/bjjeire-app/src/features/bjjeire-competitions/`, `features/bjjeire-competition-admin/` (were `tournaments/`, `tournament-admin/`)
- Seeder: `seeder/data-test/bjjeire-competitions/`
- Acceptance: `bjjeire-tests`, edited from this container (mounted at `/workspaces/bjjeire-tests`) and run in its own dev container

---

## Phase 1: Governance and specs (authority for everything after)

**Purpose**: Record the decision before the code changes, so reviewers and `spec-verifier` have a source.

- [ ] T001 Write `docs/adr/0015-bjjeire-competitions-inside-competitions.md`. It covers: the name `BjjEireCompetition` (prose: "BJJ Éire competition"); alternatives rejected (`HostedCompetition`, renaming the directory to `CompetitionListing`, `Championship`); the wire field rule (`competition…` inside sign-ups and history, full prefix on types and collections, R2); no redirects; old data dropped, not migrated (R4). Add it to `docs/adr/README.md` and to the AGENTS.md decision table.
- [ ] T002 Amend `.specify/memory/constitution.md` to 1.2.0. Principle II: `tournament` → `bjjeirecompetition`. Principle V: "in-house tournaments" → "BJJ Éire competitions", flag `Tournaments` → `BjjEireCompetitions`, "Tournament, competitor and registration routes" → "BJJ Éire competition, competitor and registration routes". Add "Amendment 1.2.0 (2026-11-16)" with a migration note: in-flight specs that say "tournament" mean BJJ Éire competition; slice 5 is re-pointed by this change.
- [ ] T003 [P] Re-point the unbuilt slice 5 work in `specs/001-tournament-registration/` (`tasks.md` slice 5 tasks, `contracts/contract.yaml` slice 5 routes, `spec.md` US5 text for `#5028`–`#5035`, `#5040`–`#5041`). Use the new package, routes (`/api/v1/bjjeire-competition/{id}/leaderboard`, results, finish), class names (`BjjEireCompetition*`), field names (R2) and SPA paths. Add one line at the top of each file: "Slice 5 re-pointed to BJJ Éire competition names by specs/002-merge-tournaments-competitions; slices 0–4 below are historical." Leave the shipped slices' text and the directory name alone (FR-014).

**Checkpoint**: ADR and constitution merged in the same PR. Everything below cites them.

---

## Phase 2: Foundational rename (blocks every story)

**Purpose**: The mechanical rename of R1, R2, R5 and R8 at both layers. After this phase the system behaves exactly as before under new names, apart from what US1, US4 and US5 add. This phase is large but has no new behaviour. Keep the API and SPA halves as separate commits that are each green.

### API: tests first

- [ ] T004 Move `src/bjjeire-api/src/test/java/com/bjjeire/api/tournament/` to `…/bjjeirecompetition/`. Rename every test class and helper per R1 (`Tournament*IT`, `Tournament*Test`, `TournamentTestData`, plus `TournamentFeatureGateFilterTest`, `TournamentFeatureOffIT`, `TournamentRouteAuthorizationIT`, `TournamentCancellationIT` wherever they live). Re-point them at:
  - route `/api/v1/bjjeire-competition`;
  - collections `BjjEireCompetition` and `BjjEireCompetitionRegistration`;
  - flag `BjjEireCompetitions`;
  - URN `urn:bjjeire:competition-full`;
  - JSON fields `competitionId`, `competitionSlug`, `competitionName`, `competitionDate`, `competitions[]`;
  - CSV name `competition-<id>-signups.csv`;
  - return URLs `/competitions/<slug>/signup[/complete]`;
  - Stripe metadata key `competitionId`;
  - `cancelledBy` value `COMPETITION`.

  Update the registration, competitor, webhook and authorization ITs that reference any of these. Run `mvn -pl src/bjjeire-api test` and confirm it fails (compile errors are the expected red).
- [ ] T005 [P] Add assertions that no response body, problem `title` or `detail`, mail subject or body, or Checkout line item produced in the existing ITs contains "tournament" (case-insensitive). Put them in the existing mail-sender, registration and webhook tests, not in a new suite (FR-006, `#3011`).

### API: implementation

- [ ] T006 Rename package `com.bjjeire.api.tournament` → `com.bjjeire.api.bjjeirecompetition` and every class in it per R1. Generic names (`Division`, `Discipline`, `Gender`, `Belt`, `AgeCategory`, `RegistrationState`, `DivisionSignUps`, `MongoDivisionSignUps`, `VenueValidator`, `ValidVenue`) keep their names. Update the route constant, OpenAPI tags, summaries and descriptions, and Javadoc to "BJJ Éire competition".
- [ ] T007 In `registration/`:
  - `TournamentRegistration` → `BjjEireCompetitionRegistration`, entity and collection name `BjjEireCompetitionRegistration`. The stored field `tournamentId` → `competitionId`. `CANCELLED_BY_TOURNAMENT`/`"TOURNAMENT"` → `CANCELLED_BY_COMPETITION`/`"COMPETITION"`.
  - `TournamentRegistrationAdminController` → `BjjEireCompetitionRegistrationAdminController`.
  - `RegistrationDto` fields `tournamentId`/`tournamentSlug`/`tournamentName`/`tournamentDate` → `competitionId`/`competitionSlug`/`competitionName`/`competitionDate`.
  - Stripe metadata `tournamentId` → `competitionId`, and the line item `«competition» — «division»`.
  - CSV file name `competition-<id>-signups.csv`.
  - Mail subjects and bodies ("Tournament: …" → "Competition: …", "Tournament cancelled" → "Competition cancelled").
  - Log lines and OpenAPI text say "competition".
  - The registration collection constants in `competitor/` and the BJJ Éire competition package point at the new collection name.
- [ ] T008 In `competitor/`: `CompetitorHistoryDto.tournaments` → `competitions`, `TournamentMedalsDto(tournamentId, …)` → `CompetitionMedalsDto(competitionId, …)`, and Javadoc.
- [ ] T009 In `web/`:
  - `FeatureFlag.TOURNAMENTS("Tournaments")` → `BJJEIRE_COMPETITIONS("BjjEireCompetitions")`.
  - `TournamentFeatureGateFilter` → `BjjEireCompetitionFeatureGateFilter`, guarding `/api/v1/bjjeire-competition`, `/api/v1/competitor`, `/api/v1/registration`, with detail "The BJJ Éire competitions feature is not available.".
  - `ProblemTypes.TOURNAMENT_FULL` → `COMPETITION_FULL` = `urn:bjjeire:competition-full`.
  - Every problem title or detail that says "tournament" now says "competition".
- [ ] T010 In `config/MongoIndexInitializer`: redeclare the indexes on the new collections and field (`ix_bjjeire_competition_slug_unique`, `ix_bjjeire_competition_status_date`, `ix_registration_competition_*`, `ux_registration_active_competitor_division` on `competitionId`). Keys and uniqueness are unchanged (data-model.md). Rename the version-backfill step for the new collection, and log text. In `common/ApiCache`: `TOURNAMENTS_TAG` → `BJJEIRE_COMPETITIONS_TAG`, and cache key prefixes `BjjEireCompetitions_*` / `BjjEireCompetition_Slug*`.
- [ ] T011 In `seeder/`: the collection entry key `tournaments` → `bjjeire-competitions`, entity `BjjEireCompetition`, still `testDatasetOnly`. Move `seeder/data-test/tournaments/` → `seeder/data-test/bjjeire-competitions/` (`_template.json`, `acceptance-open.json`, `acceptance-opens-later.json`, `acceptance-closed.json`) with the content unchanged.
- [ ] T012 Config: `application.yml` `Tournaments: ${FEATURE_TOURNAMENTS:false}` → `BjjEireCompetitions: ${FEATURE_BJJEIRE_COMPETITIONS:false}`. Also update the Checkout return comment and the code that builds the return URLs to `/competitions/<slug>/signup[/complete]`, and the `FEATURE_TOURNAMENTS` lines in `.env.example`, `docker-compose.yml`, `docker-compose.override.java-local.yml` and `README.md`.
- [ ] T013 Run `mvn -pl src/bjjeire-api test` until it's green. T004 and T005 are now green and the rest of the suite is unchanged.

### SPA: tests first

- [ ] T014 Rename the SPA test files and helpers per R1:
  - `pages/__tests__/{tournament-page,admin-tournaments-page,admin-tournament-page,admin-tournament-sign-ups}.integration.test.tsx` → `bjjeire-competition-*`. Delete `tournaments-page.integration.test.tsx` here, because US5 asserts the page is gone.
  - `features/tournaments/**/__tests__`, `features/tournament-admin/**/__tests__`, `features/tournaments/testing/`, `features/tournament-admin/testing/`.
  - `testing/factories/tournament.factory.ts`, `testing/msw/handlers/tournaments.ts`.
  - `contracts/pact/tournament.pact.test.ts` → `bjjeire-competition.pact.test.ts`, with the new routes, fields, schema names and URN.
  - The registration and competitor tests and helpers that use the renamed fields.

  Point them at the new paths (`/competitions/:slug…`, `/admin/competitions…`), the API prefix, field names, flag key and copy. Run `npm run typecheck` and `npm test` and confirm they fail.

### SPA: implementation

- [ ] T015 Move `features/tournaments/` → `features/bjjeire-competitions/` and `features/tournament-admin/` → `features/bjjeire-competition-admin/`, renaming components, hooks, API functions, query keys and utils per R1. Then:
  - Rename `types/tournaments.ts` → `types/bjjeire-competitions.ts` (field renames per R2), `constants/tournamentDataTestIds.ts` → `bjjEireCompetitionDataTestIds.ts`, and `config/content/tournaments.ts` → `content/bjjeire-competitions.ts`.
  - Move every "tournament" string in `config/ui-content.ts` and the content files to "competition" or "BJJ Éire competition", including "Competition not found" and the medal history's "competitions entered".
  - `features/registrations/`, `features/competitor/` and `features/bjjeire-competition-admin/utils/problem-message.ts` use the new fields and URN.
- [ ] T016 In `features/feature-flags/definitions.ts`, `Tournaments` → `BjjEireCompetitions` (default `false`, description updated, `addedAt` kept). Update every consumer.
- [ ] T017 In `config/paths.ts` and the router, replace the `/tournaments*` and `/admin/tournaments*` paths with `/competitions/:slug`, `/competitions/:slug/signup`, `/competitions/:slug/signup/complete`, `/admin/competitions` and `/admin/competitions/:id`, guarded by `BjjEireCompetitions`. Rename `pages/Tournament*Page.tsx` → `BjjEireCompetition*Page.tsx`. The `/competitions` index route keeps its `Competitions` guard. Don't add redirects.
- [ ] T018 Run `npm run lint && npm run typecheck && npm test && npm run test:integration` in `src/bjjeire-app` until it's green.

**Checkpoint**: The renamed system behaves as before. `#5001`–`#5042` still hold (SC-003).

---

## Phase 3: User Story 1 — Visitor finds BJJ Éire competitions on the Competitions page (P1) 🎯 MVP

**Goal**: A featured section of upcoming BJJ Éire competitions above the directory listing (`#3006`–`#3009`).

**Independent Test**: Seed one upcoming BJJ Éire competition and some directory competitions. `/competitions` shows the featured card above the search box. Searching filters only the listing. The card opens `/competitions/{slug}`.

### Tests (write first, confirm they fail)

- [ ] T019 [P] [US1] Add an API IT in the `bjjeirecompetition` test package. `GET /api/v1/bjjeire-competition`:
  - returns only `PUBLISHED` competitions whose `date` is today or later in `Europe/Dublin`, ordered by date then name;
  - excludes `DRAFT`, `FINISHED`, `CANCELLED` and published ones whose day has passed;
  - on the competition day itself it still includes it (fixed `Clock` at 23:59 Irish time), and at 00:00 the next Irish day it excludes it, even with a page cached the day before;
  - paging is `page ≥ 1`, `pageSize 1..100`.

  Covers `#3006` and `#3007` (R3).
- [ ] T020 [P] [US1] Add a unit test for the upcoming rule (status plus Irish date) next to the existing rules test in `bjjeirecompetition`.
- [ ] T021 [P] [US1] Add a Pact interaction to `bjjeire-competition.pact.test.ts` for the upcoming list.
- [ ] T022 [P] [US1] Add a SPA integration test for the Competitions page (`pages/__tests__/competitions-page.integration.test.tsx`, extend it or add a sibling):
  - with `BjjEireCompetitions` on and two upcoming items, a "BJJ Éire competitions" section renders above the search box, earliest first, with day, venue, fee, division count and registration badge (`#3006`);
  - with an empty list, or the flag off, there's no section and no placeholder (`#3007`);
  - while that request is loading, or when it fails with 500, the listing renders and the section is absent (spec edge case);
  - typing a search term and paging change only the listing, and the listing's empty state shows while featured cards stay (`#3008`);
  - clicking a featured card navigates to `/competitions/{slug}` (`#3009`).
- [ ] T023 [P] [US1] Add a SPA integration test for the BJJ Éire competition page: `/competitions/{slug}` renders details, an unknown or draft slug shows "Competition not found" with a link to `/competitions` (`#3009`), and the page renders in light, dark and competition themes without changing the stored theme.

### Implementation

- [ ] T024 [US1] API: change the public list in `bjjeirecompetition` to upcoming only, using `(status, date)` with today's `Europe/Dublin` date from the injected `Clock`. Put the Irish date in the cache key (R3). Update OpenAPI summaries to "List upcoming BJJ Éire competitions".
- [ ] T025 [US1] SPA:
  - Add the featured section to the Competitions page (in `features/competitions/` or the page). It's a separate query for the upcoming list (one page, `pageSize=100`), enabled only when `BjjEireCompetitions` is on, and it renders nothing while loading, on error or when empty (R6).
  - Reuse the BJJ Éire competition card. The heading and copy go in `ui-content`, and test IDs in `bjjEireCompetitionDataTestIds.ts` (`FEATURED_SECTION`, `FEATURED_CARD`). Use theme tokens and CVA only.
- [ ] T026 [US1] Delete the old public list page pieces that only served `/tournaments`: the page component, its header, list and search hook. Keep the card, details, division groups, registration badge and formatters.

**Checkpoint**: The MVP is visible. Run `mvn -pl src/bjjeire-api test` and the SPA suite.

---

## Phase 4: User Story 2 — Competitor signs up under the new names (P1)

**Goal**: The sign-up, payment, cancellation and mail journey runs at `/competitions/{slug}/signup…` with no "tournament" anywhere (`#3010`–`#3012`).

**Independent Test**: Sign up and pay in Stripe test mode on the acceptance seed, return to the completion page, read the mail, cancel. "Tournament" appears nowhere.

### Tests (write first)

- [ ] T027 [P] [US2] API IT (registration package): the Checkout session created for a sign-up has `success_url` `…/competitions/<slug>/signup/complete?registration=<id>`, `cancel_url` `…/competitions/<slug>/signup?registration=<id>`, metadata `competitionId` and `registrationId`, and a line item without "tournament" (`#3010`). Use the existing fake payment gateway.
- [ ] T028 [P] [US2] API IT: a full BJJ Éire competition refuses a sign-up with `type` `urn:bjjeire:competition-full`, and the title and detail don't mention "tournament" (`#3012`).
- [ ] T029 [P] [US2] API test: the confirmation, cancellation, refund-completed and competition-cancelled mails contain "competition" and not "tournament" (`#3011`).
- [ ] T030 [P] [US2] SPA integration tests: the sign-up, sign-up-complete and My sign-ups pages run at the new paths, show `competitionName` and `competitionDate`, and map `urn:bjjeire:competition-full` to the "full" message. The profile's medal history heading reads "Competitions entered" (`#3010`, `#3011`).

### Implementation

- [ ] T031 [US2] Make T027–T030 pass. Any gap left after Phase 2 is fixed in `registration/`, `competitor/`, the mail templates, the Stripe gateway, `features/registrations/`, `features/competitor/` and `ui-content`.

**Checkpoint**: The paid journey works end to end locally (quickstart step 3.6).

---

## Phase 5: User Story 4 — The BJJ Éire competitions switch turns the feature off as a whole (P1)

**Goal**: `BjjEireCompetitions` is fail-closed and independent of `Competitions` (`#3014`, `#3015`).

**Independent Test**: Flip each flag and check routes, header and pages as in quickstart steps 3.9 and 3.10.

### Tests (write first)

- [ ] T032 [P] [US4] API: the renamed feature-off IT asserts that with `BjjEireCompetitions=false`, every `/api/v1/bjjeire-competition`, `/api/v1/competitor` and `/api/v1/registration` route answers 404 before authentication (with and without a token), and directory routes answer as usual. The renamed gate filter unit test covers the three prefixes and not `/api/v1/competition` (`#3014`).
- [ ] T033 [P] [US4] SPA: the navigation unit test (`use-nav-items`) asserts there's no "Tournaments" item in any flag combination, and the account icon appears only with `BjjEireCompetitions` on (`#3011`, `#3015`).
- [ ] T034 [P] [US4] SPA: a router or feature-flag integration test asserts:
  - flag off, or flag fetch failing: `/competitions/{slug}`, `/competitions/{slug}/signup`, `/admin/competitions` and `/account/signups` don't render their pages, and `/competitions` shows the listing without the featured section (`#3014`);
  - `Competitions` off and `BjjEireCompetitions` on: `/competitions` is unavailable as today, but `/competitions/{slug}`, its sign-up, `/account/signups` and `/admin/competitions` render (`#3015`).

### Implementation

- [ ] T035 [US4] Make T032–T034 pass. Any adjustment goes in the route guards, the nav items, `route-prefetch` (drop the tournaments entry) and the gate filter.

---

## Phase 6: User Story 3 — Organiser runs BJJ Éire competitions from the new admin screens (P2)

**Goal**: The organiser screens work at `/admin/competitions` (`#3013`).

**Independent Test**: Locally, with the local organiser sign-in, create, publish and cancel at `/admin/competitions`, and see a published one featured.

- [ ] T036 [P] [US3] SPA integration tests (the renamed admin tests from T014): the list at `/admin/competitions`, the editor at `/admin/competitions/{id}`, publishing, cancelling, sign-up actions and CSV download (file name `competition-<id>-signups.csv`) all work. The screens ask for the organiser sign-in first and aren't in the navigation. The back link goes to `/admin/competitions` (`#3013`).
- [ ] T037 [P] [US3] API: the renamed admin and route-authorization ITs cover every admin route under `/api/v1/bjjeire-competition` refusing anonymous callers, competitors and writer-less workforce tokens (`#3013`, unchanged `#5004`).
- [ ] T038 [US3] Make T036–T037 pass: admin page copy ("Competitions", "New competition", "Cancel competition", "Retry failed refunds") in the content files, and the links in `features/bjjeire-competition-admin/`.

---

## Phase 7: User Story 5 — Old names and addresses are gone (P2)

**Goal**: Nothing answers at the old names, and old data is dropped (`#3016`, `#3017`).

**Independent Test**: Request the old addresses, then inspect the database after startup and reseed.

### Tests (write first)

- [ ] T039 [P] [US5] API IT: with the flag on, `GET /api/v1/tournament`, `GET /api/v1/tournament/{slug}` and `POST /api/v1/tournament` answer 404 (`#3016`).
- [ ] T040 [P] [US5] API IT (Testcontainers): pre-create `Tournament` and `TournamentRegistration` with documents, then start the context. Both are dropped, a log line records each count, the new collections and their indexes exist, and a second start with neither present logs "not present" and doesn't fail (`#3017`, R4).
- [ ] T041 [P] [US5] Seeder test: the test dataset seeds `BjjEireCompetition` with `acceptance-open`, `acceptance-opens-later` and `acceptance-closed`. A production run neither writes nor prunes `BjjEireCompetition` (`#3017`).
- [ ] T042 [P] [US5] SPA integration test: `/tournaments`, `/tournaments/acceptance-open` and `/admin/tournaments` render the site's not-found page, with no redirect (`#3016`).

### Implementation

- [ ] T043 [US5] Add the temporary legacy drop next to `MongoIndexInitializer.migrate`: drop `Tournament` and `TournamentRegistration` if present, and log the document counts. Mark it `// Remove one release after specs/002-merge-tournaments-competitions` with a link to ADR-0015.
- [ ] T044 [US5] Make T039, T041 and T042 pass. No redirects. Seeder fixes if needed.

---

## Phase 8: Living docs fold and acceptance repo

**Purpose**: One Competitions feature in every living document (FR-015). `/build-feature` folds this record back.

- [ ] T045 Fold `specs/features/tournaments.md` into `specs/features/competitions.md`:
  - It becomes the Competitions feature with two parts: the directory (unchanged) and BJJ Éire competitions (US1–US6 of the old file with `#5001`–`#5042` kept, new routes and names, the access-rules table re-pointed).
  - Add US "Featured on the Competitions page" with `#3006`–`#3017`. Update the header: API, SPA routes, flags `Competitions` and `BjjEireCompetitions`, requirements epics `&3` and `&11`, and decisions ADR-0012/13/14/15.
  - Delete `specs/features/tournaments.md`.
- [ ] T046 [P] Fold `specs/stc/tournaments/{spec.md,contract.yaml,traceability.md}` into `specs/stc/competitions/`:
  - Keep every `#50xx` section with its **Owns** line re-pointed to the renamed tests. Add `#3006`–`#3017` with their owning tests from this task list.
  - Merge `contract.yaml` (directory routes plus a `bjjeire_competitions` section, using contracts/rename.yaml).
  - Update the front matter (`api_package`, `spa`, `database`) and delete `specs/stc/tournaments/`.
- [ ] T047 [P] Move `specs/database-contracts/tournament.md` → `bjjeire-competition.md` and `tournament-registration.md` → `bjjeire-competition-registration.md`, applying data-model.md (collection, field `competitionId`, `cancelledBy` `COMPETITION`, index names, the upcoming notion, legacy drop note). Update `competitor.md` for the history field names.
- [ ] T048 [P] Update `specs/README.md` (layout tree), `specs/system-architecture.md`, `docs/architecture.md`, `docs/stripe-local.md` (return URLs, flag), `AGENTS.md` (package list in Architecture Guardrails, ADR table rows naming the `Tournaments` flag), and ADR-0012/0013/0014 (a dated note "renamed by ADR-0015" only; leave the history alone).
- [ ] T049 [P] In `/workspaces/bjjeire-tests`:
  - Fold `specs/features/tournaments.md` into `specs/features/competitions.md`, keeping the `Covers:` issues and adding the T6 issues from the spec's Acceptance Coverage (`#3006`–`#3011`, `#3013`, `#3014`, `#3016`).
  - Move `tests/features/tournaments/` into `tests/features/competitions/`.
  - Rename page objects, API clients and Zod schemas to the new routes and fields (contracts/rename.yaml), the URN and the flag.
  - Leave `.env*` and `playwright/.auth` unread. Run the suite in that repo's dev container.

---

## Phase 9: Verify

- [ ] T050 Run `mvn clean verify`.
- [ ] T051 Run `npm run lint && npm run typecheck && npm test && npm run test:integration && npm run build` in `src/bjjeire-app`.
- [ ] T052 Run the SC-004 sweep. `rg -i tournament` over the repo, excluding `docs/adr/`, `specs/001-tournament-registration/` (apart from its re-pointed slice 5 lines), `CHANGELOG*` and `.git`, directory listing data under `seeder/data*/competitions/` and the site-wide meta description in `src/bjjeire-app/index.html` (SC-004 as amended), finds nothing. Repeat in `bjjeire-tests`.
- [ ] T053 Walk through quickstart.md section 3 (steps 1–10) on the local stack with the test dataset and Stripe test mode.
- [ ] T054 Open the PR with the **`run-smoke`** label. `check_openapi_breaking` and `check_frontend_api_compat` are expected to report the break, and pass because the SPA and Pact changed in the same PR (ADR-0002). Every other job in `pr_complete` is green. Then run the `spec-verifier` subagent on this spec and the diff.

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2**: governance first. T003 can run alongside Phase 2.
- **Phase 2** blocks every story. Inside it, the API half (T004–T013) and the SPA half (T014–T018) can run in parallel once the contract (contracts/rename.yaml) is fixed. The SPA half compiles against MSW and Pact, not the live API.
- **US1 (Phase 3)**, **US2 (Phase 4)**, **US4 (Phase 5)**, **US3 (Phase 6)** and **US5 (Phase 7)** each depend only on Phase 2 and are independent of each other. Exception: T026 (deleting the old list page) must land after T025.
- **Phase 8** depends on the stories it documents. T049 can start after Phase 2.
- **Phase 9** is last.

## Parallel Examples

- **Phase 2**: T004–T005 (API tests) alongside T014 (SPA tests). Then T006–T012 alongside T015–T017.
- **US1**: T019, T020, T021, T022 and T023 together. Then T024 (API) alongside T025 (SPA).
- **US2**: T027, T028, T029 and T030 together.
- **US4**: T032, T033 and T034 together.
- **US5**: T039, T040, T041 and T042 together.
- **Phase 8**: T046, T047, T048 and T049 together after T045 starts.

## Implementation Strategy

1. **MVP = Phase 1 + Phase 2 + US1.** The rename lands with the featured section, which is what visitors see.
2. Add US2 and US4 (both P1). The revenue path and the kill switch are proven under the new names.
3. Add US3 and US5 (P2).
4. Fold the docs and acceptance tests, verify, open one PR. The rename is a single breaking API change (ADR-0002), so all phases ship together in one PR, built as reviewable commits in the order above.
