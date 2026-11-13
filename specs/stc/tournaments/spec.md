---
feature: tournaments
ssot: specs/features/tournaments.md
database: specs/001-tournament-registration/data-model.md
api_package: com.bjjeire.api.tournament, com.bjjeire.api.competitor, com.bjjeire.api.registration
spa: src/bjjeire-app/src/features/tournaments
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

### `#5001`–`#5035`, `#5039`–`#5042` — not built

Defined in the Spec Kit spec. Each moves here with the slice that builds it.

## Executable contract

See [contract.yaml](contract.yaml).

## Traceability

See [traceability.md](traceability.md).
