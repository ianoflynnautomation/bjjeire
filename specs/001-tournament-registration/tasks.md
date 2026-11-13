---
description: "Task list for In-House Tournament Registration"
---

# Tasks: In-House Tournament Registration

**Input**: Design documents from `specs/001-tournament-registration/`

**Prerequisites**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/contract.yaml](contracts/contract.yaml), [contracts/stripe-webhook.md](contracts/stripe-webhook.md), [quickstart.md](quickstart.md)

**Build with**: `/build-feature specs/001-tournament-registration/spec.md`, one phase per pull request. Do not use `/speckit-implement`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story id (US1 … US6)
- Name the feature package or folder. Give an exact file path only when the path is itself a contract, and derive the rest from the code while building
- Tests are written first and must fail for the right reason before the implementation task that follows them (constitution IV). Test names carry the requirement issue they cover.

## Path Conventions

- API: `src/bjjeire-api/src/main/java/com/bjjeire/api/{tournament,competitor,registration}/`
- API tests: `src/bjjeire-api/src/test/java/com/bjjeire/api/<same package>/` (`*Test` unit, `*IT` extending `testsupport.MongoIntegrationTest`)
- SPA: `src/bjjeire-app/src/features/{tournaments,competitor,registrations,tournament-admin}/`
- Test seed: `seeder/data-test/tournaments/` (no production seed)
- Acceptance: `bjjeire-tests` (separate PR)

## Phase 1: Setup — governance, specs and prerequisites

**Purpose**: Amend the rules the feature changes before any code, and line up what cannot be created from this repository.

