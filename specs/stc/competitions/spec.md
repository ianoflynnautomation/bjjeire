---
feature: competitions
ssot: specs/features/competitions.md
database: specs/database-contracts/competition.md
api_package: com.bjjeire.api.competition
spa: src/bjjeire-app/src/features/competitions
acceptance: bjjeire-tests/tests/features/competitions/
status: living
---

# STC: Competitions

## User intent

A visitor opens Competitions and sees published, unfinished competitions
they can scan and search. Search is client-side. There is no county on this
aggregate. The Competitions feature flag fails closed.

The living feature spec still says “authenticated writes”. The **controller
is GET-only** today. This overlay describes the served surface.

Narrative SSOT: [specs/features/competitions.md](../../features/competitions.md).

## Acceptance criteria

### AC-CMP-001 — List published competitions (P1)

Given published competitions exist,
When a client calls `GET /api/v1/competition`,
Then the response is `PagedResponse<CompetitionDto>` ordered by start date
then name,
And expired and inactive competitions are excluded.

**Owns**: T2 `CompetitionMongoRepositoryIT`.

### AC-CMP-002 — Include inactive (admin-style query)

Given expired or inactive competitions exist,
When `includeInactive=true`,
Then they are included in the listing.
When `includeInactive` is not a boolean,
Then the API returns 400.

**Owns**: T2 IT for the query; T1 `CompetitionControllerTest` for the 400.

### AC-CMP-003 — Client-side name search (P1)

Given a loaded competitions page,
When the visitor types a name,
Then only matching cards remain.

**Owns**: T4 `competitions-page.integration.test.tsx`.

### AC-CMP-004 — Empty, error, pagination (P2)

Given no competitions / 500,
When the visitor is on Competitions,
Then the matching empty or error state is shown.

**Owns**: T4 page integration.

### AC-CMP-005 — Unique slug and expiry (P1)

`slug` is unique (critical index). `expiresAt` is `endDate + 2y`.

**Owns**: T2 `DeactivationInfrastructureIT` (unique index); T1 `CompetitionExpiryTest`.

## Executable contract

See [contract.yaml](contract.yaml).

## Traceability

See [traceability.md](traceability.md).
