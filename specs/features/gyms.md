# Feature: Gyms

**Status**: Living (brownfield)
**Database**: [../database-contracts/gym.md](../database-contracts/gym.md)
**API package**: `com.bjjeire.api.gym`
**SPA**: `src/bjjeire-app/src/features/gyms`, route `/gyms`
**Acceptance**: `bjjeire-tests/tests/features/gyms/`

## User Story 1 — Browse the gym directory (P1)

A visitor opens Gyms and sees published gyms they can scan, search, and filter.

**Independent Test**: UI smoke + API listing against seeded data.

**Acceptance Scenarios** (titles owned by `bjjeire-tests`):

1. Given available gyms, when a visitor opens Gyms, then the gym list is displayed
2. Given gyms are published, when a client opens the directory, then each published gym is returned with its details
3. Given gyms are published, when a client opens the directory, then they are ordered by name

## User Story 2 — Find a gym by name or county (P1)

Search is client-side on the loaded page. County is a server filter.

1. Given a gym name, when a visitor searches, then only that gym is displayed
2. Given part of a gym name, when a visitor searches, then the matching gym is displayed
3. Given gyms in several counties, when a visitor filters by county, then only gyms from that county are displayed
4. Given a county filter is applied, when the visitor resets it to all counties, then gyms from other counties can be found again
5. Given gyms are published, when a client filters by county, then only gyms from that county are returned
6. Given an unknown county, when a client filters by it, then the request is rejected as a bad request

## User Story 3 — Act on a gym card (P2)

1. Given a gym card, when a visitor views it, then its website and map links point to the right destinations

Map URL uses **latitude, longitude** in the Google query string (derived from GeoJSON `[lng, lat]`).

## User Story 4 — Empty, error, and pagination (P2)

1. Given no matching gym, when a visitor searches, then an empty state is displayed
2. Given the API returns no gyms, when a visitor opens Gyms, then the no-data message is shown
3. Given the API request fails / server error, when a visitor opens Gyms, then the matching error message is shown
4. Given the API failed once, when the visitor retries, then the gym list is displayed
5. Given the directory spans more than one page, when a client pages through it, then each page is a distinct slice with correct links
6. Given a page beyond the last, when a client requests it, then an empty page with valid pagination is returned

## Requirements

- **FR-001**: Public `GET /api/v1/gym` returns `PagedResponse<GymDto>`
- **FR-002**: Optional `county` query filter; invalid county → 400
- **FR-003**: Default order is name
- **FR-004**: Writes require Entra JWT
- **FR-005**: Status values are `GymStatus` PascalCase on the wire
- **FR-006**: Feature flag fail-closed: gyms route redirects to `/about` if the flag is off

## Success criteria

- **SC-001**: A visitor can isolate a seeded gym with search and see exactly one card
- **SC-002**: County filter hides gyms from other counties
- **SC-003**: Website and Maps links on a seeded card match the DTO
