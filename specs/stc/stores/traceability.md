# Traceability: stores

Requirement issues are defined in [spec.md](spec.md). Narrative SSOT:
[specs/features/stores.md](../../features/stores.md).

| Issue | Layer | Test path | Implementation path |
|---|---|---|---|
| `#4001` | T2 IT | `StoreMongoRepositoryIT.java` (`shouldListOnlyActiveStoresWhenListing`, `shouldListActiveStoresOrderedByName`) | `StoreService` |
| `#4001` | T1 unit | `StoreControllerTest.java` (`shouldReturnPagedStoresWhenListing`) | `StoreController` |
| `#4001` | T0 Pact | `src/bjjeire-app/src/contracts/pact/store.pact.test.ts` | `get-stores.ts` |
| `#4001` | T4 SPA | `src/bjjeire-app/src/pages/__tests__/stores-page.integration.test.tsx` | `StoresPage` |
| `#4001` | T6 | `bjjeire-tests/tests/features/stores/` | running images |
| `#4002` | T4 SPA | `stores-page.integration.test.tsx` (search) | `useListPageSearch` |
| `#4003` | T4 SPA | `stores-page.integration.test.tsx` (empty, error, pagination) | `ListPageShell` |
| `#4004` | T1 unit | `StoreControllerTest.java` (`shouldRejectListingWhenPageIsNotANumber`) | `StoreController` |
