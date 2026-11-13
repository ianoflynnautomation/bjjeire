# Implementation Plan: In-House Tournament Registration

**Branch**: `001-tournament-registration` (not yet created) | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-tournament-registration/spec.md`

## Summary

Add tournaments that BjjEire runs itself: the admin creates and publishes a
tournament; members of the public create an account and a private competitor
profile, sign up for a division, pay the entry fee, and can cancel or change
division; the admin records each division's podium; a public leaderboard shows
podiums plus an academy ranking and an affiliation ranking (9 / 3 / 1).

Technical approach: three new feature packages in the existing API
(`tournament`, `competitor`, `registration`) and matching SPA feature folders,
behind a new `Tournaments` flag. Competitor identity is Microsoft Entra
External ID, accepted as a second token issuer beside the admin's. Payment is
Stripe hosted Checkout, confirmed only by signed webhook. Mail goes over SMTP.
The existing directory and its read-only mode are untouched. Decisions and
their reasons are in [research.md](research.md).

## Technical Context

**Language/Version**: Java 25 (API) · TypeScript / React 19 (SPA)

**Primary Dependencies**: Spring Boot 4.1, Spring Data MongoDB, Spring Security OAuth2 resource server (now two issuers), Vite, MSAL. **New**: `com.stripe:stripe-java`, `spring-boot-starter-mail`; a second MSAL configuration in the SPA for the external tenant.

**Storage**: MongoDB. New collections `Tournament`, `Competitor`, `TournamentRegistration`, `StripeEvent` ([data-model.md](data-model.md)). No change to existing collections. No transactions; atomic single-document guards.

**Testing**: JUnit + Testcontainers (API; Stripe and mail behind fakes, tokens from `spring-security-test`) · Vitest + MSW + Pact (SPA) · Playwright in `bjjeire-tests` with Stripe test mode and test competitor accounts

**Target Platform**: AKS (Flux) · local docker-compose (adds a mail catcher)

**Project Type**: Modular monolith (API + SPA in this repo; acceptance in `bjjeire-tests`)

**Performance Goals**: leaderboard and tournament pages in under 2 s with 500 competitors and 200 concurrent viewers (SC-009); result visible within 1 minute (SC-006)

**Constraints**: OpenAPI/Pact gates (all changes additive); path-filtered CI; light, dark and competition themes; GeoJSON `[lng, lat]`; no card data stored; private profile fields never in a public response; `VITE_APP_*` baked at build

**Scale/Scope**: a few tournaments a year, 50–100 divisions and about 500 competitors each; 27 API routes; 8 SPA routes; 41 requirement issues (`#5001`–`#5041`)

**External dependencies outside this repo**: external Entra tenant, its app registrations and sign-up flow (`bjjeire-terraform-azurerm-aks`, `main.app-registrations.tf`); Stripe account and keys, SMTP relay credentials, new environment values (`bjjeire-gitops` / `bjjeire-deploy`); requirement issues and epic (`bjjeire/requirements`); acceptance spec and tests (`bjjeire-tests`)

## Constitution Check

*GATE: Must pass before research. Re-check after design.*

- [x] Package-by-feature respected (ADR-0001) — three new flat feature packages; nothing added to shared packages except route constants, a cache tag, the flag, security wiring in `config`, and index declarations
- [x] Wire-shape change has OpenAPI/Pact/spec updates (ADR-0002) — additive only; new Pact file, generated types, database contracts and STC overlay are in scope
- [x] No new CI job left out of the aggregator (ADR-0003), except `atest_analyze` — no new job; existing path filters already cover the new paths, to be confirmed for `seeder/data-test/tournaments/`
- [x] All three themes still work and no ad-hoc UI strings (ADR-0011, ADR-0008) — strings in `ui-content.ts`, ids in `tournamentDataTestIds.ts`, semantic tokens only
- [x] No new cloud stack (`azd` / Cosmos / Container Apps) — same cluster and database; the new vendors are SaaS reached over HTTPS and SMTP

**Principle V (public reads, authenticated writes) — deviation, justified.** The
feature adds a second kind of authenticated writer and one signature-
authenticated public write. This is an amendment, not a violation to work
around: ADR-0012, ADR-0013 and constitution 1.1.0 are the first tasks
([research.md](research.md) R9). See Complexity Tracking.

**Post-design re-check (after Phase 1)**: unchanged. The design keeps the
catch-all "any write needs the admin authority" rule, so principle V's intent
(the public cannot change the directory) holds by construction. Gate passes
with the documented deviation.

## Project Structure

### Documentation (this feature)

```text
specs/001-tournament-registration/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── contract.yaml          # routes, auth, invariants, SPA routes
│   └── stripe-webhook.md      # Stripe calls and webhook handling
├── checklists/requirements.md
└── tasks.md                   # /speckit-tasks
```

Living documents to add or update as slices land:

```text
docs/adr/0012-competitor-identity-second-issuer.md
docs/adr/0013-stripe-hosted-checkout-and-webhooks.md
.specify/memory/constitution.md                     # 1.1.0
specs/features/tournaments.md
specs/database-contracts/{tournament,competitor,tournament-registration}.md
specs/stc/tournaments/{spec.md,contract.yaml,traceability.md}
specs/system-architecture.md                        # topology, API shape table
AGENTS.md, .specify/rules/*.md                      # feature package and collection lists
```

### Source Code

