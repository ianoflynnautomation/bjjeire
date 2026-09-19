# Traceability: competitions

AC-IDs are defined in [spec.md](spec.md). Narrative SSOT:
[specs/features/competitions.md](../../features/competitions.md).

| AC-ID | Layer | Test path | Implementation path |
|---|---|---|---|
| AC-CMP-001 | T2 IT | `CompetitionMongoRepositoryIT.java` (`shouldExcludeExpiredAndInactiveCompetitionsWhenListingByDefault`, `shouldListUpcomingCompetitionsOrderedByStartDate`) | `CompetitionService` |
| AC-CMP-001 | T1 unit | `CompetitionControllerTest.java` (`shouldReturnPagedCompetitionsWhenListing`) | `CompetitionController` |
| AC-CMP-001 | T0 Pact | `src/bjjeire-app/src/contracts/pact/competition.pact.test.ts` | `get-competitions.ts` |
| AC-CMP-001 | T4 SPA | `src/bjjeire-app/src/pages/__tests__/competitions-page.integration.test.tsx` | `CompetitionsPage` |
| AC-CMP-001 | T6 | `bjjeire-tests/tests/features/competitions/` | running images |
| AC-CMP-002 | T2 IT | `CompetitionMongoRepositoryIT.java` (`shouldIncludeExpiredAndInactiveCompetitionsWhenRequested`) | `CompetitionService` |
| AC-CMP-002 | T1 unit | `CompetitionControllerTest.java` (`shouldRejectListingWhenIncludeInactiveIsNotBoolean`) | `CompetitionController` |
| AC-CMP-003 | T4 SPA | `competitions-page.integration.test.tsx` (search) | `useListPageSearch` |
| AC-CMP-004 | T4 SPA | `competitions-page.integration.test.tsx` (empty, error) | `ListPageShell` |
| AC-CMP-005 | T2 IT | `DeactivationInfrastructureIT.java` (unique slug index, TTL, deactivate expired) | `MongoIndexInitializer`, `CompetitionDeactivator` |
| AC-CMP-005 | T1 unit | `CompetitionExpiryTest.java` | `Competition.stampExpiry` |
