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
