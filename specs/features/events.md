# Feature: Events

**Status**: Living (brownfield)
**Database**: [../database-contracts/bjj-event.md](../database-contracts/bjj-event.md)
**API**: `/api/v1/bjjevent`
**SPA route**: `/events`
**Acceptance**: `bjjeire-tests/tests/features/events/`

## User Story 1 — Browse upcoming events (P1)

1. Given available events, when a visitor opens Events, then the event list is displayed
2. Given events are published, when a client opens the listing, then each upcoming event is returned with its details
3. Given an event has finished, when a client opens the listing, then it is not shown
4. Given several events are published, when a client opens the listing, then they are ordered by creation date

## User Story 2 — Search and filter (P1)

1. Given an event name / part of a name, when a visitor searches, then only that event is displayed
2. Given an active search, when the visitor clears it, then events from the full listing are displayed again
3. Given a visitor searches, when results narrow, then the header count reflects the matching events
4. Given events in several counties, when a visitor filters by county, then only events from that county are displayed
5. Given events of several types, when a visitor filters by type, then only events of that type are displayed
6. Given an event has several types, when a client filters by any one of them, then the event is returned

Search is client-side; county and type are server filters.

## User Story 3 — Empty and error (P2)

Same empty / network / server-error pattern as gyms.

Dates are shown as they fall in Ireland (`Europe/Dublin`), wherever the visitor is.

## User Story 4 — Find events on a map (P2)

A visitor can switch the Events page between the list and a map of Ireland, to see which upcoming events are near a place they know. The existing search, county and type filters work the same in both views. It follows the gym map ([gyms.md](gyms.md), User Story 5), so the two maps behave alike.

**Independent Test**: Open `/events?view=map` against seeded data, filter by county or type, and open a seeded event's pin.

**Acceptance Scenarios** (titles owned by `bjjeire-tests`):

1. Given a visitor is on the event list, when they switch to the map, then pins for the current results are displayed
2. Given a visitor is on the map, when they switch to the list, then the same search, county and type filters still apply
3. Given a link to the map view, when a visitor opens it, then the map is displayed with the filters from the link
4. Given events in several counties, when a visitor filters the map by county, then only that county's events have pins and the map moves to them
5. Given events of several types, when a visitor filters the map by type, then only events of that type have pins
6. Given an event name, when a visitor searches on the map, then only that event has a pin and the map zooms to it
7. Given a seeded event, when a visitor opens its pin, then its name, types, dates, venue and address, and its event and directions links are shown
8. Given several events at the same venue, when a visitor opens that venue's pin, then each of those events is listed
9. Given no matching event, when a visitor searches on the map, then the same empty state as the list is displayed
10. Given the API request fails, when a visitor opens the map, then the same error message and retry as the list are displayed
11. Given map tiles fail to load, when a visitor is on the map, then a notice with a link to the list is shown and the pins stay available
12. Given the events map feature is off, when a visitor opens a link to the map view, then the event list is displayed
13. Given a visitor switched to the map, when they go back, then the event list is displayed
14. Given the map is open in each theme, when it is audited, then no accessibility violations are found
15. Given a visitor stays on the list, when the page has loaded, then no map code or tiles are requested

### Design

- **Data**: the map reuses `GET /api/v1/bjjevent` with the existing maximum page size and the county and type filters, the same way search does today. It shows exactly the events the list would show, so finished events stay off it. No event endpoint or document changes. The list stays paged.
- **Map**: a separate events map, not a component shared with the gym map. It has the same tiles, attribution, loading behaviour, visual style and accessibility as the gym map, so visitors meet one pattern. Keeping them separate lets each map change without risk to the other. All event pins look the same; the type is in the popup.
- **Shared venues**: events at the same location share one pin. The same location means identical coordinates once rounded to five decimal places, about one metre. The pin is named after the venue of the earliest event there, with the number of events when there is more than one. Its popup shows that venue and address once, then lists each event, earliest start first. An event whose own venue or address text differs shows it in its entry, so nothing is hidden.
- **Rollout**: a new `EventsMap` flag on `GET /api/v1/featureflag`, off unless an environment turns it on. It is independent of `GymsMap`: each map is enabled and rolled back on its own. This adds a key and removes nothing.

