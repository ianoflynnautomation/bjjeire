# Traceability: events

AC-IDs are defined in [spec.md](spec.md). Narrative SSOT:
[specs/features/events.md](../../features/events.md).

| AC-ID | Layer | Test path | Implementation path |
|---|---|---|---|
| AC-EVT-001 | T2 IT | `BjjEventMongoRepositoryIT.java` (`shouldExcludeInactiveExpiredAndCompletedEventsWhenListingByCountyAndType`, `shouldListUpcomingEventsOrderedByCreatedAt`) | `BjjEventService` |
| AC-EVT-001 | T1 unit | `BjjEventControllerTest.java` (`shouldReturnPagedEventsWhenListingByCountyAndTypes`) | `BjjEventController` |
| AC-EVT-001 | T0 Pact | `src/bjjeire-app/src/contracts/pact/bjjevent.pact.test.ts` | `get-bjj-events.ts` |
| AC-EVT-001 | T4 SPA | `src/bjjeire-app/src/pages/__tests__/events-page.integration.test.tsx` | `EventsPage`, `useEventsPage` |
| AC-EVT-001 | T6 | `bjjeire-tests/tests/features/events/` | running images |
| AC-EVT-002 | T2 IT | `BjjEventMongoRepositoryIT.java` (county/type overlap, numeric type, unknown type) | `BjjEventService` |
| AC-EVT-002 | T4 SPA | `events-page.integration.test.tsx` (county combobox, type button) | `useEventsPage` |
| AC-EVT-002 | T4 API client | `src/bjjeire-app/src/features/bjjevents/api/__tests__/get-bjj-events.integration.test.ts` | `get-bjj-events.ts` |
| AC-EVT-003 | T4 SPA | `events-page.integration.test.tsx` (search) | `useListPageSearch` |
| AC-EVT-004 | T3 SPA | `src/bjjeire-app/src/features/bjjevents/components/__tests__/event-card.unit.test.tsx` | `event-card.tsx` |
| AC-EVT-004 | T3 SPA | `src/bjjeire-app/src/utils/__tests__/map-utils.unit.test.ts` | `map-utils.ts` |
| AC-EVT-005 | T4 SPA | `events-page.integration.test.tsx` (empty, error, pagination) | `EventsPage`, `ListPageShell` |
| AC-EVT-005 | T2 IT | `BjjEventMongoRepositoryIT.java` (`shouldBuildAbsoluteNavigationLinksWithOnlyPageAndPageSize`) | `PagedResponses`, `UriService` |
| AC-EVT-006 | T2 IT | `WriteAuthorizationIT.java` · event write methods in `BjjEventMongoRepositoryIT.java` | `SecurityConfig`, `BjjEventService` |
| AC-EVT-006 | T4 SPA | `src/bjjeire-app/src/__tests__/app-routes.integration.test.tsx` | `AppRoutes` |
