# Traceability: competitions

Requirement issues are defined in [spec.md](spec.md). Narrative SSOT:
[specs/features/competitions.md](../../features/competitions.md).

| Issue | Layer | Test path | Implementation path |
|---|---|---|---|
| `#3001` | T2 IT | `CompetitionMongoRepositoryIT.java` (`shouldExcludeExpiredAndInactiveCompetitionsWhenListingByDefault`, `shouldListUpcomingCompetitionsOrderedByStartDate`) | `CompetitionService` |
| `#3001` | T1 unit | `CompetitionControllerTest.java` (`shouldReturnPagedCompetitionsWhenListing`) | `CompetitionController` |
| `#3001` | T0 Pact | `src/bjjeire-app/src/contracts/pact/competition.pact.test.ts` | `get-competitions.ts` |
| `#3001` | T4 SPA | `src/bjjeire-app/src/pages/__tests__/competitions-page.integration.test.tsx` | `CompetitionsPage` |
| `#3001` | T6 | `bjjeire-tests/tests/features/competitions/` | running images |
| `#3002` | T2 IT | `CompetitionMongoRepositoryIT.java` (`shouldIncludeExpiredAndInactiveCompetitionsWhenRequested`) | `CompetitionService` |
| `#3002` | T1 unit | `CompetitionControllerTest.java` (`shouldRejectListingWhenIncludeInactiveIsNotBoolean`) | `CompetitionController` |
| `#3003` | T4 SPA | `competitions-page.integration.test.tsx` (search) | `useListPageSearch` |
| `#3004` | T4 SPA | `competitions-page.integration.test.tsx` (empty, error) | `ListPageShell` |
| `#3005` | T2 IT | `DeactivationInfrastructureIT.java` (unique slug index, TTL, deactivate expired) | `MongoIndexInitializer`, `CompetitionDeactivator` |
| `#3005` | T1 unit | `CompetitionExpiryTest.java` | `Competition.stampExpiry` |
