# Traceability: gyms

AC-IDs are defined in [spec.md](spec.md). Narrative SSOT:
[specs/features/gyms.md](../../features/gyms.md).

| AC-ID | Layer | Test path | Implementation path |
|---|---|---|---|
| AC-GYM-001 | T2 IT | `GymMongoRepositoryIT.java` (`shouldListOnlyActiveGymsWhenFilteringByCounty`, `shouldListActiveGymsOrderedByName`) | `GymService`, `GymRepository` |
| AC-GYM-001 | T1 unit | `src/bjjeire-api/src/test/java/com/bjjeire/api/gym/GymControllerTest.java` (`shouldReturnPagedGymsWhenListingByCounty`) | `GymController` |
| AC-GYM-001 | T0 Pact | `src/bjjeire-app/src/contracts/pact/gym.pact.test.ts` | `src/bjjeire-app/src/features/gyms/api/get-gyms.ts` |
| AC-GYM-001 | T4 SPA | `src/bjjeire-app/src/pages/__tests__/gyms-page.integration.test.tsx` | `GymsPage`, `useGymsPage` |
| AC-GYM-001 | T6 | `bjjeire-tests/tests/features/gyms/` | running images |
| AC-GYM-002 | T1 unit | `GymControllerTest.java` (`shouldRejectListingWhenCountyIsUnknown`) | `GymController` |
| AC-GYM-002 | T2 IT | `GymMongoRepositoryIT.java` (`shouldListOnlyActiveGymsWhenFilteringByCounty`) | `GymService`, `GymRepository` |
| AC-GYM-002 | T4 SPA | `gyms-page.integration.test.tsx` (county combobox) | `useGymsPage` |
| AC-GYM-002 | T4 API client | `src/bjjeire-app/src/features/gyms/api/__tests__/get-gyms.integration.test.ts` | `get-gyms.ts` |
| AC-GYM-003 | T4 SPA | `gyms-page.integration.test.tsx` (search) | `useListPageSearch`, `GymsPage` |
| AC-GYM-004 | T3 SPA | `src/bjjeire-app/src/features/gyms/components/__tests__/gym-card.unit.test.tsx` | `gym-card.tsx` |
| AC-GYM-004 | T3 SPA | `src/bjjeire-app/src/utils/__tests__/map-utils.unit.test.ts` | `map-utils.ts` |
| AC-GYM-004 | T2 IT | `GymMongoRepositoryIT.java` (`shouldRoundTripGeoJsonCoordinatesAndOfferedClassesWhenCreatingThroughAuthenticatedApi`) | `Gym`, `GeoCoordinates`, `ClassCategory` converters |
| AC-GYM-005 | T4 SPA | `gyms-page.integration.test.tsx` (empty, error, retry, pagination) | `GymsPage`, `ListPageShell` |
| AC-GYM-005 | T2 IT | `GymMongoRepositoryIT.java` (`shouldSerializeExplicitNullNavigationLinksWhenPageIsBeyondLast`) | `PagedResponses` |
| AC-GYM-006 | T2 IT | `src/bjjeire-api/src/test/java/com/bjjeire/api/config/WriteAuthorizationIT.java` | `SecurityConfig` |
| AC-GYM-006 | T4 SPA | `src/bjjeire-app/src/__tests__/app-routes.integration.test.tsx` | `AppRoutes` |
