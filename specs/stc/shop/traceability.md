# Traceability: shop

Requirement issues are defined in [spec.md](spec.md). Narrative SSOT:
[specs/features/shop.md](../../features/shop.md).

| Issue | Layer | Test path | Implementation path |
|---|---|---|---|
| `#4001` | T2 IT | `StoreMongoRepositoryIT.java` (`shouldListOnlyActiveStoresWhenListing`, `shouldListActiveStoresOrderedByName`) | `StoreService` |
| `#4001` | T1 unit | `StoreControllerTest.java` (`shouldReturnPagedStoresWhenListing`) | `StoreController` |
| `#4001` | T0 Pact | `src/bjjeire-app/src/contracts/pact/store.pact.test.ts` | `get-stores.ts` |
| `#4001` | T4 SPA | `src/bjjeire-app/src/pages/__tests__/shop-page.integration.test.tsx` | `ShopPage` |
| `#4001` | T6 | `bjjeire-tests/tests/features/stores/` | running images |
| `#4002` | T4 SPA | `shop-page.integration.test.tsx` (search) | `useListPageSearch` |
| `#4003` | T4 SPA | `shop-page.integration.test.tsx` (empty, error, pagination) | `ListPageShell` |
| `#4004` | T1 unit | `StoreControllerTest.java` (`shouldRejectListingWhenPageIsNotANumber`) | `StoreController` |
| `#4005` | T3 SPA | `src/bjjeire-app/src/components/layout/__tests__/use-nav-items.unit.test.tsx` (`the entry says Shop, opens /shop and no entry says Stores`) | `use-nav-items.ts`, `config/paths.ts` (`shop`) |
| `#4005` | T3 SPA | `src/bjjeire-app/src/config/__tests__/ui-content-shop-name.unit.test.ts` | `config/content/shop.ts`, `config/paths.ts` |
| `#4005` | T4 SPA | `shop-page.integration.test.tsx` (`Shop is the main heading`), `document-title.integration.test.tsx` (Shop), `footer.unit.test.tsx` | `ShopPage`, `stores-page-header.tsx` |
| `#4005` | T6 | `bjjeire-tests/specs/features/shop.md` (planned: `visitor should see Shop in the navigation instead of Stores`, `… when choosing Shop in the navigation`) | running images |
| `#4006` | T4 SPA | `shop-page.integration.test.tsx` (every case; `the cards keep the API order`) | `ShopPage`, `features/stores/` (unchanged) |
| `#4006` | T4 SPA | `src/bjjeire-app/src/__tests__/app-routes.integration.test.tsx` (`the Shop page lists the directory`) | `config/features.ts` |
| `#4006` | T6 | `bjjeire-tests/specs/features/shop.md` (UI 1–9 once the page object moves to `/shop`; planned `… when choosing Shop in the navigation`) | running images |
| `#4007` | T4 SPA | `app-routes.integration.test.tsx` (`follows the old address`, `Stores flag is off`) | `App.tsx`, `config/paths.ts` (`legacyRedirects`) |
| `#4007` | T3 SPA | `src/bjjeire-app/src/__tests__/sitemap.unit.test.ts` | `public/sitemap.xml` |
| `#4007` | T6 | `bjjeire-tests/specs/features/shop.md` (planned: `… when following an old Stores link`, `… when going back`, `client should find the Shop address … in the site map`) | running images |
| `#6026` | T1 unit | `src/bjjeire-api/src/test/java/com/bjjeire/api/web/MerchFeatureGateFilterTest.java` (reads, writes, decoded paths) | `web/MerchFeatureGateFilter`, `web/FeatureGateFilter`, `common/ApiRoutes.isMerchFeaturePath` |
| `#6026` | T1 unit | `FeatureFlagDefaultsTest.java` (`shouldDefaultMerchToOffInApplicationConfiguration`), `FeatureFlagServiceTest.java` (`Merch` false when unconfigured) | `web/FeatureFlag.MERCH`, `application.yml` (`FEATURE_MERCH`) |
| `#6026` | T1 unit | `CrossCuttingFilterTest.java` (`readOnlyModeLetsMerchWritesThroughAndStillBlocksTheDirectory`) | `config/ReadOnlyModeFilter` |
| `#6026` | T2 IT | `src/bjjeire-api/src/test/java/com/bjjeire/api/config/MerchFeatureOffIT.java` | `config/SecurityConfig` (gate ahead of authentication) |
| `#6026` | T3 SPA | `src/bjjeire-app/src/features/feature-flags/__tests__/feature-flag-resolve.integration.test.ts` (`Merch` fails closed), `client.unit.test.ts` (catalogue) | `features/feature-flags/definitions.ts` |
| `#6026` | T0 Pact | `src/bjjeire-app/src/contracts/pact/featureflag.pact.test.ts` (`Merch: boolean`); provider `PactProviderVerificationIT` | `GET /api/v1/featureflag` |
| `#6027` | T1 unit | `MerchFeatureGateFilterTest.java` (`shouldLeaveEveryOtherRouteAloneWhenFlagIsOff`) | `web/MerchFeatureGateFilter` |
| `#6027` | T1 unit | `src/bjjeire-api/src/test/java/com/bjjeire/api/registration/StripePaymentGatewayTest.java` (sessions and refunds marked `registration`) | `registration/StripePaymentGateway`, `common/StripeMetadata` |
| `#6027` | T2 IT | `MerchFeatureOffIT.java` (directory lists, directory writes 405) | `config/ReadOnlyModeFilter` |
| `#6027` | T2 IT | `src/bjjeire-api/src/test/java/com/bjjeire/api/registration/StripeWebhookIT.java` (`shouldAcknowledgeAndIgnoreCheckoutEventsTheShopMade`, `…RefundEventsTheShopMade`, `shouldConfirmASignUpWhoseSessionSaysItIsARegistration`) | `registration/StripeWebhookServiceImpl` |
| `#6017`, `#6025` | T2 IT (security rules only) | `src/bjjeire-api/src/test/java/com/bjjeire/api/config/MerchRouteAuthorizationIT.java` (`shouldReserveMerchAdminRoutesForTheOrganiser`, `shouldNotServeTheAdminListsThroughThePublicPatterns`) | `config/SecurityConfig.merchRules`. The controllers and their own refusal tests land in slices 2 and 5 |
| `#6012` | T2 IT (security rules only) | `MerchRouteAuthorizationIT.java` (`shouldLetGuestsStartReadAndResumeAnOrderWithoutAToken`) | `config/SecurityConfig.merchRules`. Checkout itself lands in slice 3 |
