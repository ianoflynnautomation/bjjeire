# Traceability: gyms

Requirement issues are defined in [spec.md](spec.md). Narrative SSOT:
[specs/features/gyms.md](../../features/gyms.md).

| Issue | Layer | Test path | Implementation path |
|---|---|---|---|
| `#1001` | T2 IT | `GymMongoRepositoryIT.java` (`shouldListOnlyActiveGymsWhenFilteringByCounty`, `shouldListActiveGymsOrderedByName`) | `GymService`, `GymRepository` |
| `#1001` | T1 unit | `src/bjjeire-api/src/test/java/com/bjjeire/api/gym/GymControllerTest.java` (`shouldReturnPagedGymsWhenListingByCounty`) | `GymController` |
| `#1001` | T0 Pact | `src/bjjeire-app/src/contracts/pact/gym.pact.test.ts` | `src/bjjeire-app/src/features/gyms/api/get-gyms.ts` |
| `#1001` | T4 SPA | `src/bjjeire-app/src/pages/__tests__/gyms-page.integration.test.tsx` | `GymsPage`, `useGymsPage` |
| `#1001` | T6 | `bjjeire-tests/tests/features/gyms/` | running images |
| `#1002` | T1 unit | `GymControllerTest.java` (`shouldRejectListingWhenCountyIsUnknown`) | `GymController` |
| `#1002` | T2 IT | `GymMongoRepositoryIT.java` (`shouldListOnlyActiveGymsWhenFilteringByCounty`) | `GymService`, `GymRepository` |
| `#1002` | T4 SPA | `gyms-page.integration.test.tsx` (county combobox) | `useGymsPage` |
| `#1002` | T4 API client | `src/bjjeire-app/src/features/gyms/api/__tests__/get-gyms.integration.test.ts` | `get-gyms.ts` |
| `#1003` | T4 SPA | `gyms-page.integration.test.tsx` (search) | `useListPageSearch`, `GymsPage` |
| `#1004` | T3 SPA | `src/bjjeire-app/src/features/gyms/components/__tests__/gym-card.unit.test.tsx` | `gym-card.tsx` |
| `#1004` | T3 SPA | `src/bjjeire-app/src/utils/__tests__/map-utils.unit.test.ts` | `map-utils.ts` |
| `#1004` | T2 IT | `GymMongoRepositoryIT.java` (`shouldRoundTripGeoJsonCoordinatesAndOfferedClassesWhenCreatingThroughAuthenticatedApi`) | `Gym`, `GeoCoordinates`, `ClassCategory` converters |
| `#1005` | T4 SPA | `gyms-page.integration.test.tsx` (empty, error, retry, pagination) | `GymsPage`, `ListPageShell` |
| `#1005` | T2 IT | `GymMongoRepositoryIT.java` (`shouldSerializeExplicitNullNavigationLinksWhenPageIsBeyondLast`) | `PagedResponses` |
| `#1006` | T2 IT | `src/bjjeire-api/src/test/java/com/bjjeire/api/config/WriteAuthorizationIT.java` | `SecurityConfig` |
| `#1006` | T4 SPA | `src/bjjeire-app/src/__tests__/app-routes.integration.test.tsx` | `AppRoutes` |
| `#1007` | T3 SPA | `src/bjjeire-app/src/features/gyms/utils/__tests__/gym-view-url.unit.test.ts`, `src/bjjeire-app/src/features/gyms/components/__tests__/gym-view-switch.unit.test.tsx` | `gym-view-url.ts`, `gym-view-switch.tsx` |
| `#1007` | T4 SPA | `gyms-page.integration.test.tsx` (`#1007 switching view`) | `GymsPage`, `useGymsPage` |
| `#1007` | T6 | `bjjeire-tests/tests/features/gyms/` (shared-link journey, to be added) | running images |
| `#1008` | T4 SPA | `gyms-page.integration.test.tsx` (`#1008 filters without paging`) | `useListPage` (`loadAll`), `ListPageShell` (`hidePagination`), `GymsPage` (truncation rule), `GymMap` |
| `#1008` | T6 | `bjjeire-tests/tests/features/gyms/` (county and search on the map, to be added) | running images |
| `#1009` | T3 SPA | `src/bjjeire-app/src/features/gyms/components/gym-map/__tests__/gym-pins.unit.test.ts` | `gym-pins.ts` |
| `#1009` | T4 SPA | `gyms-page.integration.test.tsx` (`#1009 gyms without usable coordinates`) | `GymMap` |
| `#1009` | T5 browser | `src/bjjeire-app/src/features/gyms/components/gym-map/__tests__/gym-map.browser.test.tsx` | `GymMap` |
| `#1009` | T6 | `bjjeire-tests/tests/features/gyms/` (seeded gym pin, to be added) | running images |
| `#1010` | T3 SPA | `src/bjjeire-app/src/features/gyms/components/gym-map/__tests__/gym-map-popup.unit.test.tsx` | `gym-map-popup.tsx` |
| `#1010` | T5 browser | `gym-map.browser.test.tsx` (opening a pin) | `GymMap` |
| `#1010` | T6 | `bjjeire-tests/tests/features/gyms/` (seeded gym popup, to be added) | running images |
| `#1011` | T3 SPA | `src/bjjeire-app/src/features/gyms/components/gym-map/__tests__/map-bounds.unit.test.ts` | `map-bounds.ts` |
| `#1011` | T5 browser | `gym-map.browser.test.tsx` (`#1011` cases) | `GymMap` (`MapViewport`) |
| `#1011` | T5 browser | `src/bjjeire-app/src/pages/__tests__/gyms-page-map-viewport.browser.test.tsx` (filters reach the map) | `GymsPage`, `GymMap` |
| `#1011` | T6 | `bjjeire-tests/tests/features/gyms/` (map moves on county and search, to be added) | running images |
| `#1012` | T4 SPA | `gyms-page.integration.test.tsx` (`#1012 loading, empty and error states`) | `GymsPage`, `ListPageShell` |
| `#1012` | T4 SPA | `src/bjjeire-app/src/pages/__tests__/gyms-page-map-chunk-failure.integration.test.tsx` (message, retry, filters and List stay) | `GymsPage` (`PageErrorBoundary`) |
| `#1013` | T5 browser | `gym-map.browser.test.tsx` (`#1013` cases, tile URL blocked) | `GymMap` |
| `#1013` | T6 | `bjjeire-tests/tests/features/gyms/` (tile failure, to be added) | running images |
| `#1014` | T1 unit | `src/bjjeire-api/src/test/java/com/bjjeire/api/web/FeatureFlagServiceTest.java`, `FeatureFlagControllerTest.java`, `FeatureFlagDefaultsTest.java` | `FeatureFlag`, `application.yml` |
| `#1014` | T0 Pact | `src/bjjeire-app/src/contracts/pact/featureflag.pact.test.ts` | `definitions.ts`, `FeatureFlag` |
| `#1014` | T4 SPA | `gyms-page.integration.test.tsx` (`#1014 flag fails safe to the list`), `src/bjjeire-app/src/features/feature-flags/__tests__/feature-flag-resolve.integration.test.ts` | `useGymsPage`, `resolve.ts` |
| `#1014` | T4 SPA | `src/bjjeire-app/src/__tests__/app-routes.integration.test.tsx` (failed fetch) | `AppRoutes`, `resolve.ts` |
| `#1014` | T6 | `bjjeire-tests/tests/features/gyms/` (map link with the map off, to be added) | running images |
| `#1015` | T3 SPA | `gym-view-switch.unit.test.tsx`, `gym-map-popup.unit.test.tsx` (focus, Escape) | `gym-view-switch.tsx`, `gym-map-popup.tsx` |
| `#1015` | T5 browser | `gym-map.browser.test.tsx` (keyboard, focus indicators, including an on-screen pixel check of the map ring over tiles and with tiles failed, and pin contrast in each theme, wheel, coarse pointer, phone width), `gyms-page-map-viewport.browser.test.tsx` (whole page at phone width), `src/bjjeire-app/src/features/gyms/components/__tests__/gym-view-switch.browser.test.tsx` (focus ring contrast in each theme) | `GymMap`, `gym-map.css`, `view-switch-variants.ts` |
| `#1015` | T6 | `bjjeire-tests/tests/features/gyms/` (axe in each theme, to be added; axe does not judge focus indicators or pin contrast on tiles, which T5 owns) | running images, `gym-map.css`, `--ui-map-pin` |
| `#1016` | T5 browser | `src/bjjeire-app/src/pages/__tests__/gyms-page-map-loading.browser.test.tsx` | `GymsPage` (`lazy`) |
| `#1016` | T6 | `bjjeire-tests/tests/features/gyms/` (no map requests on the list, to be added) | running images |
