---
feature: tournaments
ssot: specs/features/tournaments.md
database: specs/database-contracts/tournament.md (later collections: specs/001-tournament-registration/data-model.md)
api_package: com.bjjeire.api.tournament, com.bjjeire.api.competitor, com.bjjeire.api.registration
spa: src/bjjeire-app/src/features/tournaments, src/bjjeire-app/src/features/tournament-admin
acceptance: bjjeire-tests/tests/features/tournaments/
status: draft
---

# STC: Tournaments

**Requirements**: `bjjeire/requirements` · epic `&11`

## User intent

The admin runs an in-house tournament; members of the public sign in through a
separate competitor tenant, sign up for a division and pay; results feed a
public leaderboard. The `Tournaments` flag fails closed and gates the whole
feature. The directory stays public to read and admin-only to write.

Narrative SSOT for what is live: [specs/features/tournaments.md](../../features/tournaments.md).
Until the feature is complete, criteria that are not built are defined in
[specs/001-tournament-registration/spec.md](../../001-tournament-registration/spec.md).

## Acceptance criteria

### `#5036` — Directory stays readable without an account (P1)

Given a visitor who is not signed in,
When they read gyms, events, competitions and stores, with the tournament flag on or off,
Then every list is served and nothing asks for a token.

**Owns**: T2 `WriteAuthorizationIT` (flag on), `TournamentFeatureOffIT` (flag off); T1 `TournamentFeatureGateFilterTest`; T6 existing directory suites.

### `#5037` — A competitor cannot change the directory (P1)

Given a signed-in competitor, including one whose token names the writer scope,
When they POST, PUT or DELETE a gym, event, competition or store,
Then the API answers 403.

**Owns**: T2 `WriteAuthorizationIT`; T1 `IssuerAwareAuthoritiesConverterTest`.

### `#5038` — The feature switches off as a whole (P1)

Given the `Tournaments` flag is off,
When any tournament, competitor or registration route is called,
Then the API answers 404 before authentication,
And the SPA shows no tournament or account entry point,
And directory routes are unaffected.

**Owns**: T2 `TournamentFeatureOffIT`; T1 `TournamentFeatureGateFilterTest`, `FeatureFlagDefaultsTest`; T3 `use-nav-items.unit.test.tsx`; T4 `feature-flag-resolve.integration.test.ts`.

### `#5001` — A new tournament is a draft the public cannot see (P1)

Given the organiser is signed in,
When they save a tournament with name, date, venue, fee, registration window and at least one division,
Then it is stored with status `DRAFT`,
And it is absent from the public list and its slug answers 404 to everyone but the admin routes.

**Owns**: T2 `TournamentAdminIT`, `TournamentMongoRepositoryIT`; T1 `TournamentControllerTest`; T4 `admin-tournaments-page.integration.test.tsx`.

### `#5002` — A published tournament is open to everyone (P1)

Given a draft tournament,
When the organiser publishes it,
Then a visitor who is not signed in can open `/tournaments/{slug}` and see its details, fee, registration window (Irish time) and divisions,
And it appears in the public list ordered by tournament day.

**Owns**: T2 `TournamentAdminIT`, `TournamentMongoRepositoryIT`, `OpenApiContractIT`; T0 `tournament.pact.test.ts`; T4 `tournaments-page`, `tournament-page`, `admin-tournament-page` integration tests; T6 planned.

### `#5003` — The page states the registration window and offers no sign-up outside it (P1)

Given a published tournament whose registration has not opened or has closed,
When a visitor opens its page,
Then the page says when registration opens, or that it is closed,
And no sign-up control is shown.

`registrationState` is computed by the API on every read (`NOT_OPEN`, `OPEN`, `CLOSED`, `FULL`; closed wins over full). This slice offers no sign-up control in any state: sign-up is built in slice 3.

**Owns**: T1 `TournamentRulesTest`; T2 `TournamentAdminIT`; T3 `tournament-format.unit.test.ts`; T4 `tournament-page.integration.test.tsx`; T6 planned.

### `#5004` — Only the organiser can create, edit or publish (P1)

Given a person who is not the organiser (anonymous, a competitor, or a workforce account without the writer scope),
When they create, edit, publish, or open a draft through the admin routes,
Then the API answers 401 or 403 and nothing changes.

**Owns**: T2 `TournamentAdminIT`, `TournamentRouteAuthorizationIT`; T4 `admin-tournaments-page.integration.test.tsx` (screens ask for the organiser sign-in).

### `#5005` — A division with sign-ups cannot be removed (P1)

Given a division that has an active sign-up,
When the organiser saves the tournament without it,
Then the API answers 409 `urn:bjjeire:division-has-signups` telling them to move or cancel those sign-ups first,
And the division stays.

**Owns**: T2 `TournamentAdminIT`; T4 `admin-tournament-page.integration.test.tsx`.

### `#5006`–`#5035`, `#5039`–`#5042` — not built

Defined in the Spec Kit spec. Each moves here with the slice that builds it.

## Executable contract

See [contract.yaml](contract.yaml).

## Traceability

See [traceability.md](traceability.md).
