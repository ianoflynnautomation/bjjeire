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

Search matches gym name and county only, client-side over up to 100 gyms fetched for the search. County is a server filter.

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

## User Story 5 — Find a gym on a map (P2)

A visitor can switch the Gyms page between the list and a map of Ireland, to see which gyms are near a place they know. The existing search and county filter work the same in both views.

**Independent Test**: Open `/gyms?view=map` against seeded data, filter by county, and open a seeded gym's pin.

**Acceptance Scenarios** (titles owned by `bjjeire-tests`):

1. Given a visitor is on the gym list, when they switch to the map, then pins for the current results are displayed
2. Given a visitor is on the map, when they switch to the list, then the same search and county filter still apply
3. Given a link to the map view, when a visitor opens it, then the map is displayed with the filters from the link
4. Given gyms in several counties, when a visitor filters the map by county, then only that county's gyms have pins and the map moves to them
5. Given a gym name, when a visitor searches on the map, then only that gym has a pin and the map zooms to it
6. Given a seeded gym, when a visitor opens its pin, then its name, county, address, and website and directions links are shown
7. Given no matching gym, when a visitor searches on the map, then the same empty state as the list is displayed
8. Given the API request fails, when a visitor opens the map, then the same error message and retry as the list are displayed
9. Given map tiles fail to load, when a visitor is on the map, then a notice with a link to the list is shown and the pins stay available
10. Given the map feature is off, when a visitor opens a link to the map view, then the gym list is displayed
11. Given a visitor switched to the map, when they go back, then the gym list is displayed
12. Given the map is open in each theme, when it is audited, then no accessibility violations are found
13. Given a visitor stays on the list, when the page has loaded, then no map code or tiles are requested

### Design

- **Data**: the map reuses `GET /api/v1/gym` with the existing maximum page size and county filter, the same way search does today. No gym endpoint or document changes. The list stays paged.
- **Map**: an open-source web map library, with OpenStreetMap public tiles and visible attribution. No API key and no paid service.
- **Loading**: map code and tiles load only when the map is opened. Visitors who stay on the list download neither.
- **Rollout**: a new `GymsMap` flag on `GET /api/v1/featureflag`, off unless an environment turns it on. This adds a key and removes nothing.

### Out of scope

- The visitor's own location, "near me", and sorting by distance
- Remembering the chosen view between visits
- Dark map tiles, a paid or keyed tile provider, and offline maps
- Grouping nearby pins into clusters. No two seeded gyms share a location. Add clusters later if the map becomes hard to read
- Maps for events, competitions or stores
- A server-side search or map-bounds query

## Requirements

- **FR-001**: Public `GET /api/v1/gym` returns `PagedResponse<GymDto>`
- **FR-002**: Optional `county` query filter; invalid county → 400
- **FR-003**: Default order is name
- **FR-004**: Writes require Entra JWT
- **FR-005**: Status values are `GymStatus` PascalCase on the wire
- **FR-006**: Feature flag fail-closed: gyms route redirects to `/about` if the flag is off
- **FR-007**: Page and county are URL state (`?page=`, `?county=`): they survive reload, can be shared, and Back steps through them. Typing a search replaces the history entry instead of adding one. Changing the search or a filter returns to page 1
- **FR-008**: The view is URL state. `?view=map` opens the map, and no value or an unknown value opens the list. It survives reload, can be shared, and Back steps through view changes. Switching view keeps the search and county
- **FR-009**: The map shows every gym matching the current search and county, with no paging controls, up to the API's maximum page size (100). If more gyms match than that, a notice says so and suggests filtering
- **FR-010**: Each pin sits at the gym's real location, reading GeoJSON `[lng, lat]` correctly. A gym without usable coordinates gets no pin, stays in the list, and a notice says how many gyms are not shown
- **FR-011**: A pin's popup shows the gym's name, county and address, with website and directions links that match the gym card. A missing website leaves out that link. Gym data is displayed as plain text, never as HTML
- **FR-012**: When results change, the map moves to fit them. One result zooms to that gym at street-level context, not maximum zoom. No filters shows all of Ireland
- **FR-013**: The map uses the list's loading, no-data, empty-search, error and retry states. If the map code cannot load, an error with retry replaces the map, and the filters and view switch stay
- **FR-014**: If tiles fail, the map shows a notice linking to the list and keeps the pins. A brief failure does not change the view
- **FR-015**: With `Gyms` on, `GymsMap` off or missing from the flag response hides the view switch and treats `?view=map` as the list, on `/gyms` with no redirect. It never affects the list. `Gyms` off keeps redirecting to `/about` (FR-006). A failed flag fetch turns every flag off, so it redirects to `/about` too
- **FR-016**: Pins, popups, the view switch and map controls follow the light, dark and competition themes and meet WCAG 2.1 AA. Tiles stay light in every theme
- **FR-017**: The view switch and popup links work by keyboard, and the switch announces the current view. The list is the full non-visual alternative
- **FR-018**: At phone width the map fits the screen with no horizontal page scroll, and a visitor can still scroll past it

## Success criteria

- **SC-001**: A visitor can isolate a seeded gym with search and see exactly one card
- **SC-002**: County filter hides gyms from other counties
- **SC-003**: Website and Maps links on a seeded card match the DTO
- **SC-004**: A visitor can filter the map to one county and open a seeded gym's pin, which is in the right place
- **SC-005**: A shared `?view=map` link with a county opens the same view for another visitor
- **SC-006**: With `GymsMap` off, the Gyms page behaves exactly as it did before this feature
- **SC-007**: A visitor who never opens the map makes no tile requests and downloads no map code