```text
src/bjjeire-api/src/main/java/com/bjjeire/api/
├── tournament/      # Tournament, Division, DivisionResult, admin + public controllers,
│                    # service, repository, mapper, leaderboard + points calculation
├── competitor/      # Competitor profile, eligibility rule, history, account deletion
├── registration/    # TournamentRegistration, sign-up/cancel/change services,
│                    # Stripe gateway + webhook controller, StripeEvent, mail sender, hold sweep
├── common/ApiRoutes.java, ApiCache.java            # TOURNAMENT, COMPETITOR, REGISTRATION; TOURNAMENTS_TAG
├── config/SecurityConfig.java                      # two issuers, competitor matchers
├── config/ReadOnlyModeFilter.java                  # skip the three new route prefixes
├── config/MongoIndexInitializer.java               # new indexes
├── config/BjjEireProperties.java                   # competitor issuer/scope, stripe, mail, flag
└── web/FeatureFlag*.java                           # Tournaments

src/bjjeire-app/src/
├── features/tournaments/      # public list, details, competitor list, leaderboard
├── features/competitor/       # external-tenant sign-in, profile, history
├── features/registrations/    # sign-up flow, my sign-ups, cancel, change division
├── features/tournament-admin/ # admin screens
├── pages/                     # Tournaments, Tournament, SignUp, SignUpComplete,
│                              # Profile, MySignUps, AdminTournaments, AdminTournament
├── lib/msal-config.ts, lib/api-client.ts   # second authority; token chosen per route
├── config/{ui-content,api-routes,features}.ts
└── constants/tournamentDataTestIds.ts

seeder/data-test/tournaments/   # test environments only; no production seed
docker-compose.yml              # mail catcher service

# other repos
bjjeire-tests/specs/features/tournaments.md
bjjeire-tests/tests/features/tournaments/
```

**Structure Decision**: Follow the existing feature slice. Three backend
packages rather than one because the aggregates have different owners and
access rules (admin-owned tournament, self-owned profile, self-owned sign-up
with money attached); each stays a flat package per ADR-0001. Stripe and mail
code live in `registration`, their only consumer, not in a shared package.

## Delivery slices

Each slice is one pull request, test-first, shippable behind the flag (off in
production until slice 5 is accepted). `/speckit-tasks` breaks these down.

| # | Slice | Stories | Requirement issues |
|---|---|---|---|
| 0 | Governance and plumbing: ADR-0012, ADR-0013, constitution 1.1.0, `Tournaments` flag, two-issuer security, read-only exemption | US6 | `#5036`–`#5038` |
| 1 | Tournament set-up and public pages; admin screens for create, divisions, publish | US1 | `#5001`–`#5005` |
| 2 | Competitor sign-in and private profile; account deletion | US2 | `#5006`–`#5012`, `#5039` (empty history) |
| 3 | Sign-up, eligibility, Stripe checkout and webhook, confirmation mail, public competitor list, my sign-ups | US3 | `#5013`–`#5021` |
| 4 | Cancel, refund, change division, tournament cancellation, admin sign-up tools | US4 | `#5022`–`#5027` |
| 5 | Results, leaderboard, both rankings, finish and winners, medal history | US5 | `#5028`–`#5035`, `#5039`–`#5041` |

Slice 0 depends on the external tenant existing in a non-production
environment. Slice 3 depends on Stripe test keys and a webhook endpoint
registration. Both are requested from the owner at the start, since neither
is created from this repository.

## Risks

| Risk | Mitigation |
|---|---|
| A payment succeeds but the sign-up is not confirmed | Webhook is the only confirmer; idempotent event ledger; 5xx on failure so Stripe retries; reconciliation check in the admin sign-up list (paid session with no confirmed sign-up) |
| Double charge or double sign-up | Partial unique index on active sign-ups; idempotency keys on session and refund creation |
| Overselling the last place | Conditional atomic increment of `placesTaken`; late payments are auto-refunded |
| Private profile data leaks into a public response | Separate public DTOs built from registration snapshots; an integration test asserts the public JSON contains none of the private field names |
| Competitor token used against the directory | Catch-all writer rule kept; integration test per directory route (`#5037`) |
| Graph permission for account deletion is refused | Fallback in research R11; decide before slice 2 starts |
| Vendor facts assumed here are wrong (Stripe session expiry floor, Entra issuer format) | Marked **Verify** in research; checked in the first task that uses each |
| Turning the feature on opens directory writes | Read-only mode and the flag are separate switches; integration test with read-only on and the flag on |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principle V: a second authenticated principal (competitor) with write access to its own data | The feature is sign-up by members of the public; it cannot exist with admin-only writes | Admin entering every sign-up by hand defeats the purpose and cannot take online payment |
| Principle V: one write route with no bearer token (Stripe webhook) | Stripe cannot present an Entra token; confirmation must not depend on the browser returning | Confirming on the browser's return loses sign-ups when the tab is closed and lets a forged return URL confirm an unpaid place |
| Read-only mode bypass for three route prefixes | Production runs with read-only mode on; tournaments need writes while the directory stays read-only | Turning read-only mode off would rely on auth alone for directory writes, a change the owner did not ask for |
| Three new feature packages instead of one | Different owners and access rules per aggregate | One `tournament` package would mix admin, self-service and payment code in a single flat package |
| Two new third-party integrations (Stripe, SMTP) and one new identity tenant | Online payment, transactional mail and public accounts are required by the spec | Each in-house alternative (card handling, a mail server, a password store) is larger and riskier than the integration |
