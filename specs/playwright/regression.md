# Regression — full acceptance contract

**Seed:** [seed.md](seed.md)  
**Suite:** `bjjeire-tests` · `npm run test:acceptance` · every test is `@acceptance`  
**CI:** AKS acceptance / staging; not the Compose `@smoke` tax

Scenarios below are the living Given/When/Then lines. Generator extends the
feature file in `bjjeire-tests/tests/features/<feature>/`. Titles must match
exactly. Use seeded DTOs; search/filter against a **named** seeded row.

## Gyms (`specs/features/gyms.md`)

**Files:** `gyms.ui.acceptance.spec.ts`, `gyms.api.acceptance.spec.ts`

1. Given available gyms, when a visitor opens Gyms, then the gym list is displayed (`@smoke`)
2. Given gyms are published, when a client opens the directory, then each published gym is returned with its details
3. Given gyms are published, when a client opens the directory, then they are ordered by name
4. Given a gym name, when a visitor searches, then only that gym is displayed
5. Given part of a gym name, when a visitor searches, then the matching gym is displayed
6. Given gyms in several counties, when a visitor filters by county, then only gyms from that county are displayed
7. Given a county filter is applied, when the visitor resets it to all counties, then gyms from other counties can be found again
8. Given gyms are published, when a client filters by county, then only gyms from that county are returned
9. Given an unknown county, when a client filters by it, then the request is rejected as a bad request
10. Given a gym card, when a visitor views it, then its website and map links point to the right destinations
11. Given no matching gym, when a visitor searches, then an empty state is displayed
12. Given the API returns no gyms, when a visitor opens Gyms, then the no-data message is shown
13. Given the API request fails / server error, when a visitor opens Gyms, then the matching error message is shown
14. Given the API failed once, when the visitor retries, then the gym list is displayed
15. Given the directory spans more than one page, when a client pages through it, then each page is a distinct slice with correct links
16. Given a page beyond the last, when a client requests it, then an empty page with valid pagination is returned

Map query is **lat,lng** derived from GeoJSON `[lng, lat]`.

## Events (`specs/features/events.md`)

**Files:** `events.ui.acceptance.spec.ts`, `events.api.acceptance.spec.ts`

1. Given available events, when a visitor opens Events, then the event list is displayed (`@smoke`)
2. Given events are published, when a client opens the listing, then each upcoming event is returned with its details
3. Given an event has finished, when a client opens the listing, then it is not shown
4. Given several events are published, when a client opens the listing, then they are ordered by creation date
5. Given an event name / part of a name, when a visitor searches, then only that event is displayed
6. Given an active search, when the visitor clears it, then events from the full listing are displayed again
7. Given events in several counties, when a visitor filters by county, then only events from that county are displayed
8. Given events of several types, when a visitor filters by type, then only events of that type are displayed
9. Given an event has several types, when a client filters by any one of them, then the event is returned
10. Empty / network / server-error — same pattern as gyms

## Competitions (`specs/features/competitions.md`)

1. Given available competitions, when a visitor opens Competitions, then the competition list is displayed (`@smoke`)
2. Given competitions are published, when a client opens the listing, then each published competition is returned with its details
3. Given a competition has finished, when a client opens the listing, then it is not shown
4. Given several competitions are published, when a client opens the listing, then they are ordered by start date
5. Given a competition name / part of a name, when a visitor searches, then only that competition is displayed
6. Given the listing spans more than one page, when a visitor moves between pages, then each page shows its own competitions
7. Empty / error — same pattern as gyms

## Stores (`specs/features/stores.md`)

1. Given available stores, when a visitor opens Stores, then the store list is displayed (`@smoke`)
2. Given stores are published, when a client opens the directory, then each published store is returned with its details
3. Given stores are published, when a client opens the directory, then they are ordered by name
4. Given a store name / part of a name, when a visitor searches, then only that store is displayed
5. Empty / error — same pattern as gyms

## Out of scope for this plan

- Vitest unit/integration (this repo)
- Visual/ARIA snapshots (`*.snapshot.acceptance.spec.ts`) unless the change is visual
- Axe route sweep (`routes.a11y.acceptance.spec.ts`)
- Auth writes (public directory; writes are API ITs + Entra)
