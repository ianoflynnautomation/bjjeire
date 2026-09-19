---
feature: events
ssot: specs/features/events.md
database: specs/database-contracts/bjj-event.md
api_package: com.bjjeire.api.event
spa: src/bjjeire-app/src/features/bjjevents
acceptance: bjjeire-tests/tests/features/events/
status: living
---

# STC: Events

## User intent

A visitor opens Events and sees upcoming, active events they can scan,
search, and filter. Search is client-side. County and type are server
filters. Writes require Entra JWT. The Events feature flag fails closed.

Narrative SSOT: [specs/features/events.md](../../features/events.md).

## Acceptance criteria

### AC-EVT-001 — List upcoming events (P1)

Given published upcoming events exist,
When a client calls `GET /api/v1/bjjevent`,
Then the response is `PagedResponse<BjjEventDto>` ordered by `createdAt`,
And inactive, expired, and completed events are excluded.

**Owns**: T2 `BjjEventMongoRepositoryIT`.

### AC-EVT-002 — County and type filters (P1)

Given events in several counties and types,
When `county` and/or `types` are supplied,
Then only matching events are returned (an event matches if any of its types
overlaps the requested set).
When `types` is unknown,
Then the API returns 400.

**Owns**: T2 `BjjEventMongoRepositoryIT` + T4 `events-page.integration.test.tsx` (UI once).

### AC-EVT-003 — Client-side name search (P1)

Given a loaded events page,
When the visitor types an event name (full or partial),
Then only matching cards remain.
Search is not a server query.

**Owns**: T4 `events-page.integration.test.tsx`.

### AC-EVT-004 — Event card (P2)

Given an event card,
When a visitor views it,
Then map and info links are composed from the DTO.
Map query uses **latitude, longitude** derived from GeoJSON `[lng, lat]`.

**Owns**: T3 `event-card.unit.test.tsx` + `map-utils.unit.test.ts`.

### AC-EVT-005 — Empty, error, pagination (P2)

Given no matching event / empty API / 500,
When the visitor is on Events,
Then the matching empty or error (retry) state is shown.
Given more than one page,
When the client pages,
Then each page is a distinct slice with absolute navigation links.

**Owns**: T4 page integration; T2 IT for pagination JSON.

### AC-EVT-006 — Writes authenticated (P1)

Given no Bearer token (or a reader token),
When POST/PUT/DELETE `/api/v1/bjjevent`,
Then the write is rejected.
Given the Events flag is off,
When a visitor opens `/events`,
Then they are redirected away from the feature.

**Owns**: T2 `WriteAuthorizationIT` (method-wide) + event write ITs; T4 `AppRoutes`.

## Executable contract

See [contract.yaml](contract.yaml).

## Traceability

See [traceability.md](traceability.md).
