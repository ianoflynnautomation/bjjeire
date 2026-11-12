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

**Requirements**: `bjjeire/requirements` · epic `&2`

## User intent

A visitor opens Events and sees upcoming, active events they can scan,
search, and filter. Search is client-side. County and type are server
filters. Writes require Entra JWT. The Events feature flag fails closed.
A visitor can also switch to a map showing the same search, county and type
results. With `BjjEvents` on, `EventsMap` off or missing leaves the list.

Narrative SSOT: [specs/features/events.md](../../features/events.md).

## Acceptance criteria

### `#2001` — List upcoming events (P1)

Given published upcoming events exist,
When a client calls `GET /api/v1/bjjevent`,
Then the response is `PagedResponse<BjjEventDto>` ordered by `createdAt`,
And inactive, expired, and completed events are excluded.

**Owns**: T2 `BjjEventMongoRepositoryIT`.

### `#2002` — County and type filters (P1)

Given events in several counties and types,
When `county` and/or `types` are supplied,
Then only matching events are returned (an event matches if any of its types
overlaps the requested set).
When `types` is unknown,
Then the API returns 400.

**Owns**: T2 `BjjEventMongoRepositoryIT` + T4 `events-page.integration.test.tsx` (UI once).

### `#2003` — Client-side name search (P1)

Given a loaded events page,
When the visitor types an event name (full or partial),
Then only matching cards remain.
Search is not a server query.

**Owns**: T4 `events-page.integration.test.tsx`.

### `#2004` — Event card (P2)

Given an event card,
When a visitor views it,
Then map and info links are composed from the DTO.
Map query uses **latitude, longitude** derived from GeoJSON `[lng, lat]`.

**Owns**: T3 `event-card.unit.test.tsx` + `map-utils.unit.test.ts`.

### `#2005` — Empty, error, pagination (P2)

Given no matching event / empty API / 500,
When the visitor is on Events,
Then the matching empty or error (retry) state is shown.
Given more than one page,
When the client pages,
Then each page is a distinct slice with absolute navigation links.

**Owns**: T4 page integration; T2 IT for pagination JSON.

### `#2006` — Writes authenticated (P1)

Given no Bearer token (or a reader token),
When POST/PUT/DELETE `/api/v1/bjjevent`,
Then the write is rejected.
Given the Events flag is off,
When a visitor opens `/events`,
Then they are redirected away from the feature.

**Owns**: T2 `WriteAuthorizationIT` (method-wide) + event write ITs; T4 `AppRoutes`.

### `#2007` — Switch between list and map (P1)

Given `EventsMap` is on,
When a visitor opens Events with no `view` value or an unknown one,
Then the list is shown.
When they switch to the map,
Then the URL has `view=map`, the search, county and types are unchanged, and the page is dropped.
When they reload, share the link, or go Back,
Then the matching view and filters are shown.

**Owns**: T3 URL state; T4 page integration; T6 one shared-link journey.

### `#2008` — Filters apply to the map, without paging (P1)

Given events in several counties and types, and more events than one list page,
When a visitor is on the map,
Then every event matching the search, county and types has a pin, with no paging controls,
And the header count matches the number of matching events.
Given more matching events than the API's maximum page size,
Then a notice says not all events are shown and suggests filtering.

**Owns**: T4 page integration with MSW; T6 county and type on seeded data.
**Does not own**: a new API parameter. County and types remain the server filters from `#2002`, and search stays client-side per `#2003`.

### `#2009` — Pins are in the right place (P1)

Given an event with GeoJSON coordinates `[lng, lat]`,
When its pin is placed,
Then the pin's latitude and longitude match the event's, not swapped.
Given an event without usable coordinates,
Then it has no pin, it stays in the list, and a notice says how many events are not shown.

**Owns**: T3 coordinate conversion; T5 rendered pins; T6 one seeded event.

### `#2010` — Events at one venue share a pin (P1)

Given two or more events whose coordinates are identical at five decimal places,
When the map shows them,
Then they share one pin, which is one tab stop,
And its accessible name is the earliest event's venue, followed by the number of events.
When a visitor opens it,
Then the venue and address are shown once and each event is listed, earliest start first,
And an event whose venue or address text differs from the pin's shows its own.
Given events whose coordinates differ beyond that,
Then each location has its own pin.

**Owns**: T3 grouping and order; T5 opening a shared pin; T6 two seeded events at one venue.

### `#2011` — Pin popup (P2)

Given an event's pin,
When a visitor opens it,
Then the event's name, types and dates are shown, with dates as they fall in Ireland and summarised as on the event card,
And the venue and address are shown,
And the event and directions links match the event card from `#2004` and open in a new tab.
Given no event link, that link is left out.
Given event text containing HTML,
Then it is displayed as text and does not run.

**Owns**: T3 popup content, including the HTML and missing-link cases; T5 opening a pin; T6 one seeded event.

### `#2012` — The map follows the results (P2)

Given results change through search, county or types,
Then the map moves to fit them.
Given one location,
Then it zooms there without using maximum zoom.
Given no filters,
Then all of Ireland is shown.

**Owns**: T3 bounds; T5 in-repo browser, including the page's filters reaching the map.

### `#2013` — Loading, empty and error states (P2)

Given the map view is open,
When events are loading, the API returns none, the search matches nothing, or the request fails,
Then the same state as the list is shown, including retry after a failure.
Given the map code cannot load,
Then an error with retry replaces the map, and the filters and view switch stay.

**Owns**: T4 page integration.

### `#2014` — Tiles and attribution (P2)

Given the map is showing,
Then the OpenStreetMap attribution is visible.
Given tiles fail to load, fully or partly,
Then a notice links to the list, the pins remain, the view does not change, and the notice does not flicker.

**Owns**: T5 in-repo browser with tile requests blocked; T6 one journey with tiles aborted.
**Does not own**: live OpenStreetMap. Tests do not depend on it or compare tile images.

### `#2015` — Map flag fails safe to the list (P1)

Given `BjjEvents` is on and `EventsMap` is off or missing from the flag response,
When a visitor opens `/events` or `/events?view=map`,
Then the list is shown on `/events`, the view switch is hidden, and there is no redirect.
Given `BjjEvents` is off,
Then `#2006` still applies.
Given the flag fetch fails,
Then every flag is off, so `#2006` applies.
Given `EventsMap` and `GymsMap` are set independently,
Then each changes only its own page.
Given a client calls `GET /api/v1/featureflag`,
Then `EventsMap` is present as a boolean and is false unless the environment enables it.

**Owns**: T1 flag configuration; T0 Pact for the flag key; T4 page integration and routing.

### `#2016` — Themes, keyboard and phone width (P2)

Given each of the light, dark and competition themes,
When the map is open,
Then pins, popups, the view switch and controls meet WCAG 2.1 AA while tiles stay light,
And focus indicators are visible on screen over tiles and over the map background.
Given keyboard use,
Then the view switch, pins and popup links work, Space and Enter open a pin, Escape closes a popup, and the current view is announced.
Given phone width,
Then the map fits with no horizontal page scroll and the visitor can scroll past it.

**Owns**: T5 for keyboard, layout, focus indicators and pin contrast on tiles, measured in pixels; T6 axe in each theme.

### `#2017` — List visitors pay nothing for the map (P2)

Given a visitor stays on the event list,
Then no tile requests are made and no map code is downloaded.

**Owns**: T5 by observing requests; T6 against a built image.

## Executable contract

See [contract.yaml](contract.yaml).

## Traceability

See [traceability.md](traceability.md).
