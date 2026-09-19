---
feature: gyms
ssot: specs/features/gyms.md
database: specs/database-contracts/gym.md
api_package: com.bjjeire.api.gym
spa: src/bjjeire-app/src/features/gyms
acceptance: bjjeire-tests/tests/features/gyms/
status: living
---

# STC: Gyms

## User intent

A visitor opens Gyms and sees published gyms they can scan, search, and
filter. Search is client-side on the loaded page. County is a server filter.
Writes require Entra JWT. The Gyms feature flag fails closed to `/about`.

Narrative SSOT: [specs/features/gyms.md](../../features/gyms.md).

## Acceptance criteria

### AC-GYM-001 — List published gyms (P1)

Given published gyms exist,
When a client calls `GET /api/v1/gym`,
Then the response is `PagedResponse<GymDto>` ordered by name,
And only Active gyms are listed.

**Owns**: T2 `GymMongoRepositoryIT`.
**Does not own**: Playwright filter matrix.

### AC-GYM-002 — County filter (P1)

Given gyms in several counties,
When `county=Dublin` is supplied,
Then only Dublin gyms are returned.
When `county` is unknown,
Then the API returns 400 ProblemDetail.

**Owns**: T1 `GymControllerTest` (unknown county → 400) + T2 `GymMongoRepositoryIT` (query) + T4 `gyms-page.integration.test.tsx` (combobox → query string, once).

### AC-GYM-003 — Client-side name search (P1)

Given a loaded gyms page,
When the visitor types a gym name (full or partial),
Then only matching cards remain.
Search is not a server query.

**Owns**: T4 `gyms-page.integration.test.tsx`.
**Does not own**: a `?name=` API parameter.

### AC-GYM-004 — Gym card actions (P2)

Given a gym card,
When a visitor views it,
Then website and map links point at the DTO website and a Google Maps query
that uses **latitude, longitude** derived from GeoJSON `[lng, lat]`.

**Owns**: T3 `gym-card.unit.test.tsx` (and map-utils unit tests).
**Does not own**: live Google.

### AC-GYM-005 — Empty, error, pagination (P2)

Given no matching gym / empty API page / 500,
When the visitor is on Gyms,
Then the matching empty or error (retry) state is shown.
Given more than one page,
When the client pages,
Then each page is a distinct slice; a page past the last is empty with valid
pagination (null `nextPageUrl`).

**Owns**: T4 page integration for UI states; T2 IT for pagination JSON.

### AC-GYM-006 — Writes authenticated, flag fail-closed (P1)

Given no Bearer token (or a reader token),
When POST/PUT/DELETE `/api/v1/gym`,
Then the write is rejected.
Given the Gyms flag is off,
When a visitor opens `/gyms`,
Then they are redirected to `/about`.

**Owns**: T2 `WriteAuthorizationIT` / gym write ITs; T4 feature-flag tests.

## Executable contract

See [contract.yaml](contract.yaml).

## Traceability

See [traceability.md](traceability.md).
