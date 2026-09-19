# Traceability: stores

AC-IDs are defined in [spec.md](spec.md). Narrative SSOT:
[specs/features/stores.md](../../features/stores.md).

| AC-ID | Layer | Test path | Implementation path |
|---|---|---|---|
| AC-STR-001 | T2 IT | `StoreMongoRepositoryIT.java` (`shouldListOnlyActiveStoresWhenListing`, `shouldListActiveStoresOrderedByName`) | `StoreService` |
| AC-STR-001 | T1 unit | `StoreControllerTest.java` (`shouldReturnPagedStoresWhenListing`) | `StoreController` |
| AC-STR-001 | T0 Pact | `src/bjjeire-app/src/contracts/pact/store.pact.test.ts` | `get-stores.ts` |
| AC-STR-001 | T4 SPA | `src/bjjeire-app/src/pages/__tests__/stores-page.integration.test.tsx` | `StoresPage` |
| AC-STR-001 | T6 | `bjjeire-tests/tests/features/stores/` | running images |
| AC-STR-002 | T4 SPA | `stores-page.integration.test.tsx` (search) | `useListPageSearch` |
| AC-STR-003 | T4 SPA | `stores-page.integration.test.tsx` (empty, error, pagination) | `ListPageShell` |
| AC-STR-004 | T1 unit | `StoreControllerTest.java` (`shouldRejectListingWhenPageIsNotANumber`) | `StoreController` |
