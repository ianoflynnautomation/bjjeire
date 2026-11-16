# Research: Merge tournaments into competitions

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Date**: 2026-11-16

Every decision below was made from the code on `origin/main` after slice 4 (#224)
and the owner's answers on 2026-11-16. Nothing in the Technical Context is
left as NEEDS CLARIFICATION.

## R1. One internal name: `BjjEireCompetition`

- **Decision**: The in-house kind is `BjjEireCompetition` in code and storage, and "BJJ Éire competition" in prose. The mapping:

  | Today | After |
  |---|---|
  | Java package `com.bjjeire.api.tournament` | `com.bjjeire.api.bjjeirecompetition` |
  | `Tournament`, `TournamentStatus`, `TournamentRules`, `Tournament*Dto`, `*TournamentCommand`, `Tournament*Controller`, `Tournament*Service*`, `TournamentRepository`, `TournamentMapper`, `TournamentDetails` | the same with `Tournament` → `BjjEireCompetition` |
  | `TournamentRegistration` (class and collection), `TournamentRegistrationAdminController` | `BjjEireCompetitionRegistration`, `BjjEireCompetitionRegistrationAdminController` (they stay in `registration`) |
  | `TournamentFeatureGateFilter`, `FeatureFlag.TOURNAMENTS` | `BjjEireCompetitionFeatureGateFilter`, `FeatureFlag.BJJEIRE_COMPETITIONS` |
  | `ApiCache.TOURNAMENTS_TAG`, cache keys `Tournaments_*`, `Tournament_Slug*` | `BJJEIRE_COMPETITIONS_TAG`, `BjjEireCompetitions_*`, `BjjEireCompetition_Slug*` |
  | Mongo collections `Tournament`, `TournamentRegistration` | `BjjEireCompetition`, `BjjEireCompetitionRegistration` |
  | Index names `ix_tournament_*`, `ix_registration_tournament_*` | `ix_bjjeire_competition_*`, `ix_registration_competition_*` |
  | SPA `features/tournaments`, `features/tournament-admin` | `features/bjjeire-competitions`, `features/bjjeire-competition-admin` |
  | SPA `types/tournaments.ts`, `constants/tournamentDataTestIds.ts`, `config/content/tournaments.ts`, `testing/factories/tournament.factory.ts`, `testing/msw/handlers/tournaments.ts`, `contracts/pact/tournament.pact.test.ts` | `bjjeire-competitions.ts`, `bjjEireCompetitionDataTestIds.ts`, `content/bjjeire-competitions.ts`, `bjjeire-competition.factory.ts`, `handlers/bjjeire-competitions.ts`, `bjjeire-competition.pact.test.ts` |
  | Test classes `Tournament*IT`, `Tournament*Test`, `TournamentTestData` | `BjjEireCompetition*IT`, `BjjEireCompetition*Test`, `BjjEireCompetitionTestData` |
  | Seeder `seeder/data-test/tournaments/` | `seeder/data-test/bjjeire-competitions/` |

  Generic names that never said "tournament" stay as they are: `Division`, `Discipline`, `Gender`, `Belt`, `AgeCategory`, `RegistrationState`, `DivisionSignUps`, `VenueValidator`, and the `competitor` and `registration` packages.
- **Rationale**: The owner chose the name. The prefix keeps it apart from the directory's `Competition` in one grep, and the flat package-by-feature rule (ADR-0001) is kept.
- **Alternatives considered**: `HostedCompetition` (rejected by the owner). Renaming the directory entity to `CompetitionListing` was rejected because it breaks a live feature for no visitor benefit.

## R2. Wire and stored field names that say "tournament"

- **Decision**: Fields that point from a sign-up or the medal history to a BJJ Éire competition are named `competition…`, without the `bjjEire` prefix:
  - `RegistrationDto`: `tournamentId`, `tournamentSlug`, `tournamentName`, `tournamentDate` → `competitionId`, `competitionSlug`, `competitionName`, `competitionDate`.
  - The stored registration field `tournamentId` → `competitionId`.
  - `CompetitorHistoryDto.tournaments` → `competitions`, and its item `TournamentMedalsDto(tournamentId, …)` → `CompetitionMedalsDto(competitionId, …)`.
  - Stripe Checkout metadata `tournamentId` → `competitionId`.
  - The stored `cancelledBy` value `TOURNAMENT` → `COMPETITION`.
- **Rationale**: Inside a sign-up, "competition" can only mean a BJJ Éire competition, because the directory has no sign-ups. Short JSON names read better in the SPA and in Zod schemas. Type and collection names keep the full prefix, where the two kinds do meet.
- **Alternatives considered**: `bjjEireCompetitionId` everywhere is unambiguous but noisy on the wire. Keeping `tournamentId` would break SC-004.
- **Impact**: The webhook matches on `registrationId` metadata and the session id, not `tournamentId` (verified: no code reads Checkout metadata back), so renaming the key is safe. No session from before the change has to be honoured (spec edge case).

## R3. The public list becomes "upcoming only"

- **Decision**: `GET /api/v1/bjjeire-competition` returns only upcoming BJJ Éire competitions, earliest day first. Upcoming means `status = PUBLISHED` and a `date` on or after today in `Europe/Dublin`. The response shape and paging (`page`, `pageSize` ≤ 100) stay the same. The SPA asks for one page of 100. `GET /{slug}` still serves published, finished and cancelled competitions.
- **Rationale**: The `/tournaments` list page goes away, and the featured section is the only consumer of the list (FR-001, FR-002). Filtering on the server keeps the cached page small and stops the SPA from re-deriving "upcoming" in the visitor's time zone. The existing `(status, date)` index covers the query. The route is new anyway, so changing its meaning breaks nothing more than the rename already does.
- **"Today" and the cache**: The cache key includes the Irish date, so a cached page from yesterday is never served after midnight. Organiser writes already clear the tag.
- **Alternatives considered**: An `?upcoming=true` parameter keeps a list for slice 5's results archive. It was rejected because slice 5 can add its own route when it designs the archive (YAGNI). Filtering in the SPA was rejected because of time-zone drift and extra payload.

## R4. Old data is dropped, not migrated

- **Decision**: On startup the API drops the `Tournament` and `TournamentRegistration` collections if they exist. It logs one line per collection and the number of documents dropped. This sits next to the existing `MongoIndexInitializer.migrate` step and is marked for removal one release later. The test dataset is reseeded from `seeder/data-test/bjjeire-competitions/`. No document is copied.
- **Rationale**: The owner's decision: the app is not live in production, so dev data is deleted and reseeded. The index initializer has created empty `Tournament*` collections in every environment, production included, whatever the flag. Without a drop, they would linger and break SC-004. A drop at startup reaches every cluster and preview without anyone running a shell against Mongo.
- **Safety**: Production has never had the flag on, so the drop removes only empty collections there. The log line records any non-zero count.
- **Alternatives considered**: A startup rename (the owner rejected it in favour of a delete). Manual `db.Tournament.drop()` per environment was rejected because it is easy to miss on the dev cluster and in previews.

## R5. Feature switch `BjjEireCompetitions`

- **Decision**: Wire name `BjjEireCompetitions`, env `FEATURE_BJJEIRE_COMPETITIONS`, default `false`. It is a rename everywhere the old one appears: `application.yml`, `FeatureFlag`, the gate filter, the SPA `FEATURE_FLAGS`, `.env.example`, both compose files and the README. The gate filter guards the same three prefixes: `/api/v1/bjjeire-competition`, `/api/v1/competitor` and `/api/v1/registration`. It still answers 404 before authentication.
- **Rationale**: FR-009. Gitops and `bjjeire-deploy` don't set the old variable (owner confirmed), so no cluster value moves.
- **Alternatives considered**: Folding it into `Competitions` was rejected in the `/spec` interview.

## R6. The featured section on the Competitions page

- **Decision**: The Competitions page fetches BJJ Éire competitions in its own query, only when `BjjEireCompetitions` is on. That query is independent of the directory listing's query:
  - Loading or failed: the section is left out. There's no error banner and no skeleton, so the listing never waits for it.
  - Empty: no section.
  - Otherwise: a section headed "BJJ Éire competitions" above the search box, with one card per competition, reusing today's tournament card.
  - The search box and paging state belong to the listing only (FR-003).
- **Rationale**: Spec edge case: one feature failing must not hide the other. Placing it above the search box makes it clear that search doesn't apply to it, and it meets SC-002 on a narrow screen.
- **Alternatives considered**: Merging both lists into one paged list was rejected: different shapes, and search would have to cover both.

## R7. SPA routes and which switch guards them

- **Decision**:
  - `/competitions` stays under `Competitions`.
  - `/competitions/:slug`, `/competitions/:slug/signup`, `/competitions/:slug/signup/complete`, `/admin/competitions` and `/admin/competitions/:id` are guarded by `BjjEireCompetitions` alone.
  - `/account/profile` and `/account/signups` keep their paths and switch.
  - The `/tournaments*` and `/admin/tournaments*` routes are deleted and fall through to the existing not-found handling (FR-010).
  - The "Tournaments" nav item is deleted (FR-005), and the account icon stays under `BjjEireCompetitions`.
  - `route-prefetch` drops the tournaments entry.
  - Payment return URLs built by the API use `/competitions/<slug>/signup[/complete]`.
- **Rationale**: `#3015`. The child routes don't depend on the directory listing being on.
- **Slug safety**: `/competitions/:slug` is only BJJ Éire competition pages, because the directory has no detail page. `admin` stays reserved.

## R8. Problem types and visible text

- **Decision**: `urn:bjjeire:tournament-full` → `urn:bjjeire:competition-full`. Every other URN is generic and stays. Problem titles and details, OpenAPI tags, summaries and descriptions, mail subjects and bodies, the Stripe line item ("«competition» — «division»"), the CSV file name (`competition-<id>-signups.csv`), the gate filter's detail text, log lines and `ui-content` copy all say "competition". The SPA's problem-message mapping follows the new URN.
- **Rationale**: FR-006, FR-007, SC-001, SC-004.

## R9. Documentation and governance

- **Decision**:
  - **ADR-0015**: "In-house competitions are BjjEire competitions inside Competitions". It records the name, the rejected alternatives and the wire field rule from R2.
  - **Constitution 1.2.0**: principle II names `bjjeirecompetition` instead of `tournament`. Principle V names `BjjEireCompetitions` and "BJJ Éire competitions". It gets a migration note.
  - **Living specs**:
    - `specs/features/tournaments.md` folds into `specs/features/competitions.md` as its "BJJ Éire competitions" part, keeping `#5001`–`#5042`.
    - `specs/stc/tournaments/` folds into `specs/stc/competitions/`, with spec, contract and traceability, adding `#3006`–`#3017`.
    - The database contracts `tournament.md` → `bjjeire-competition.md` and `tournament-registration.md` → `bjjeire-competition-registration.md`. `competitor.md` is updated for the history field names.
  - **Other docs**: `specs/README.md`, `AGENTS.md` (the ADR table, the guardrail package list and the flag name), `README.md`, `docs/architecture.md`, `docs/stripe-local.md`, ADR-0012/13/14 (a dated note only; history is not rewritten).
  - **`specs/001-tournament-registration/`**: kept as the historical design record. The unbuilt slice 5 tasks and contracts (`#5028`–`#5035`, `#5040`–`#5041`) are re-pointed to the new names and routes (FR-014). The directory name stays, because renaming it breaks links in merged PRs.
- **Rationale**: FR-013, FR-015, the constitution's amendment rule.

## R10. `bjjeire-tests`

- **Decision**:
  - Fold `specs/features/tournaments.md` into `specs/features/competitions.md`.
  - Move `tests/features/tournaments/` into `tests/features/competitions/`.
  - Rename page objects, API clients and Zod schemas to the new routes and fields (R2), and the error URN.
  - Rename the flag where the tests read it.
  - Add the `#3006`–`#3017` T6 scenarios listed in the spec's Acceptance Coverage.
  - Edit from this container. Run in that repo's own dev container.
- **Rationale**: Constitution principle III: Zod schemas move in the same change set.

## R11. CI

- **Decision**: No path filter, workflow or aggregator names "tournament". `check_openapi_breaking` and `check_frontend_api_compat` fail by design and pass once the SPA and Pact change in the same PR (ADR-0002). Put the **`run-smoke`** label on the PR.
- **Rationale**: ADR-0002, ADR-0003. Verified with `rg` over `.github/`.