- [ ] T001 External prerequisites. (a) Competitor app registrations are added in the terraform repo `bjjeire-terraform-azurerm-aks`, file `main.app-registrations.tf` (owner's instruction, 2026-11-13): an API registration exposing scope `access_as_competitor` and a SPA registration with the site's redirect URIs, both in the external tenant, which needs its own provider configuration there; plus the sign-up user flow and two test users. That repo is mounted at `/workspaces/bjjeire-terraform-azurerm-aks` and `bjjeire-gitops` at `/workspaces/bjjeire-gitops` after a container rebuild; edit them from here, the owner applies. Its outputs (issuer URI, API audience, SPA client id, authority) are brought back as variable names. (b) The owner supplies the Stripe test secret key. (c) SMTP relay details for non-local environments. Record only variable names, never values, in `docs/` or `.env.example`
- [ ] T002 Create the requirement issues `#5001`–`#5041` and a new epic in `bjjeire/requirements` (or ask the owner to), then replace the provisional ids in `specs/001-tournament-registration/spec.md` if the real numbers differ
- [ ] T003 [P] Write `docs/adr/0012-competitor-identity-second-issuer.md` from research R1, R2, R11 using `docs/adr/0000-template.md`; add it to `docs/adr/README.md` and the table in `AGENTS.md`
- [ ] T004 [P] Write `docs/adr/0013-stripe-hosted-checkout-and-webhooks.md` from research R3, R4, R5, R10; add it to `docs/adr/README.md` and the table in `AGENTS.md`
- [ ] T005 Amend `.specify/memory/constitution.md` to 1.1.0: principle V reworded per research R9; principle II lists `tournament`, `competitor`, `registration`; add a migration note. Depends on T003, T004
- [ ] T006 [P] Create `specs/features/tournaments.md` as the living feature file (status "In progress", link to this directory) and add the row to `specs/README.md`
- [ ] T007 [P] Create `specs/stc/tournaments/{spec.md,contract.yaml,traceability.md}` from `contracts/contract.yaml` and the spec's acceptance scenarios; add the row and the `&5` / `#5001`–`#5041` range to `specs/stc/README.md`
- [ ] T008 [P] Update `specs/system-architecture.md` (topology: external tenant, Stripe, SMTP; API shape table: three routes and four collections), `.specify/rules/java-rules.md`, `.specify/rules/mongodb-rules.md` and the package list in `AGENTS.md`
- [ ] T107 Cluster wiring, in this order (research R15): (1) apply `bjjeire-terraform-azurerm-aks` so the four `bjj-api-competitor-*` / `bjj-api-stripe-*` Key Vault secrets exist in the environment (placeholders are already in `variables.tournament.tf` and `main.key-vault.tf`); (2) in `bjjeire-deploy`, let the API chart take the Stripe values from a Kubernetes secret by reference and the mail settings from values; (3) only then, in `bjjeire-gitops`, add an `ExternalSecret` for those four names in `kubernetes/apps/base/bjj-eire/app/externalsecrets.yaml` (and the preview copies), the Helm release mapping, and `ServiceEntry` resources in `kubernetes/apps/base/istio-egress/config/service-entries.yaml` for Stripe, the external tenant's sign-in host, Microsoft Graph and the SMTP relay
- [ ] T009 Verify the three vendor facts marked **Verify** in `research.md` against current vendor documentation (Stripe Checkout Session minimum expiry; external-tenant issuer/authority format and verified-email claim; least-privileged Graph permission to delete an external-tenant user). Correct `research.md`, and `spec.md` FR-019 if the hold time changes

---

## Phase 2: Foundational — flag, routes and two-issuer security (blocks every story)

**Purpose**: The plumbing every story needs. No user-visible behaviour yet.

**⚠️ CRITICAL**: No user story work starts until this phase is complete.

### Tests first

- [ ] T010 [P] Failing unit test in `src/bjjeire-api/src/test/java/com/bjjeire/api/config/`: a workforce-issuer token with scope `access_as_writer` maps to the writer authority; an external-issuer token with scope `access_as_competitor` maps to `ROLE_COMPETITOR`; an external-issuer token without that scope gets no competitor role; a token from any third issuer is rejected
- [ ] T011 [P] Failing test extending `CrossCuttingFilterTest` in the same package: with read-only mode on, `POST` under `/api/v1/tournament`, `/api/v1/competitor` and `/api/v1/registration` passes the filter while `POST /api/v1/gym` still answers 405
- [ ] T012 [P] Failing test in `src/bjjeire-api/src/test/java/com/bjjeire/api/web/`: `Tournaments` appears in the feature-flag response and defaults to `false`

### Implementation

- [ ] T013 Add `TOURNAMENT = "/api/v1/tournament"`, `COMPETITOR = "/api/v1/competitor"`, `REGISTRATION = "/api/v1/registration"` to `common/ApiRoutes.java` and `TOURNAMENTS_TAG` to `common/ApiCache.java`
- [ ] T014 Add the `Tournaments` flag (default off, `FEATURE_TOURNAMENTS`) to `web/FeatureFlag*.java` and `src/bjjeire-api/src/main/resources/application.yml`; extend `config/BjjEireProperties.java` with `competitorAuth(issuerUri, audience, scope)`, `stripe(secretKey, webhookSecret, successUrlBase)`, `mail(from)` and `registration(holdMinutes=30)`, each with safe defaults for tests. Placeholder `competitor-auth` and `stripe` keys (all-zero tenant, `sk_test_REPLACE_ME`, `whsec_REPLACE_ME`) are already in `application.yml` and `docker-compose.yml`; bind them here and replace the values through the environment once the owner supplies the real tenant and Stripe test keys
- [ ] T015 Rework `config/SecurityConfig.java` to an issuer-based authentication manager resolver trusting exactly the workforce issuer and the external issuer (research R2). Keep the existing catch-all "POST/PUT/PATCH/DELETE require the writer authority" as the last write rule. Makes T010 pass
- [ ] T016 Add matchers in `config/SecurityConfig.java` above the catch-all, exactly as `contracts/contract.yaml` lists auth per route: public `GET` under `/api/v1/tournament` except `/admin` and `/{id}/registration`; `ROLE_COMPETITOR` for `/api/v1/competitor/**`, `/api/v1/registration/**` and `GET /api/v1/tournament/{id}/eligible-division`; `permitAll` for `POST /api/v1/registration/stripe-webhook` only
- [ ] T017 Make `config/ReadOnlyModeFilter.java` skip the three new route prefixes (research R10). Makes T011 pass
- [ ] T018 Add a server-side flag gate (filter or interceptor in `web/`) that answers 404 ProblemDetail for the three route prefixes when `Tournaments` is off
- [ ] T019 [P] SPA: add `Tournaments` to `src/bjjeire-app/src/features/feature-flags/definitions.ts` and `src/bjjeire-app/src/config/features.ts` (default off, fail closed), the three routes to `src/bjjeire-app/src/config/api-routes.ts`, and an empty `src/bjjeire-app/src/constants/tournamentDataTestIds.ts`
- [ ] T020 SPA: add a second MSAL configuration for the external tenant in `src/bjjeire-app/src/lib/msal-config.ts` (`VITE_APP_COMPETITOR_CLIENT_ID`, `VITE_APP_COMPETITOR_AUTHORITY`, `VITE_APP_COMPETITOR_SCOPE`, baked at build per ADR-0006) and make `src/bjjeire-app/src/lib/api-client.ts` attach the competitor token to competitor and registration routes and the admin token to admin routes, with failing integration tests first beside the existing `api-client` tests
- [ ] T021 [P] Add a mail catcher service (Mailpit) to `docker-compose.yml`, the new variables to the compose `api` service and build args, and the same names to `Dockerfile`s / `build-react.sh` where `VITE_APP_*` values are passed
- [ ] T022 Add `com.stripe:stripe-java` and `spring-boot-starter-mail` to `src/bjjeire-api/pom.xml` with pinned versions as properties

**Checkpoint**: `mvn -pl src/bjjeire-api test` and `npm run lint && npm run typecheck && npm test` pass; flag off means no behaviour change.

---

## Phase 3: User Story 6 — Existing directory stays open and read-only (Priority: P1)

**Goal**: Prove the new plumbing changed nothing for visitors and gives competitors no power over the directory.

**Independent Test**: Signed out, browse every existing section with the flag off and on; with a competitor token, every directory write is refused.

### Tests first

- [ ] T023 [P] [US6] Extend `src/bjjeire-api/src/test/java/com/bjjeire/api/config/WriteAuthorizationIT.java`: a competitor token gets 403 on `POST`, `PUT` and `DELETE` for each of `/api/v1/gym`, `/api/v1/bjjevent`, `/api/v1/competition`, `/api/v1/store` (`#5037`); anonymous `GET` on each still returns 200 with the flag on and off (`#5036`)
- [ ] T024 [P] [US6] IT in the same package: with `Tournaments` off, every route in `contracts/contract.yaml` answers 404; with it on and read-only mode on, a directory write with an admin token still answers 405 (`#5038`)
- [ ] T025 [P] [US6] Vitest integration test in `src/bjjeire-app/src/__tests__/` or beside the router: with the flag off there is no Tournaments navigation entry and no account entry point; `/tournaments` redirects as other gated routes do (`#5038`)

### Implementation

- [ ] T026 [US6] Fix whatever T023–T025 expose in `config/SecurityConfig.java`, the flag gate and `src/bjjeire-app/src/App.tsx`; add the gated navigation entry and strings in `src/bjjeire-app/src/config/ui-content.ts`
- [ ] T027 [US6] Confirm the existing acceptance suite needs no change; list `#5036` and `#5038` in `bjjeire-tests/specs/features/tournaments.md` (created here, implemented in that repository)

**Checkpoint**: Slice 0 is mergeable. Existing behaviour proven unchanged.

---

## Phase 4: User Story 1 — Organiser publishes a tournament (Priority: P1) 🎯 MVP

**Goal**: The admin creates a draft tournament with divisions and publishes it; anyone can see it.

**Independent Test**: Admin creates and publishes "BjjEire"; a signed-out visitor opens its page and sees details, fee, window and divisions.

### Tests first

- [ ] T028 [P] [US1] Unit tests in `tournament/` for the domain rules: publish requires at least one division and `registrationClosesAt` after `registrationOpensAt` and not after the end of `date`; the division tuple (`discipline`, `gender`, `ageCategory`, `belt`, `weightClass`) is unique within a tournament; state transitions follow `DRAFT → PUBLISHED → FINISHED`, `DRAFT|PUBLISHED → CANCELLED` and nothing else; `registrationState` computes `NOT_OPEN | OPEN | CLOSED | FULL` (`#5003`)
- [ ] T029 [P] [US1] Standalone MockMvc controller test in `tournament/`: validation 400s for `name` "required, ≤ 120", `description` "≤ 4000", `entryFeeCents` "≥ 0", missing window; unknown id 404
- [ ] T030 [P] [US1] `TournamentRepositoryIT` in `tournament/`: `ix_tournament_slug_unique` rejects a duplicate slug; public listing returns only `PUBLISHED`, `FINISHED`, `CANCELLED` ordered by date; a draft is absent (`#5001`, `#5002`)
- [ ] T031 [P] [US1] `TournamentAdminIT` in `tournament/`: create returns 201 with status `DRAFT` (`#5001`); anonymous and competitor tokens get 401/403 on create, update and publish (`#5004`); publish makes it visible by slug to an anonymous client (`#5002`); a draft fetched by slug anonymously is 404
- [ ] T032 [P] [US1] Vitest tests in `src/bjjeire-app/src/features/tournaments/`: list renders tournaments from MSW; details page shows fee formatted from cents as euro, registration window in `Europe/Dublin`, divisions grouped, and the "opens on" / "closed" message with no sign-up button when not open (`#5003`)
- [ ] T033 [P] [US1] Vitest tests in `src/bjjeire-app/src/features/tournament-admin/`: create form validation; division generator produces the cross-product of the selected disciplines, genders, age categories, belts and weight classes and lets rows be removed; publish button disabled with no divisions
- [ ] T034 [P] [US1] Pact consumer test `src/bjjeire-app/src/contracts/pact/tournament.pact.test.ts` for `GET /api/v1/tournament` and `GET /api/v1/tournament/{slug}`

### Implementation

- [ ] T035 [US1] `tournament/` domain: `Tournament` (`@Document("Tournament")`) with every field in data-model.md § Tournament, embedded `Division` and enums `TournamentStatus`, `Discipline {GI, NO_GI}`, `Gender {MALE, FEMALE}`, `AgeCategory {ADULT, MASTER_1..MASTER_5}` with minimum ages 18/30/36/41/46/51, `Belt {WHITE, BLUE, PURPLE, BROWN, BLACK}`; `currency` always `"EUR"`; `venue` is the shared `Location`
- [ ] T036 [US1] `tournament/` repository and the two indexes `ix_tournament_slug_unique` (unique, critical) and `ix_tournament_status_date` in `config/MongoIndexInitializer.java`
- [ ] T037 [US1] `tournament/` commands, DTOs (`TournamentSummaryDto`, `TournamentDto`, `DivisionDto`), mapper and service: create, update (rejecting removal of a division with active sign-ups is stubbed to "no sign-ups exist" until Phase 6 wires the check, `#5005`), publish; audit through `audit.AuditRecorder`; evict `TOURNAMENTS_TAG` after each write
- [ ] T038 [US1] `tournament/` controllers: public `GET /api/v1/tournament`, `GET /api/v1/tournament/{slug}`; admin `GET /api/v1/tournament/admin`, `POST /api/v1/tournament`, `PUT /api/v1/tournament/{id}`, `POST /api/v1/tournament/{id}/publish`. Thin, delegating to the service
- [ ] T039 [P] [US1] SPA `features/tournaments/`: API functions, `usePaginatedQuery` list hook, list and details components; pages `TournamentsPage` and `TournamentPage` at `/tournaments` and `/tournaments/:slug` behind the feature gate; strings in `ui-content.ts`; ids in `tournamentDataTestIds.ts`; MSW handlers in `src/bjjeire-app/src/testing/msw/handlers/tournaments.ts`; all three themes via semantic tokens
- [ ] T040 [US1] SPA `features/tournament-admin/`: admin sign-in guard using the existing workforce MSAL configuration; pages `/admin/tournaments` (list incl. drafts, create) and `/admin/tournaments/:id` (edit details, division generator, publish)
- [ ] T041 [P] [US1] Write `specs/database-contracts/tournament.md` from data-model.md; add `seeder/data-test/tournaments/` with a `_template.json` and one published test tournament; teach the seeder package to load the collection in test environments only
- [ ] T042 [US1] Regenerate `src/bjjeire-app/src/types/generated/api.ts` from the served OpenAPI; confirm `OpenApiContractIT` shows additions only
- [ ] T043 [US1] List `#5002`, `#5003` in `bjjeire-tests/specs/features/tournaments.md`

**Checkpoint**: Quickstart scenario 2 passes. A real tournament can be announced.

---

## Phase 5: User Story 2 — Competitor creates an account and profile (Priority: P1)

**Goal**: A member of the public registers, signs in, and keeps a private competitor profile.

**Independent Test**: A new person registers through the hosted flow, completes the profile, signs out and back in, and sees it saved.

### Tests first

- [ ] T044 [P] [US2] Unit tests in `competitor/`: validation for `firstName` "required, ≤ 60", `middleName` "≤ 60", `lastName` "required, ≤ 60", `nationality` "ISO 3166-1 alpha-2", `dateOfBirth` "required; in the past", `affiliation` "≤ 80", `academy.name` "≤ 80"; `profileComplete` is true only when first name, last name, nationality, date of birth, gender and belt are present
- [ ] T045 [P] [US2] `CompetitorIT` in `competitor/`: `GET /me` is 404 before a profile exists; `PUT /me` creates then updates the caller's own document keyed by (`issuer`, `subject`) and takes `email` from the token claim (`#5007`); two saves with the same identity never create two documents (`ix_competitor_issuer_subject_unique`, `#5010`); an `academy.gymId` that is not in `Gym` is 400; `academy` null and `affiliation` null are accepted (`#5008`)
- [ ] T046 [P] [US2] `CompetitorPrivacyIT` in `competitor/`: a second competitor's token can never read or change the first profile, there is no route that takes a competitor id, and anonymous and admin-less calls get 401 (`#5009`)
- [ ] T047 [P] [US2] `CompetitorDeletionIT` in `competitor/`: `DELETE /me` removes the document, calls the identity-deletion gateway once, and a later `GET /me` with the same token is 404 (`#5012`). The gateway is an interface with a recording fake
- [ ] T048 [P] [US2] Vitest tests in `src/bjjeire-app/src/features/competitor/`: signed-out "Sign up" starts the external-tenant sign-in and returns to the requested path (`#5006`, `#5013`); profile form validation; academy picker searches the gym directory, allows a typed name, and offers "no academy"; affiliation is a separate optional field (`#5008`); medal totals and history render from the history response and show the empty state (`#5039`)

### Implementation

- [ ] T049 [US2] `competitor/` domain: `Competitor` (`@Document("Competitor")`) with every field in data-model.md § Competitor, `Academy(gymId, name)`, `PostalAddress(street, postcode, city, region, country)`; repository; index `ix_competitor_issuer_subject_unique` (unique, critical) in `config/MongoIndexInitializer.java`
- [ ] T050 [US2] `competitor/` `SaveCompetitorCommand`, `CompetitorDto` (includes `profileComplete`), mapper, service resolving the caller from the security context, controller `GET` / `PUT /api/v1/competitor/me`; when `academy.gymId` is set, copy the gym's name
- [ ] T051 [US2] `competitor/` `GET /api/v1/competitor/me/history` returning `CompetitorHistoryDto` with zero totals and an empty list (filled in Phase 8)
- [ ] T052 [US2] `competitor/` account deletion: `DELETE /api/v1/competitor/me`; `IdentityDirectory` interface with a Microsoft Graph implementation using client credentials for the external tenant (research R11) and configuration in `BjjEireProperties`; the "has active registration" conflict is wired in Phase 7
- [ ] T053 [US2] SPA `features/competitor/`: sign-in / sign-out with the external MSAL instance and return-to-path; `/account/profile` page with profile form, medal totals, history list and delete-account confirmation; header account menu shown only when the flag is on
- [ ] T054 [P] [US2] Write `specs/database-contracts/competitor.md`; add Pact interactions for `GET` / `PUT /api/v1/competitor/me`; regenerate API types
- [ ] T055 [US2] List `#5006`, `#5007`, `#5008` in `bjjeire-tests/specs/features/tournaments.md`, noting the two test users from T001

**Checkpoint**: Quickstart scenario 3 passes.

---

## Phase 6: User Story 3 — Competitor signs up, picks a division and pays (Priority: P1)

**Goal**: A signed-in competitor with a complete profile enters a division, pays through Stripe, and is confirmed and listed.

**Independent Test**: With a published tournament in its window, a competitor signs up, pays with a Stripe test card, and appears in the division's public list.

### Tests first

- [ ] T056 [P] [US3] Unit tests in `competitor/` for the eligibility rule (research R13): gender and belt must equal the division's; age on the tournament `date` in `Europe/Dublin` must be at least the category minimum; a 40-year-old is offered `ADULT`, `MASTER_1`, `MASTER_2` and not `MASTER_3`; anyone under 18 on the day is refused for every division, including the day before an 18th birthday (`#5014`, `#5019`)
- [ ] T057 [P] [US3] Unit tests in `registration/` for the sign-up state machine in data-model.md: only the transitions drawn there are allowed; `active` is `true` exactly in `AWAITING_PAYMENT` and `CONFIRMED` and absent otherwise; `holdExpiresAt` is now + 30 minutes
- [ ] T058 [P] [US3] `RegistrationIT` in `registration/` with a fake Stripe gateway: `POST /api/v1/registration` returns 201 with `checkoutUrl` and takes a place; each conflict in `contracts/contract.yaml` returns 409 with its own problem type and creates no checkout (`registration-not-open`, `not-eligible`, `under-18`, `already-registered` `#5017`, `tournament-full` `#5020`, `profile-incomplete`); missing consent flags are 400; the amount sent to Stripe is the tournament's `entryFeeCents`, never a client value; gi and no-gi divisions give two registrations with two payments (`#5018`)
- [ ] T059 [P] [US3] `RegistrationConcurrencyIT` in `registration/`: with `competitorLimit` 1, two simultaneous sign-ups by different competitors yield exactly one `AWAITING_PAYMENT` and one `tournament-full`; two simultaneous sign-ups by the same competitor for the same division yield exactly one registration (`ux_registration_active_competitor_division`)
- [ ] T060 [P] [US3] `StripeWebhookIT` in `registration/` posting payloads signed with a test secret: bad or missing signature is 400 and changes nothing; "session completed" moves `AWAITING_PAYMENT` to `CONFIRMED`, sets payment `PAID`, sends one confirmation mail (`#5015`); the same event delivered twice changes nothing the second time; "session expired" moves to `EXPIRED` and gives the place back (`#5016`); a completed event after the hold lapsed with no free place refunds in full and ends `CANCELLED`; unknown event types are 200
- [ ] T061 [P] [US3] `RegistrationOwnershipIT` in `registration/`: `GET /api/v1/registration/me` returns only the caller's sign-ups with tournament, division, `amountCents` and status (`#5021`); another competitor's id on any `/{id}` route is 403
- [ ] T062 [P] [US3] `PublicCompetitorListIT` in `tournament/` or `registration/`: `GET /api/v1/tournament/{id}/competitor` lists only `CONFIRMED` sign-ups grouped by division with `displayName`, academy name and affiliation, and the JSON contains none of `email`, `dateOfBirth`, `phone`, `address`, `nationality`, `competitorId` (`#5015`, FR-011)
- [ ] T063 [P] [US3] Vitest tests in `src/bjjeire-app/src/features/registrations/`: sign-up page lists only eligible divisions; both consent boxes are required before continuing (FR-012); the fee is shown before leaving for checkout; the return page polls until `CONFIRMED` and shows the abandoned / failed state with a retry (`#5016`); "tournament full" and "under 18" messages; my sign-ups table (`#5021`)

### Implementation

- [ ] T064 [US3] `registration/` domain: `TournamentRegistration` (`@Document("TournamentRegistration")`) with every field in data-model.md, embedded `Payment` (`status` `PENDING | PAID | FAILED`) and `Refund` (`status` `PENDING | REFUNDED | FAILED`), `StripeEvent` with the Stripe event id as `_id` and a 30-day TTL; repositories; the five registration indexes and `ttl_stripeEvent_expiresAt` in `config/MongoIndexInitializer.java`, with `ux_registration_active_competitor_division` unique and partial on `active == true`
- [ ] T065 [US3] `tournament/` atomic place counter: `takePlace` (`findAndModify` where `status == PUBLISHED` and `competitorLimit` is null or `placesTaken < competitorLimit`, `$inc placesTaken 1`) and `releasePlace` (guarded `$inc -1`), exposed through the tournament service for `registration/` to call
- [ ] T066 [US3] `competitor/` eligibility rule as a pure function and `GET /api/v1/tournament/{id}/eligible-division` (competitor auth). Makes T056 pass
- [ ] T067 [US3] `registration/` `PaymentGateway` interface and Stripe implementation per `contracts/stripe-webhook.md` § "Outbound: create Checkout Session": hosted payment mode, one EUR line item, `client_reference_id` = registration id, metadata, `customer_email`, expiry = `holdExpiresAt`, idempotency key `checkout-<registrationId>-<attempt>`
- [ ] T068 [US3] `registration/` sign-up service and `POST /api/v1/registration`: check window, profile completeness, age, eligibility; take a place; insert the registration with the name / academy / affiliation snapshot and `academyKey` / `affiliationKey` (research R8); create the session; give the place back if any later step fails. `POST /api/v1/registration/{id}/checkout` returns a fresh URL while the hold is valid
- [ ] T069 [US3] `registration/` webhook controller `POST /api/v1/registration/stripe-webhook`: read the raw body, verify `Stripe-Signature`, insert the event id into `StripeEvent` first, dispatch "completed" and "expired" as the table in `contracts/stripe-webhook.md` says, return 5xx on failure
- [ ] T070 [US3] `registration/` hold sweep: a scheduled job that expires `AWAITING_PAYMENT` sign-ups whose `holdExpiresAt` has passed and releases their places, safe to run on several pods
- [ ] T071 [US3] `registration/` mail sender: `Mailer` interface, SMTP implementation with `spring-boot-starter-mail`, sent asynchronously after the state is saved, three attempts and a failure counter metric; "sign-up confirmed" template
- [ ] T072 [US3] `registration/` reads: `GET /api/v1/registration/me`; public `GET /api/v1/tournament/{id}/competitor` built only from registration snapshots; replace the Phase 4 stub so removing a division with active sign-ups is refused (`#5005`); evict `TOURNAMENTS_TAG` on every registration write
- [ ] T073 [US3] `competitor/` propagate a profile change of name, academy or affiliation to the caller's active registrations in tournaments that are not finished or cancelled, and set `profileMismatch` when belt or gender no longer fits a held division (research R8, spec edge case)
- [ ] T074 [US3] SPA `features/registrations/`: `/tournaments/:slug/signup` (redirect to sign-in or profile completion first, `#5013`), `/tournaments/:slug/signup/complete`, `/account/signups`; competitor list on the tournament page; strings, ids, MSW handlers
- [ ] T075 [P] [US3] Write `specs/database-contracts/tournament-registration.md` (incl. `StripeEvent`); add Pact interactions for the registration routes the SPA calls (not the webhook); regenerate API types; add Stripe CLI and test-card notes to `docs/`
- [ ] T076 [US3] List `#5013`–`#5016`, `#5019`, `#5021` in `bjjeire-tests/specs/features/tournaments.md` with the Stripe test-mode precondition

**Checkpoint**: Quickstart scenario 4 passes. With Phases 3–6 the owner can take paid entries.

---

## Phase 7: User Story 4 — Competitor cancels or changes a sign-up (Priority: P2)

**Goal**: Self-service cancellation with automatic refund before close, division change, tournament cancellation, and the admin's sign-up tools.

**Independent Test**: A confirmed competitor cancels before close, disappears from the list and is refunded in full.

### Tests first

- [ ] T077 [P] [US4] `CancellationIT` in `registration/` with the fake gateway: cancel before `registrationClosesAt` creates one refund for the full `payment.amountCents` with key `refund-<registrationId>`, sets status `CANCELLED` and refund `PENDING`, releases the place, removes the competitor from the public list (`#5022`); cancel after close creates no refund (`#5023`); the response says whether a refund was issued and for how much; one mail per cancellation stating the refund outcome (`#5027`); cancelling twice is a no-op
- [ ] T078 [P] [US4] `RefundWebhookIT` in `registration/`: "refund succeeded" moves refund to `REFUNDED` and sends the refund mail; "refund failed" moves it to `FAILED`, raises the admin alert metric / log, and `RegistrationDto` reports "refund pending"
- [ ] T079 [P] [US4] `ChangeDivisionIT` in `registration/`: change to an eligible division while open moves the sign-up with no payment call and unchanged `placesTaken` (`#5024`); after close it is 409 `registration-closed` (`#5025`); an ineligible or already-held target is 409
- [ ] T080 [P] [US4] `TournamentCancellationIT` in `tournament/` or `registration/`: cancelling a published tournament refunds every `CONFIRMED` sign-up in full and mails each competitor; a failure part-way can be re-run without double refunds (`#5026`)
- [ ] T081 [P] [US4] `AdminRegistrationIT` in `registration/`: paged admin list with division, status, payment and refund; `?format=csv` returns every row as `text/csv` (FR-006); admin move works after close; admin cancel honours the `refund` flag; team merge rewrites academy or affiliation and keys on every matching registration of that tournament only (FR-007); all four are refused for competitor and anonymous callers
- [ ] T082 [P] [US4] Vitest tests in `features/registrations/` and `features/tournament-admin/`: cancel dialog shows the refund amount before close and the "no refund" warning after (`#5023`); change-division control hidden after close with the "contact the organiser" message (`#5025`); admin sign-up table, export link, move, cancel and merge dialogs

### Implementation

- [ ] T083 [US4] `registration/` refund path: `PaymentGateway.refund` per `contracts/stripe-webhook.md` § "Outbound: create refund"; competitor `POST /api/v1/registration/{id}/cancel` returning `CancellationDto`; `RegistrationDto.refundableUntil`; webhook handling for refund succeeded / failed; "cancelled" and "refunded" mail templates
- [ ] T084 [US4] `registration/` `PUT /api/v1/registration/{id}/division` for the owner, reusing the eligibility rule and the unique index for conflicts
- [ ] T085 [US4] `tournament/` `POST /api/v1/tournament/{id}/cancel` driving a resumable refund-all in `registration/`, with the "tournament cancelled" mail template
- [ ] T086 [US4] `registration/` admin routes from `contracts/contract.yaml`: list and CSV export, admin move, admin cancel, `POST /api/v1/tournament/{id}/team-merge`; wire the "has active registration" conflict into `DELETE /api/v1/competitor/me` and anonymise snapshots on deletion (research R11)
- [ ] T087 [US4] SPA: cancel and change-division on `/account/signups`; admin sign-ups tab on `/admin/tournaments/:id` with export, move, cancel, merge and a "paid but not confirmed" reconciliation indicator; tournament cancel action
- [ ] T088 [US4] Update Pact, generated types and `specs/database-contracts/tournament-registration.md`; list `#5022`–`#5024` in `bjjeire-tests/specs/features/tournaments.md`

**Checkpoint**: Quickstart scenarios 5 and 7 pass.

---

## Phase 8: User Story 5 — Results, leaderboard and team points (Priority: P2)

**Goal**: The admin records podiums; the public sees podiums, an academy ranking, an affiliation ranking, and the winners when the tournament is finished.

**Independent Test**: With confirmed sign-ups in a division, the admin records the podium and a signed-out visitor sees it and both updated rankings.

### Tests first

- [ ] T089 [P] [US5] Unit tests in `tournament/` for the points calculation as a pure function: 9 per gold, 3 per silver, 1 per bronze, added per academy key and per affiliation key across divisions (`#5029`, `#5040`); order by points, then golds, silvers, bronzes (`#5030`); a medallist with no academy adds nothing to the academy ranking and likewise for affiliation (`#5031`); a division with one confirmed competitor adds no points (`#5032`); entries level on every tie-break are joint winners; winners are present only when status is `FINISHED` (`#5041`)
- [ ] T090 [P] [US5] `DivisionResultIT` in `tournament/`: recording gold, silver and up to two bronzes succeeds only when every id is a `CONFIRMED` registration in that division (409 `not-in-division`), no id repeats (409 `duplicate-medallist`) and there are at most two bronzes (`#5028`); correcting a result replaces it (`#5033`); competitor and anonymous callers are refused (`#5035`); a competitor named in a result cannot cancel (409 `result-recorded`, FR-026)
- [ ] T091 [P] [US5] `LeaderboardIT` in `tournament/`: no results gives empty podiums and rankings (`#5034`); after a result write, a merge, a move or a cancellation the next read reflects it (cache eviction, SC-006); the JSON contains none of the private field names; a medallist whose account was deleted keeps the medal and points with the placeholder name
- [ ] T092 [P] [US5] `CompetitorHistoryIT` in `competitor/`: totals and per-tournament medals match the recorded results for the caller only (`#5039`)
- [ ] T093 [P] [US5] Vitest tests in `features/tournaments/` and `features/tournament-admin/`: leaderboard empty state (`#5034`), podium cards, two ranking tables, winners banner when finished, joint winners; results entry form limits choices to that division's confirmed competitors and blocks duplicates

### Implementation

- [ ] T094 [US5] `tournament/` `DivisionResult` embedded in `Division` with `goldRegistrationId` (required), `silverRegistrationId`, `bronzeRegistrationIds` (0–2), `recordedAt`, `recordedBy`; `RecordResultCommand`; `PUT` and `DELETE /api/v1/tournament/{id}/division/{divisionId}/result`; `POST /api/v1/tournament/{id}/finish`
- [ ] T095 [US5] `tournament/` points calculation and `GET /api/v1/tournament/{id}/leaderboard` returning `LeaderboardDto` (`podiums[]`, `academyRanking[]`, `affiliationRanking[]`, `winners`), cached under `TOURNAMENTS_TAG` and evicted by every result, merge, move and cancellation write
- [ ] T096 [US5] `registration/` refuse cancel and division change when a result names the registration; `competitor/` fill `GET /api/v1/competitor/me/history` from registrations joined to results
- [ ] T097 [US5] SPA: leaderboard section on `/tournaments/:slug`; results tab and finish action on `/admin/tournaments/:id`; medal history on `/account/profile`
- [ ] T098 [US5] Update Pact, generated types and `specs/database-contracts/tournament.md`; list `#5028`, `#5029`, `#5034`, `#5039`, `#5040`, `#5041` in `bjjeire-tests/specs/features/tournaments.md`

**Checkpoint**: Quickstart scenario 6 passes. All stories complete.

---

## Phase 9: Polish and verification

- [ ] T099 [P] Complete `specs/stc/tournaments/traceability.md`: every issue `#5001`–`#5041` maps to a test path and an implementation path; resolve any left `UNTESTED`
- [ ] T100 [P] Mark `specs/features/tournaments.md` as Living and make it the single behavioural source; note in `specs/README.md` that `specs/001-tournament-registration/` is the design record
- [ ] T101 [P] Add structured logs and metrics for sign-up started / confirmed / expired, refund requested / succeeded / failed, webhook rejected, mail failed; document the alert for refund failures and for "paid but not confirmed" in `docs/`
- [ ] T102 [P] Check `.github/path-filters.yml` covers `seeder/data-test/tournaments/` and the new packages, and that no job was added outside `pr_complete.needs` (ADR-0003)
- [ ] T103 Load check for SC-009: seed 500 confirmed sign-ups over 60 divisions with results, then 200 concurrent readers on the tournament page data and leaderboard; record the numbers in `specs/001-tournament-registration/quickstart.md`
- [ ] T104 `mvn clean verify`; `npm run lint && npm run typecheck && npm test && npm run test:integration && npm run test:pact` in `src/bjjeire-app`; confirm `check_openapi_breaking` and `check_frontend_api_compat` report additions only
- [ ] T105 Run all seven manual scenarios in `quickstart.md` in a preview with the flag on, Stripe test mode and the test competitor accounts; run `spec-verifier` against the spec and the final diff
- [ ] T106 Hand the owner the production checklist: external tenant and app registrations, Stripe live keys and webhook endpoint, SMTP relay, new values in `bjjeire-gitops`, privacy notice and terms of entry text, then `FEATURE_TOURNAMENTS=true`

---

## Dependencies & Execution Order

### Phase dependencies

```
Phase 1 Setup ─▶ Phase 2 Foundational ─▶ Phase 3 US6 ─▶ Phase 4 US1 ─┬─▶ Phase 6 US3 ─▶ Phase 7 US4 ─┐
                                                      └▶ Phase 5 US2 ─┘                └▶ Phase 8 US5 ─┴▶ Phase 9
```

- **Setup**: T003, T004 before T005. T001 is needed by T015, T020 (tenant values) and T067 (Stripe key); T009 before T014's `holdMinutes` and T052.
- **Foundational** blocks everything. T013, T014 before T015–T018.
- **US6** only needs Foundational.
- **US1** and **US2** are independent of each other and can run in parallel after US6.
- **US3** needs US1 (a published tournament with divisions) and US2 (a complete profile).
- **US4** and **US5** both need US3 and are independent of each other, except T096's cancel guard, which touches the cancel service from T083. If US5 lands first, T096 guards the route once it exists.

### Within each story

Tests first and failing → domain → repository and indexes → service → controller → SPA → contracts and generated types → acceptance listing.

### Parallel opportunities

- Phase 1: T003, T004, T006, T007, T008 together.
- Phase 2: T010–T012 together; T019 and T021 alongside the API work.
- Every story: all of its "Tests first" tasks are `[P]`.
- US1 and US2 as two parallel streams; US4 and US5 as two parallel streams.
- Within a story, the SPA task and the API tasks can proceed together against the MSW handlers once the contract is agreed.

## Parallel example: User Story 3

```text
# All failing tests for the story together:
T056 eligibility rule unit tests            (competitor/)
T057 sign-up state machine unit tests       (registration/)
T058 RegistrationIT                         (registration/)
T059 RegistrationConcurrencyIT              (registration/)
T060 StripeWebhookIT                        (registration/)
T061 RegistrationOwnershipIT                (registration/)
T062 PublicCompetitorListIT                 (tournament/ or registration/)
T063 SPA sign-up flow tests                 (features/registrations/)

# Then, in order: T064 → T065 → T066 → T067 → T068 → T069 → T070 → T071 → T072 → T073
# SPA T074 can start from the MSW handlers as soon as T063 exists.
```

## Implementation strategy

### MVP

Phases 1–4 (Setup, Foundational, US6, US1): the "BjjEire" tournament can be
published and seen by everyone, with the existing site proven unchanged. It
takes no entries yet.

### First release that takes money

Add Phases 5 and 6 (US2, US3). Keep the flag off in production until Phase 6's
checkpoint passes in a preview with Stripe test mode. Cancellations before
Phase 7 are handled by the owner in the Stripe dashboard.

### Full feature

Phase 7 (US4) before registration opens to the public if possible, since it
carries refunds. Phase 8 (US5) is needed only by the tournament day.

### One pull request per phase

Each phase from 2 to 8 is a pull request built with `/build-feature`, verified
by `spec-verifier` with fresh context. Acceptance tests follow in
`bjjeire-tests` as separate pull requests.

## Notes

- 107 tasks (T107 was added to Setup after numbering, so it sits out of sequence): Setup 10 · Foundational 13 · US6 5 · US1 16 · US2 12 · US3 21 · US4 12 · US5 10 · Polish 8.
- Issue coverage per task is in the task text; the full map lands in `specs/stc/tournaments/traceability.md` (T099).
- Requirements with no dedicated issue (FR-006, FR-007, FR-019, FR-023, FR-030) are covered by T081, T057 / T070, T064 and T077; consider adding issues for them in T002.
