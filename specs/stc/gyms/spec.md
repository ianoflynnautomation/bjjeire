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
A visitor can also switch to a map showing the same search and county results.
With `Gyms` on, `GymsMap` off or missing leaves the list.

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

### AC-GYM-007 — Switch between list and map (P1)

Given `GymsMap` is on,
When a visitor opens Gyms with no `view` value or an unknown one,
Then the list is shown.
When they switch to the map,
Then the URL has `view=map` and the search and county are unchanged.
When they reload, share the link, or go Back,
Then the matching view and filters are shown.

**Owns**: T4 page integration; T6 for one shared-link journey.

### AC-GYM-008 — Filters apply to the map, without paging (P1)

Given gyms in several counties and more gyms than one list page,
When a visitor is on the map,
Then every gym matching the search and county has a pin, with no paging controls,
And the header count matches the number of matching gyms.
Given more matching gyms than the API's maximum page size,
Then a notice says not all gyms are shown and suggests filtering.

**Owns**: T4 page integration with MSW.
**Does not own**: a new API parameter. County remains the server filter from AC-GYM-002, and search stays client-side per AC-GYM-003.

### AC-GYM-009 — Pins are in the right place (P1)

Given a gym with GeoJSON coordinates `[lng, lat]`,
When its pin is placed,
Then the pin's latitude and longitude match the gym's, not swapped.
Given a gym without usable coordinates,
Then it has no pin, it stays in the list, and a notice says how many gyms are not shown.

**Owns**: T3 for the coordinate conversion; T5 for a rendered pin; T6 for one seeded gym.

### AC-GYM-010 — Pin popup (P2)

Given a gym's pin,
When a visitor opens it,
Then the name, county and address are shown,
And the website and directions links match the gym card from AC-GYM-004.
Given no website, that link is left out.
Given a gym name containing HTML,
Then it is displayed as text and does not run.

**Owns**: T3 popup content, including the HTML case; T5 opening a pin; T6 one seeded gym.

### AC-GYM-011 — The map follows the results (P2)

Given results change through search or county,
Then the map moves to fit them.
Given one result,
Then it zooms to that gym without using maximum zoom.
Given no filters,
Then all of Ireland is shown.

**Owns**: T5 in-repo browser.

### AC-GYM-012 — Loading, empty and error states (P2)

Given the map view is open,
When gyms are loading, the API returns none, the search matches nothing, or the request fails,
Then the same state as the list is shown, including retry after a failure.
Given the map code cannot load,
Then an error with retry replaces the map, and the filters and view switch stay.

**Owns**: T4 page integration.

### AC-GYM-013 — Tiles and attribution (P2)

Given the map is showing,
Then the OpenStreetMap attribution is visible.
Given tiles fail to load,
Then a notice links to the list, the pins remain, and the view does not change.

**Owns**: T5 in-repo browser with tile requests blocked.
**Does not own**: live OpenStreetMap. Tests do not depend on it or compare tile images.

### AC-GYM-014 — Map flag fails safe to the list (P1)

Given `Gyms` is on and `GymsMap` is off or missing from the flag response,
When a visitor opens `/gyms` or `/gyms?view=map`,
Then the list is shown on `/gyms`, the view switch is hidden, and there is no redirect to `/about`.
Given `Gyms` is off,
Then AC-GYM-006 still applies.
Given the flag fetch fails,
Then every flag is off, so AC-GYM-006 applies and the visitor is redirected to `/about`.
Given a client calls `GET /api/v1/featureflag`,
Then `GymsMap` is present as a boolean and is false unless the environment enables it.

**Owns**: T1 flag configuration; T0 Pact for the flag key; T4 page integration.

### AC-GYM-015 — Themes, keyboard and phone width (P2)

Given each of the light, dark and competition themes,
When the map is open,
Then pins, popups, the view switch and controls meet WCAG 2.1 AA while tiles stay light.
Given keyboard use,
Then the view switch and popup links work and the current view is announced.
Given phone width,
Then the map fits with no horizontal page scroll and the visitor can scroll past it.

**Owns**: T5 for keyboard, layout, focus indicators and pin contrast on tiles; T6 axe in each theme.

### AC-GYM-016 — List visitors pay nothing for the map (P2)

Given a visitor stays on the list,
Then no tile requests are made and no map code is downloaded.

**Owns**: T5 or T6, by observing network requests.

## Executable contract

See [contract.yaml](contract.yaml).

## Traceability

See [traceability.md](traceability.md).
