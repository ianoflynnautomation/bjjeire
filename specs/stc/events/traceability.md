# Traceability: events

Requirement issues are defined in [spec.md](spec.md). Narrative SSOT:
[specs/features/events.md](../../features/events.md).

| Issue | Layer | Test path | Implementation path |
|---|---|---|---|
| `#2001` | T2 IT | `BjjEventMongoRepositoryIT.java` (`shouldExcludeInactiveExpiredAndCompletedEventsWhenListingByCountyAndType`, `shouldListUpcomingEventsOrderedByCreatedAt`) | `BjjEventService` |
| `#2001` | T1 unit | `BjjEventControllerTest.java` (`shouldReturnPagedEventsWhenListingByCountyAndTypes`) | `BjjEventController` |
| `#2001` | T0 Pact | `src/bjjeire-app/src/contracts/pact/bjjevent.pact.test.ts` | `get-bjj-events.ts` |
| `#2001` | T4 SPA | `src/bjjeire-app/src/pages/__tests__/events-page.integration.test.tsx` | `EventsPage`, `useEventsPage` |
| `#2001` | T6 | `bjjeire-tests/tests/features/events/` | running images |
| `#2002` | T2 IT | `BjjEventMongoRepositoryIT.java` (county/type overlap, unknown type) | `BjjEventService` |
| `#2002` | T4 SPA | `events-page.integration.test.tsx` (county combobox, type button) | `useEventsPage` |
| `#2002` | T4 API client | `src/bjjeire-app/src/features/bjjevents/api/__tests__/get-bjj-events.integration.test.ts` | `get-bjj-events.ts` |
| `#2003` | T4 SPA | `events-page.integration.test.tsx` (search) | `useListPageSearch` |
| `#2004` | T3 SPA | `src/bjjeire-app/src/features/bjjevents/components/__tests__/event-card.unit.test.tsx` | `event-card.tsx` |
| `#2004` | T3 SPA | `src/bjjeire-app/src/utils/__tests__/map-utils.unit.test.ts` | `map-utils.ts` |
| `#2005` | T4 SPA | `events-page.integration.test.tsx` (empty, error, pagination) | `EventsPage`, `ListPageShell` |
| `#2005` | T2 IT | `BjjEventMongoRepositoryIT.java` (`shouldBuildAbsoluteNavigationLinksWithOnlyPageAndPageSize`) | `PagedResponses`, `UriService` |
| `#2006` | T2 IT | `WriteAuthorizationIT.java` · event write methods in `BjjEventMongoRepositoryIT.java` | `SecurityConfig`, `BjjEventService` |
| `#2006` | T4 SPA | `src/bjjeire-app/src/__tests__/app-routes.integration.test.tsx` | `AppRoutes` |
| `#2007` | T3 SPA | `src/bjjeire-app/src/features/bjjevents/utils/__tests__/event-view-url.unit.test.ts`, `src/bjjeire-app/src/features/bjjevents/components/__tests__/event-view-switch.unit.test.tsx` | `event-view-url.ts`, `event-view-switch.tsx` |
| `#2007` | T4 SPA | `src/bjjeire-app/src/pages/__tests__/events-page.integration.test.tsx` (`#2007 switching view`) | `EventsPage`, `useEventsPage` |
| `#2007` | T6 | `bjjeire-tests/tests/features/events/` (shared-link journey, to be added) | running images |
| `#2008` | T4 SPA | `events-page.integration.test.tsx` (`#2008 filters without paging`) | `useListPage` (`loadAll`), `ListPageShell` (`hidePagination`), `EventsPage` (truncation rule), `EventMap` |
| `#2008` | T6 | `bjjeire-tests/tests/features/events/` (county and type on the map, to be added) | running images |
| `#2009` | T3 SPA | `src/bjjeire-app/src/features/bjjevents/components/event-map/__tests__/event-locations.unit.test.ts` (`toEventLocations`) | `event-locations.ts` |
| `#2009` | T4 SPA | `events-page.integration.test.tsx` (`#2009 events without usable coordinates`) | `EventMap` |
| `#2009` | T5 browser | `src/bjjeire-app/src/features/bjjevents/components/event-map/__tests__/event-map.browser.test.tsx` | `EventMap` |
| `#2009` | T6 | `bjjeire-tests/tests/features/events/` (seeded event pin, to be added) | running images |
| `#2010` | T3 SPA | `event-locations.unit.test.ts` (`events at one venue`), `src/bjjeire-app/src/features/bjjevents/components/event-map/__tests__/event-map-popup.unit.test.tsx` (shared venue) | `event-locations.ts`, `event-map-popup.tsx` |
| `#2010` | T4 SPA | `events-page.integration.test.tsx` (`#2010 events at one venue`) | `EventMap` |
| `#2010` | T5 browser | `event-map.browser.test.tsx` (shared-venue pin) | `EventMap` |
| `#2010` | T6 | `bjjeire-tests/tests/features/events/` (two seeded events at Leinster Grappling HQ, to be added) | running images |
| `#2011` | T3 SPA | `event-map-popup.unit.test.tsx`, `src/bjjeire-app/src/utils/__tests__/event-schedule-text.unit.test.ts` | `event-map-popup.tsx`, `event-schedule-text.ts` (shared with `event-schedule.tsx`) |
| `#2011` | T5 browser | `event-map.browser.test.tsx` (opening a pin) | `EventMap` |
| `#2011` | T6 | `bjjeire-tests/tests/features/events/` (seeded event popup, to be added) | running images |
| `#2012` | T3 SPA | `src/bjjeire-app/src/features/bjjevents/components/event-map/__tests__/event-map-bounds.unit.test.ts` | `event-map-bounds.ts` |
| `#2012` | T5 browser | `event-map.browser.test.tsx` (`#2012` cases), `src/bjjeire-app/src/pages/__tests__/events-page-map-viewport.browser.test.tsx` (filters reach the map) | `EventMap` (`MapViewport`), `EventsPage` |
| `#2012` | T6 | `bjjeire-tests/tests/features/events/` (map moves on county and search, to be added) | running images |
| `#2013` | T4 SPA | `events-page.integration.test.tsx` (`#2013 loading, empty and error states`), `src/bjjeire-app/src/pages/__tests__/events-page-map-chunk-failure.integration.test.tsx` (message, retry, filters and List stay) | `EventsPage`, `ListPageShell`, `PageErrorBoundary` |
| `#2014` | T5 browser | `event-map.browser.test.tsx` (`#2014` cases, tile URL blocked) | `EventMap` |
| `#2014` | T6 | `bjjeire-tests/tests/features/events/` (tile failure, to be added) | running images |
| `#2015` | T1 unit | `src/bjjeire-api/src/test/java/com/bjjeire/api/web/FeatureFlagServiceTest.java`, `FeatureFlagControllerTest.java`, `FeatureFlagDefaultsTest.java` | `FeatureFlag`, `application.yml` |
| `#2015` | T0 Pact | `src/bjjeire-app/src/contracts/pact/featureflag.pact.test.ts` | `definitions.ts`, `FeatureFlag` |
| `#2015` | T4 SPA | `events-page.integration.test.tsx` (`#2015 flag fails safe to the list`), `gyms-page.integration.test.tsx` (events map does not affect gyms), `src/bjjeire-app/src/features/feature-flags/__tests__/feature-flag-resolve.integration.test.ts` | `useEventsPage`, `resolve.ts` |
| `#2015` | T6 | `bjjeire-tests/tests/features/events/` (map link with the map off, to be added) | running images |
| `#2016` | T3 SPA | `event-view-switch.unit.test.tsx`, `event-map-popup.unit.test.tsx` (focus, Escape) | `event-view-switch.tsx`, `event-map-popup.tsx` |
| `#2016` | T5 browser | `event-map.browser.test.tsx` (keyboard, focus indicators measured in pixels over tiles and with tiles failed, pin contrast in each theme, wheel, coarse pointer, phone width), `events-page-map-viewport.browser.test.tsx` (whole page at phone width), `src/bjjeire-app/src/features/bjjevents/components/__tests__/event-view-switch.browser.test.tsx` (focus ring contrast in each theme) | `EventMap`, `event-map.css`, `view-switch-variants.ts` |
| `#2016` | T6 | `bjjeire-tests/tests/features/events/` (axe in each theme, to be added; axe does not judge focus indicators or pin contrast on tiles, which T5 owns) | running images |
| `#2017` | T5 browser | `src/bjjeire-app/src/pages/__tests__/events-page-map-loading.browser.test.tsx` | `EventsPage` (`lazy`) |
| `#2017` | T6 | `bjjeire-tests/tests/features/events/` (no map requests on the list, against a built image, to be added) | running images |