### Out of scope

- A combined map of gyms and events
- Different pin styles by event type, and a legend
- Clustering nearby pins that are at different locations
- Price and organiser details in the popup; the event card still shows them
- A date filter or date range on the map; the map shows what the list shows
- The visitor's own location, "near me", sorting by distance, and remembering the chosen view
- Maps for competitions or stores
- A server-side search or map-bounds query

## Requirements

- **FR-001**: Listing returns upcoming/active events only
- **FR-002**: `expiresAt` TTL eventually removes documents after `endDate + 2y`
- **FR-003**: Public reads, authenticated writes
- **FR-004**: Organiser field uses British spelling `organiser` on the wire
- **FR-005**: A write accepts at most 64 sessions and 16 pricing options
- **FR-006**: The view is URL state. `?view=map` opens the map, and no value or an unknown value opens the list. It survives reload, can be shared, and Back steps through view changes. Switching view keeps the search, county and types, and drops the page
- **FR-007**: The map shows every event matching the current search, county and types, with no paging controls, up to the API's maximum page size (100). If more events match than that, a notice says so and suggests filtering. The header count is the number of matching events, not pins
- **FR-008**: Each pin sits at the event's real location, reading GeoJSON `[lng, lat]` correctly. An event without usable coordinates gets no pin, stays in the list, and a notice says how many events are not shown
- **FR-009**: Events at the same location (identical coordinates at five decimal places) share one pin. The pin's accessible name is the venue of the earliest event there, followed by the number of events when there is more than one. The popup shows that venue and address once, then lists each event, earliest start first. An event whose venue or address text differs shows its own in its entry
- **FR-010**: For each event, the popup shows its name, types and dates, with dates as they fall in Ireland and summarised as on the event card. It shows the venue and address, an event link when the event has one, and a directions link. The links match the event card and open in a new tab. Event data is displayed as plain text, never as HTML
- **FR-011**: When results change, the map moves to fit them. One location zooms to it at street-level context, not maximum zoom. No filters shows all of Ireland
- **FR-012**: The map uses the list's loading, no-data, empty-search, error and retry states. If the map code cannot load, an error with retry replaces the map, and the filters and view switch stay
- **FR-013**: If tiles fail, the map shows a notice linking to the list and keeps the pins. A brief or partial failure does not change the view
- **FR-014**: With `BjjEvents` on, `EventsMap` off or missing from the flag response hides the view switch and treats `?view=map` as the list, on `/events` with no redirect. It never affects the list. `BjjEvents` off keeps redirecting away from the feature. A failed flag fetch turns every flag off, so it redirects too. `EventsMap` and `GymsMap` do not affect each other
- **FR-015**: Pins, popups, the view switch and map controls follow the light, dark and competition themes and meet WCAG 2.1 AA, including visible focus indicators over tiles and over the map background. Tiles stay light in every theme
- **FR-016**: The view switch, pins and popup links work by keyboard, and the switch announces the current view. A shared-venue pin is one tab stop. The list is the full non-visual alternative
- **FR-017**: At phone width the map fits the screen with no horizontal page scroll, and a visitor can still scroll past it
- **FR-018**: A visitor who never opens a map downloads no map code and makes no tile requests

## Success criteria

- **SC-001**: Finished events do not appear in the listing
- **SC-002**: County and type filters compose with search
- **SC-003**: A visitor can filter the map to one county or type and open a seeded event's pin, which is in the right place
- **SC-004**: A shared `?view=map` link with filters opens the same view for another visitor
- **SC-005**: Two seeded events at one venue appear as one pin whose popup lists both
- **SC-006**: With `EventsMap` off, the Events page behaves exactly as it did before this feature, and the gym map is unaffected either way
