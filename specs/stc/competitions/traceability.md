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

## The merge — `#3006`–`#3017`

Paths are relative to `src/bjjeire-api/src/test/java/com/bjjeire/api/` (API) or `src/bjjeire-app/src/` (SPA).

| Issue | Layer | Test path | Implementation path |
|---|---|---|---|
| `#3006` | T1 unit | `bjjeirecompetition/BjjEireCompetitionRulesTest.java` (`shouldCountAPublishedCompetitionAsUpcomingUntilTheEndOfItsDayInIreland`) | `BjjEireCompetitionRules.isUpcoming`, `today` |
| `#3006` | T1 unit | `bjjeirecompetition/BjjEireCompetitionServiceTest.java` (`shouldStopServingYesterdaysCachedUpcomingListAtMidnightInIreland`) | `BjjEireCompetitionServiceImpl.getUpcoming` |
| `#3006` | T2 IT | `bjjeirecompetition/BjjEireCompetitionMongoRepositoryIT.java` (`shouldListOnlyUpcomingPublishedBjjEireCompetitionsEarliestDayThenName`) | `BjjEireCompetitionController.listBjjEireCompetitions`, `getUpcoming` |
| `#3006` | T0 Pact | `contracts/pact/bjjeire-competition.pact.test.ts` (upcoming list, one page of 100) | `features/bjjeire-competitions/api/get-bjjeire-competitions.ts` |
| `#3006` | T4 SPA | `pages/__tests__/competitions-page-featured.integration.test.tsx` (section above the search box, order, card fields; the BJJ Éire logo heads each card, `alt=""`, lazy) | `features/bjjeire-competitions/components/featured-bjjeire-competitions.tsx`, `components/bjjeire-competition-card.tsx`, `utils/card-image.ts`, `public/bjjeire-competition.jpg`, `hooks/useUpcomingBjjEireCompetitions.ts`, `components/layout/list-page-shell.tsx` (`featured`), `pages/CompetitionsPage.tsx` |
| `#3006` | T6 | `bjjeire-tests` (`specs/features/competitions.md`) | running images |
| `#3007` | T1 unit | `bjjeirecompetition/BjjEireCompetitionRulesTest.java` (`shouldNeverCountAnUnpublishedFinishedOrCancelledCompetitionAsUpcoming`) | `BjjEireCompetitionRules.isUpcoming` |
| `#3007` | T2 IT | `bjjeirecompetition/BjjEireCompetitionMongoRepositoryIT.java` (`shouldListOnlyUpcomingPublishedBjjEireCompetitionsEarliestDayThenName`: passed, finished, cancelled, draft left out) | `getUpcoming` |
| `#3007` | T4 SPA | `pages/__tests__/competitions-page-featured.integration.test.tsx` (empty; flag off; loading; failing) | `featured-bjjeire-competitions.tsx` |
| `#3007` | T6 | `bjjeire-tests` | running images |
| `#3008` | T4 SPA | `pages/__tests__/competitions-page-featured.integration.test.tsx` (search empty state with featured kept; one featured request whatever the listing page) | `ListPageShell` `featured` slot |
| `#3008` | T6 | `bjjeire-tests` | running images |
| `#3009` | T2 IT | `bjjeirecompetition/BjjEireCompetitionMongoRepositoryIT.java` (`shouldNotServeADraftBySlug`, `shouldStillServeAFinishedCancelledOrPassedCompetitionBySlug`) | `getPublishedBySlug` |
| `#3009` | T4 SPA | `pages/__tests__/competitions-page-featured.integration.test.tsx` (card navigates), `pages/__tests__/bjjeire-competition-page.integration.test.tsx` (not found and back link; three themes kept) | `config/paths.ts`, `pages/BjjEireCompetitionPage.tsx` |
| `#3009` | T6 | `bjjeire-tests` | running images |
| `#3010` | T2 IT | `registration/RegistrationIT.java` (`shouldSendStripeTheBjjEireCompetitionsFeeNeverAClientValue`) | `RegistrationServiceImpl` (return URLs), `PaymentGateway.CheckoutRequest` |
| `#3010` | T4 SPA | `pages/__tests__/sign-up-page.integration.test.tsx`, `sign-up-complete-page.integration.test.tsx`, `my-sign-ups-page.integration.test.tsx` | `config/paths.ts`, `config/features.ts` |
| `#3010` | T6 | `bjjeire-tests` (Stripe test mode) | running images |
| `#3011` | T2 IT | `registration/RegistrationIT.java` (line item; every 409 body), `StripeWebhookIT.java`, `CancellationIT.java`, `BjjEireCompetitionCancellationIT.java`, `RefundWebhookIT.java` (mail), `AdminRegistrationIT.java` (`competition-<id>-signups.csv`); one retired-name constant in `testsupport/RetiredNames.java` (SPA: `testing/retired-name.ts`) | `RegistrationMails`, `StripePaymentGateway`, `BjjEireCompetitionRegistrationAdminController` |
| `#3011` | T3 SPA | `config/__tests__/ui-content-retired-name.unit.test.ts` | `config/content/*.ts`, `config/paths.ts` |
| `#3011` | T4 SPA | `pages/__tests__/profile-page.integration.test.tsx` ("Competitions entered"), `admin-bjjeire-competition-sign-ups.integration.test.tsx` (CSV file name) | `features/competitor/components/medal-history.tsx`, `features/bjjeire-competition-admin/components/admin-sign-ups.tsx` |
| `#3011` | T6 | `bjjeire-tests` (pages and mail along the journey) | running images |
| `#3012` | T2 IT | `registration/RegistrationIT.java` (`shouldTellTheCompetitorTheBjjEireCompetitionIsFullAndNotCharge`) | `ProblemTypes.COMPETITION_FULL` |
| `#3012` | T3 SPA | `features/registrations/utils/__tests__/registration-problem.unit.test.ts` | `config/content/registrations.ts` |
| `#3013` | T2 IT | `bjjeirecompetition/BjjEireCompetitionAdminIT.java`, `config/BjjEireCompetitionRouteAuthorizationIT.java`, `registration/AdminRegistrationIT.java` | `BjjEireCompetitionAdminController`, `BjjEireCompetitionRegistrationAdminController` |
| `#3013` | T4 SPA | `pages/__tests__/admin-bjjeire-competitions-page.integration.test.tsx`, `admin-bjjeire-competition-page.integration.test.tsx`, `admin-bjjeire-competition-sign-ups.integration.test.tsx` | `features/bjjeire-competition-admin/`, `pages/AdminBjjEireCompetition*Page.tsx` |
| `#3013` | T6 | `bjjeire-tests` (local organiser sign-in) | running images |
| `#3014` | T1 unit | `web/BjjEireCompetitionFeatureGateFilterTest.java` | `web/BjjEireCompetitionFeatureGateFilter` |
| `#3014` | T2 IT | `config/BjjEireCompetitionFeatureOffIT.java` | `config/SecurityConfig` |
| `#3014` | T3/T4 SPA | `components/layout/__tests__/navigation.unit.test.tsx`, `__tests__/app-routes.integration.test.tsx`, `pages/__tests__/competitions-page-featured.integration.test.tsx` (flag off: no request) | `config/features.ts`, `hooks/useUpcomingBjjEireCompetitions.ts` |
| `#3014` | T6 | `bjjeire-tests` (flag on only; off is proven below T6) | running images |
| `#3015` | T3 SPA | `components/layout/__tests__/use-nav-items.unit.test.tsx` (every combination), `features/feature-flags/__tests__/client.unit.test.ts` | `components/layout/navigation/use-nav-items.ts` |
| `#3015` | T4 SPA | `__tests__/app-routes.integration.test.tsx` (`Competitions` off, `BjjEireCompetitions` on) | `config/features.ts` (`featureSubRoutes`) |
| `#3016` | T2 IT | `bjjeirecompetition/BjjEireCompetitionMongoRepositoryIT.java` (`shouldAnswerAtTheOldRoutesAsAtAnAddressThatNeverExisted`) | no mapping; `SecurityConfig` catch-all |
| `#3016` | T3/T4 SPA | `components/layout/navigation/__tests__/route-prefetch.unit.test.ts`, `__tests__/app-routes.integration.test.tsx` (retired addresses built from `testing/retired-name.ts`; Gyms is the default page, so a redirect to Competitions fails) | `App.tsx` `*` route |
| `#3016` | T6 | `bjjeire-tests` | running images |
| `#3017` | T2 IT | `config/LegacyCollectionDropIT.java`, `seeder/SeederIT.java` (`shouldSeedBjjEireCompetitionsOnlyFromTheTestDataset`, `shouldLeaveBjjEireCompetitionsAloneWhenPruningOutsideTheTestDataset`) | `MongoIndexInitializer.dropLegacyCollections`, `SeederCollection` |

## BJJ Éire competitions — `#5001`–`#5042`

Paths below are relative to `src/bjjeire-api/src/test/java/com/bjjeire/api/`
(API) or `src/bjjeire-app/src/` (SPA) unless they start with a repository name.

## Slice 6 — Phase 9, polish and verification

Every issue `#5001`–`#5042` has at least one row below T6 in the slices that follow,
except `#5011` (password reset). Like the hosted parts of `#5006` and `#5010`, it
happens on the competitor tenant's pages. It stays `UNTESTED` until that tenant
exists (T001) and `bjjeire-tests` runs against it.

Supporting tests with no requirement issue (T107, signals for FR-018, FR-024, FR-027,
FR-030 and SC-004/SC-005): `registration/RegistrationMetricsIT.java`
(`shouldCountASignUpStartedAndConfirmed`, `shouldCountASignUpWhoseCheckoutExpiredOnce`,
`shouldCountARefundRequestedAndSucceeded`, `shouldCountAPendingRefundAsSucceededOnlyWhenStripeReportsIt`,
`shouldCountARefundStripeRefused`, `shouldCountARejectedWebhookByReason`,
`shouldCountALatePaymentConfirmedWithAFreePlace`, `shouldCountEveryAttemptToRefundALatePaymentAndTheOneSuccess`
(attempt counters count each Stripe retry, outcome counters once), `shouldCountASignedEventWithNoIdOrTypeAsMalformed`,
`shouldCountTheHoldsEndedWhenACompetitionIsCancelled`);
`registration/StripeConfigurationTest.java` (`shouldRefuseEveryWebhookWhileTheSigningSecretIsAPlaceholder`
counts `reason="unconfigured"`). Implementation: `registration/RegistrationMetrics`, called from
`RegistrationServiceImpl`, `CancellationServiceImpl` and `StripeWebhookServiceImpl`. Alert rules
and the switch-on order: `docs/registration-operations.md`.

`web/OperationalEndpointIT.java` (`shouldServeEveryMeterToAnAnonymousScraperOnTheMetricsPort`,
`shouldNotServeMetricsOnTheApiPortThatThePublicRouteReaches`, `shouldNotServeMetricsOnTheApiPortHoweverThePathIsWritten`
(`/%6detrics` and other spellings), `shouldRefuseAWriteRouteOnTheMetricsPortBeforeAuthentication`,
`shouldServeOnlyMetricsOnTheMetricsPort`) → `web/OperationalEndpointController.metrics` (checks the port, not the path;
hidden from OpenAPI), `config/MetricsPortConfig`. `/metrics` served an empty page (the scrape
was asked for an empty set of names), so no API meter reached Prometheus. Fixed with this slice, and moved to its own
port (9464, owner's decision 2026-11-17), because the public route forwards every path on the API host. Needs the
`bjjeire-deploy` chart to declare a container and Service port `metrics`; `bjjeire-gitops` already points the
ServiceMonitor and pod annotation at it.

### Known limits (slice 6)

- `RegistrationServiceImpl.recordFailedRefund` overwrites the refund of an `EXPIRED` sign-up whatever its status.
  A late-payment refund the organiser's retry already completed can be set back to `FAILED` by a later Stripe
  retry of the checkout event. The organiser's next retry is then refused by Stripe (already refunded), counts
  `refund_failures` and logs a false `ALERT`. Because that failed record has no `refundId`, a late `refund.updated`
  for the original refund is accepted again: a second `refund_succeeded` and a second "refund completed" mail.
  Nobody is refunded twice. Not fixed here (`spec-verifier`, rounds 2 and 3).
- The featured card shows the whole logo (`object-contain`) after `qa-subagent` found the wordmark cropped at
  375, 600–639 and 1023 px. jsdom does no layout, so no automated test covers the crop.

- The `PrometheusRule` in `docs/registration-operations.md` is not deployed. It goes into
  `bjjeire-gitops` with the cluster wiring (T109), once the API is scraped.
- T110 (500 sign-ups, 200 readers) and T112 (quickstart in a preview with Stripe test mode)
  need a preview environment and have not been run.

## Slice 5 — User Story 5, results, leaderboard and team points

| Issue | Layer | Test path | Implementation path |
|---|---|---|---|
| `#5028` | T1 unit | `bjjeirecompetition/LeaderboardsTest.java` (`shouldListPodiumsInTheCompetitionsDivisionOrder`) | `bjjeirecompetition/Leaderboards.calculate` |
| `#5028` | T2 IT | `bjjeirecompetition/DivisionResultIT.java` (`shouldRecordGoldSilverAndTwoBronzesFromTheDivisionsConfirmedCompetitors`, `shouldRecordAGoldAlone`, `shouldRefuseAMedallistWhoIsNotConfirmedInThatDivision`, `shouldRefuseTheSameCompetitorTwice`, `shouldRefuseMoreThanTwoBronzesOrNoGold`, `shouldListEachDivisionsConfirmedCompetitorsAndResultForTheOrganiser`) | `BjjEireCompetitionResultController`, `ResultServiceImpl.record`, `ResultServiceImpl.getForAdmin`, `MongoDivisionSignUps.confirmed` |
| `#5028` | T2 IT | `bjjeirecompetition/LeaderboardIT.java` (`shouldShowPodiumsAndBothRankingsToAVisitor`) | `ResultServiceImpl.getLeaderboard`, `MongoDivisionSignUps.byIds` |
| `#5028` | T2 IT | `registration/ResultRecordedIT.java` (`shouldRefuseTheMedallistsOwnCancellationAndDivisionChange`, `shouldRefuseTheOrganisersMoveAndCancelOfAMedallist`) (FR-026) | `RegistrationSupport.refuseIfMedallist`, `ResultService.isNamedInResult` |
| `#5028` | T1 unit | `bjjeirecompetition/ResultServiceImplTest.java` (`shouldUndoTheResultWhenAMedallistWasCancelledWhileItWasBeingWritten`, `shouldRetryTheUndoWhenAnotherSaveChangedTheCompetitionMeanwhile`, `shouldLeaveANewerResultAloneWhenTheUndoFindsItReplaced`); `registration/RegistrationSupportTest.java` (`shouldMoveTheSignUpBackWhenAResultNamedItWhileItWasMoving`, `shouldRestoreTheSignUpWhenAResultNamedItWhileItWasBeingCancelled`, `shouldKeepACancellationNoResultNames`) (the race, FR-026) | `ResultServiceImpl.record` (check after write), `ResultServiceImpl.undoResult` (retried against a fresh read), `RegistrationSupport.move`, `RegistrationSupport.undoCancellationIfMedallist`, `CancellationServiceImpl.cancel` |
| `#5028` | T0 Pact | `contracts/pact/bjjeire-competition.pact.test.ts` (`GET /{id}/leaderboard`); provider state `a finished competition with a recorded podium` in `web/PactProviderVerificationIT.java` | `features/bjjeire-competitions/api/get-bjjeire-competitions.ts` |
| `#5028` | T4 SPA | `pages/__tests__/admin-bjjeire-competition-results.integration.test.tsx` (record by sign-up id; only confirmed competitors offered; duplicate and missing gold blocked; API refusal shown; no form without competitors; no tab on a draft) | `features/bjjeire-competition-admin/components/division-results.tsx`, `utils/division-result-form.ts` |
| `#5028` | T3 SPA | `features/bjjeire-competition-admin/utils/__tests__/division-result-form.unit.test.ts` | `utils/division-result-form.ts` |
| `#5028` | T4 SPA | `pages/__tests__/bjjeire-competition-leaderboard.integration.test.tsx` (podium with gold, silver and two bronzes) | `features/bjjeire-competitions/components/bjjeire-competition-leaderboard.tsx` |
| `#5028` | T6 | `bjjeire-tests` (planned; needs seeded medallists, T079) | running images |
| `#5029` | T1 unit | `bjjeirecompetition/LeaderboardsTest.java` (`shouldAwardNinePerGoldThreePerSilverAndOnePerBronzePerAcademyAndAffiliation`, `shouldGroupAcademiesByKeyWhateverTheSpelling`) | `Leaderboards.calculate`, `Medal` |
| `#5029` | T2 IT | `bjjeirecompetition/LeaderboardIT.java` (`shouldShowPodiumsAndBothRankingsToAVisitor`, `shouldReflectATeamMergeOnTheNextRead`) | `ResultServiceImpl.getLeaderboard` |
| `#5029` | T4 SPA | `pages/__tests__/bjjeire-competition-leaderboard.integration.test.tsx` (both ranking tables) | `bjjeire-competition-leaderboard.tsx` |
| `#5029` | T6 | `bjjeire-tests` (planned) | running images |
| `#5030` | T1 unit | `bjjeirecompetition/LeaderboardsTest.java` (`shouldBreakTiesOnGoldsThenSilversThenBronzes`, `shouldRankSilversAheadOfBronzesWhenPointsAndGoldsAreLevel`, `shouldNameJointWinnersWhenLevelOnEveryTieBreak` for shared ranks) | `Leaderboards.RANKING`, `Leaderboards.rank` |
| `#5031` | T1 unit | `bjjeirecompetition/LeaderboardsTest.java` (`shouldShowAMedallistWithNoAcademyOrAffiliationOnThePodiumOnly`) | `Leaderboards.award` |
| `#5031` | T4 SPA | `pages/__tests__/bjjeire-competition-leaderboard.integration.test.tsx` ("No academy" on the podium, in the `#5028` podium test) | `bjjeire-competition-leaderboard.tsx` |
| `#5032` | T1 unit | `bjjeirecompetition/LeaderboardsTest.java` (`shouldAwardNoPointsInADivisionWithOneConfirmedCompetitor`) | `Leaderboards.MINIMUM_FOR_POINTS` |
| `#5032` | T2 IT | `bjjeirecompetition/LeaderboardIT.java` (`shouldAwardNoPointsWhenTheResultIsRecordedWithOneConfirmedCompetitor`, `shouldKeepPointsWhenACompetitorCancelsAfterTheResultWasRecorded`, `shouldKeepPointsWhenACompetitorIsMovedAfterTheResultWasRecorded`); `DivisionResultIT.java` (stored `confirmedCompetitors`) | `DivisionResult.confirmedCompetitors`, `ResultServiceImpl.record`, `Leaderboards.calculate` |
| `#5032` | T4 SPA | `pages/__tests__/bjjeire-competition-leaderboard.integration.test.tsx` (no-points note) | `bjjeire-competition-leaderboard.tsx` |
| `#5033` | T2 IT | `bjjeirecompetition/DivisionResultIT.java` (`shouldReplaceARecordedResultWhenTheOrganiserCorrectsIt`, `shouldClearAResult`, `shouldKeepAResultWhenTheOrganiserSavesTheCompetitionDetails`) | `ResultServiceImpl.record`, `ResultServiceImpl.clear`, `BjjEireCompetitionServiceImpl.mergeDivisions` |
| `#5033` | T2 IT | `bjjeirecompetition/LeaderboardIT.java` (`shouldReflectACorrectionOnTheNextRead`, `shouldCountTheCompetitorsAgainWhenTheOrganiserCorrectsTheResult`); `registration/ResultRecordedIT.java` (`shouldAllowCancellingOnceTheResultNoLongerNamesTheSignUp`) | cache eviction in `ResultServiceImpl` |
| `#5033` | T4 SPA | `pages/__tests__/admin-bjjeire-competition-results.integration.test.tsx` (recorded podium filled in, corrected, cleared) | `division-results.tsx` |
| `#5034` | T1 unit | `bjjeirecompetition/LeaderboardsTest.java` (`shouldBeEmptyWithNoResults`) | `Leaderboards.calculate` |
| `#5034` | T2 IT | `bjjeirecompetition/LeaderboardIT.java` (`shouldServeEmptyPodiumsAndRankingsBeforeAnyResult`, `shouldNotServeTheLeaderboardOfADraftOrAnUnknownCompetition`, `shouldNotServeTheLeaderboardOfACancelledCompetition`) | `ResultServiceImpl.getLeaderboard` (`WITH_LEADERBOARD`) |
| `#5034` | T4 SPA | `pages/__tests__/bjjeire-competition-leaderboard.integration.test.tsx` (empty-state message) | `bjjeire-competition-leaderboard.tsx` |
| `#5034` | T6 | `bjjeire-tests` (planned) | running images |
| `#5035` | T2 IT | `bjjeirecompetition/DivisionResultIT.java` (`shouldRefuseCompetitorsAndAnonymousCallers`: record, clear, finish and the admin result list for competitor, reader and anonymous callers) | `config/SecurityConfig` (writer catch-all; `/admin/**`) |
| `#5039` | T2 IT | `competitor/CompetitorHistoryIT.java` (`shouldTotalTheCallersMedalsAndListEachCompetitionEnteredLatestFirst`, `shouldBeEmptyForACompetitorWithNoProfileOrNoSignUp`) | `CompetitorServiceImpl.getOwnHistory`, `ResultService.medalsFor` |
| `#5039` | T6 | `bjjeire-tests` (planned; needs seeded medallists, T079) | running images |
| `#5040` | T1 unit | `bjjeirecompetition/LeaderboardsTest.java` (`shouldAwardNinePerGoldThreePerSilverAndOnePerBronzePerAcademyAndAffiliation`) | `Leaderboards.award` (affiliation key) |
| `#5040` | T2 IT | `bjjeirecompetition/LeaderboardIT.java` (`shouldShowPodiumsAndBothRankingsToAVisitor`) | `ResultServiceImpl.getLeaderboard` |
| `#5040` | T4 SPA | `pages/__tests__/bjjeire-competition-leaderboard.integration.test.tsx` (affiliation table) | `bjjeire-competition-leaderboard.tsx` |
| `#5040` | T6 | `bjjeire-tests` (planned) | running images |
| `#5041` | T1 unit | `bjjeirecompetition/LeaderboardsTest.java` (`shouldNameWinnersOnlyOnceTheCompetitionIsFinished`, `shouldNameJointWinnersWhenLevelOnEveryTieBreak`) | `Leaderboards.top` |
| `#5041` | T2 IT | `bjjeirecompetition/DivisionResultIT.java` (`shouldFinishAPublishedCompetitionAndStillAllowCorrections`, `shouldRefuseToFinishADraftOrCancelledCompetition`); `bjjeirecompetition/LeaderboardIT.java` (`shouldNameTheWinnersOnceTheCompetitionIsFinished`) | `BjjEireCompetitionAdminController.finishBjjEireCompetition`, `BjjEireCompetitionServiceImpl.finish` |
| `#5041` | T0 Pact | `contracts/pact/bjjeire-competition.pact.test.ts` (`winners` on a finished competition) | `get-bjjeire-competitions.ts` |
| `#5041` | T4 SPA | `pages/__tests__/admin-bjjeire-competition-results.integration.test.tsx` (finish after warning; keep; corrections after finishing); `pages/__tests__/bjjeire-competition-leaderboard.integration.test.tsx` (winners, joint winners, none before finishing) | `features/bjjeire-competition-admin/components/bjjeire-competition-finish-action.tsx`, `bjjeire-competition-leaderboard.tsx` |
| `#5041` | T6 | `bjjeire-tests` (planned) | running images |

`#5012` (slice 2) gained `competitor/CompetitorDeletionIT.java` (`shouldDeleteAMedallistOnceTheirCompetitionHasFinishedAndKeepTheMedal`, `shouldStillRefuseWhileTheCompetitionOfAConfirmedSignUpIsPublished`) → `CompetitorServiceImpl.hasActiveRegistration`: a medallist could otherwise never delete their account, since FR-026 stops them cancelling.

`#5012` also gained `CompetitorDeletionIT.shouldDeleteTwoMedallistsOfTheSameFinishedDivision` → `registration/RegistrationAnonymiser` (unsets `active` with the link, so two anonymised sign-ups in one division do not collide on `ux_registration_active_competitor_division`).

Test seed (T079): `seeder/SeederIT.java` (`shouldSeedAFinishedCompetitionWithMedallistsAndAProfileFromTheTestDataset`, `shouldServeTheSeededFinishedCompetitionsLeaderboardAndWinners`, `shouldKeepSignUpsAndProfilesCreatedThroughTheApiWhenPruningTheTestDataset`, `shouldValidateTestRegistrationAndCompetitorFilesStrictlyAgainstTheJavaDomain`) → `seeder/SeederCollection` (`prunable`), `SeederRunner`, `SeederJson`, `seeder/data-test/{bjjeire-competitions/acceptance-finished.json,bjjeire-competition-registrations/,competitors/}`. It gives the T6 scenarios for `#5028`, `#5029`, `#5039`, `#5040` and `#5041` their data.

Supporting tests with no requirement issue: `bjjeirecompetition/LeaderboardIT.java`
(`shouldCarryNoPrivateFieldInThePublicJson`: FR-011, no sign-up or competitor id;
`shouldKeepADeletedCompetitorsMedalAndPointsUnderThePlaceholderName`: research R11).
`lib/admin-auth.ts` now imports MSAL once per page load: three admin reads sent at once made
Vitest resolve one of the concurrent dynamic imports to the global MSAL mock, which
`pages/__tests__/admin-bjjeire-competition-sign-ups.integration.test.tsx` caught.

### Known limits (slice 5)

- A result and a cancellation or move racing each other are resolved by a check after each write, not by one transaction: in the instant between a write and its undo, a reader can see the losing write. An undo refused three times in a row by other organiser saves is logged as an `ALERT` for the organiser to correct by hand. The race path is proven with mocks (`ResultServiceImplTest`, `RegistrationSupportTest`); no automated test interleaves two real requests.
- Results recorded before `confirmedCompetitors` existed would count as no points. No such data exists: the feature was never switched on.
- A result on a competition that is later cancelled stays stored; the leaderboard of a cancelled competition answers 404.
- The seeded finished competition (`acceptance-finished`) is fixed: a T6 scenario that records or corrects a podium must create its own competition, never edit the seed.

## Slice 4 — User Story 4, cancellation, refunds, division change and organiser sign-up tools

| Issue | Layer | Test path | Implementation path |
|---|---|---|---|
| `#5022` | T2 IT | `registration/CancellationIT.java` (`shouldRefundTheFullFeeReleaseThePlaceAndRemoveTheCompetitorFromTheListWhenRegistrationIsOpen`, `shouldRecordTheRefundAsDoneWhenStripeReportsItSucceededAtOnce`, `shouldChangeNothingWhenTheSameSignUpIsCancelledTwice`, `shouldKeepTheCancellationAndShowTheRefundAsPendingWhenStripeRefusesIt`, `shouldRecordTheRefundAsFailedAndAlertWhenNoPaymentIdWasRecorded`, `shouldRefuseToCancelAnotherCompetitorsSignUp`, `shouldRefuseToCancelAnUnpaidSignUpWhichEndsWithItsHold`) | `RegistrationController.cancelRegistration`, `CancellationServiceImpl.cancelOwn`, `PaymentGateway.refund` |
| `#5022` | T2 IT | `registration/RefundWebhookIT.java` (`shouldMarkThePendingRefundRefundedAndMailTheCompetitorWhenStripeReportsItSucceeded`, `shouldChangeNothingAndSendNoSecondMailWhenTheRefundEventArrivesAgain`, `shouldIgnoreARefundEventForAnotherRefundOfTheSameSignUp`, `shouldLeaveARefundPendingWhileStripeStillReportsItPending`, `shouldRecordAFailedRefundRaiseTheAlertAndShowTheCompetitorRefundPending`) | `StripeWebhookServiceImpl` (`refund.*`), `CancellationServiceImpl.onRefundUpdated` |
| `#5022` | T0 Pact | `contracts/pact/registration.pact.test.ts` (`POST /registration/{id}/cancel`); provider state `a competitor with a confirmed sign-up and another division open` in `web/PactProviderVerificationIT.java` | `features/registrations/api/registration-api.ts` |
| `#5022` | T4 SPA | `pages/__tests__/my-sign-ups-page.integration.test.tsx` (refund warning with amount, confirm, outcome, status reloads; keep sends nothing; no action on unpaid or cancelled) | `features/registrations/components/registration-actions.tsx`, `utils/cancellation-message.ts`, `hooks/useRegistrationChanges.ts` |
| `#5022` | T6 | `bjjeire-tests` (planned; Stripe test mode) | running images |
| `#5023` | T2 IT | `registration/CancellationIT.java` (`shouldCancelWithoutARefundOnceRegistrationHasClosed`, `shouldTellTheCompetitorUntilWhenACancellationIsRefunded`) | `CancellationServiceImpl.cancelOwn`, `RegistrationDto.refundableUntil` |
| `#5023` | T4 SPA | `pages/__tests__/my-sign-ups-page.integration.test.tsx` (no-refund warning before confirming) | `utils/cancellation-message.ts` |
| `#5023` | T6 | `bjjeire-tests` (planned) | running images |
| `#5024` | T2 IT | `registration/ChangeDivisionIT.java` (`shouldMoveTheSignUpToAnEligibleDivisionWithoutChargingOrTakingAnotherPlace`, `shouldRefuseADivisionTheCompetitorIsNotEligibleFor`, `shouldRefuseADivisionTheCompetitorAlreadyHolds`, `shouldRefuseADivisionTheBjjEireCompetitionDoesNotHaveAndAnotherCompetitorsSignUp`, `shouldRefuseToMoveAnUnpaidSignUp`) | `RegistrationController.changeRegistrationDivision`, `RegistrationServiceImpl.changeOwnDivision`, `RegistrationSupport.move` |
| `#5024` | T0 Pact | `contracts/pact/registration.pact.test.ts` (`PUT /registration/{id}/division`) | `features/registrations/api/registration-api.ts` |
| `#5024` | T4 SPA | `pages/__tests__/my-sign-ups-page.integration.test.tsx` (eligible divisions only, current one left out; move sent; list reloads) | `features/registrations/components/registration-actions.tsx` |
| `#5024` | T6 | `bjjeire-tests` (planned) | running images |
| `#5025` | T2 IT | `registration/ChangeDivisionIT.java` (`shouldRefuseToChangeDivisionOnceRegistrationHasClosed`) | `ProblemTypes.REGISTRATION_CLOSED` |
| `#5025` | T4 SPA | `pages/__tests__/my-sign-ups-page.integration.test.tsx` (closed: no control, contact-the-organiser note; `registration-closed` refusal message) | `config/content/registrations.ts` |
| `#5026` | T2 IT | `registration/BjjEireCompetitionCancellationIT.java` (`shouldRefundEveryConfirmedSignUpInFullAndMailEachCompetitor`, `shouldRetryOnlyTheRefundsThatFailedWhenTheCancellationIsRunAgain`, `shouldAskStripeForANewRefundWhenOneItReportedFailedIsRetried`, `shouldAskStripeForANewRefundWhenALatePaymentRefundItReportedFailedIsRetried`, `shouldAlsoRetryAFailedRefundOfASignUpCancelledBeforeTheBjjEireCompetition`, `shouldEndUnpaidHoldsSoALatePaymentIsRefundedNotConfirmed`, `shouldRefuseCompetitorsAndVisitorsAndAFinishedBjjEireCompetition`; the fake gateway replays a reused key as Stripe does) | `BjjEireCompetitionRegistrationAdminController.cancelBjjEireCompetition`, `CancellationServiceImpl.cancelBjjEireCompetition`, `BjjEireCompetitionServiceImpl.cancel`, `RegistrationServiceImpl.endHolds` |
| `#5026` | T4 SPA | `pages/__tests__/admin-bjjeire-competition-sign-ups.integration.test.tsx` (`AdminBjjEireCompetitionPage: cancel the competition`) | `features/bjjeire-competition-admin/components/bjjeire-competition-cancel-action.tsx` |
| `#5027` | T2 IT | `registration/CancellationIT.java` (`shouldSendOneMailStatingTheRefundOutcome`), `RefundWebhookIT` (refund completed mail once) | `RegistrationMails.cancelled`, `refundCompleted`, `bjjEireCompetitionCancelled` |

Supporting tests for the organiser tools and retention (FR-006, FR-007, FR-013; no
visitor-facing requirement issue): `registration/AdminRegistrationIT.java`
(`shouldListEverySignUpWithExactlyTheAdminFields`, `shouldFlagAPaymentStripeTookThatNoWebhookConfirmed`,
`shouldExportEveryRowAsCsvWithTheSameColumns`, `shouldNotLetASpreadsheetRunAFormulaFromACompetitorsName`,
`shouldLetTheOrganiserMoveASignUpAfterRegistrationHasClosedWithoutAnEligibilityCheck`,
`shouldCancelWithOrWithoutARefundAsTheOrganiserChooses`, `shouldRefuseASignUpFromAnotherBjjEireCompetition`,
`shouldMergeTeamNamesWithinOneBjjEireCompetitionOnly`, `shouldRefuseEveryAdminSignUpToolToCompetitorsAndVisitors`);
`registration/FinancialRetentionIT.java` (`shouldAnonymiseTheSignUpsAndKeepTheirPaymentRecordsForSixYears`,
`shouldRemovePaymentAndRefundOnlyFromSignUpsPastTheirRetention`, tagged `#5012`);
`pages/__tests__/admin-bjjeire-competition-sign-ups.integration.test.tsx` (`AdminBjjEireCompetitionPage: sign-ups`: list
with private details and flags, empty, CSV export with the token, move, cancel without refund, merge);
`lib/__tests__/api-client.integration.test.ts` (organiser token on `/competition/{id}/registration`, none on
`/competition/{id}/competitor`). Implementation: `BjjEireCompetitionRegistrationAdminController`,
`RegistrationAdminServiceImpl`, `RegistrationCsv`, `RegistrationAnonymiser`, `FinancialRecordsSweep`,
`competitor.CompetitorAccountDeleting`, `CompetitorServiceImpl.findContacts`,
`features/bjjeire-competition-admin/components/{admin-sign-ups,sign-up-row-actions,team-merge-form}.tsx`.

### Known limits (slice 4)

- Stripe is still the recording fake in every automated test. The refund event names and the `refund` object fields (`status`, `failure_reason`, `metadata`) follow Stripe's documented API and are not yet seen from Stripe test mode. The webhook endpoint registered in Stripe must add `refund.created`, `refund.updated` and `refund.failed`.
- FR-026's "refused once a result names the sign-up" shipped with slice 5 (`ResultRecordedIT`).
- A competitor cannot cancel an unpaid sign-up; it ends when its 30-minute hold runs out (FR-041 counts it until then). Ending it early would need Stripe's session-expire call.
- The organiser's merge and the "retry failed refunds" check read the sign-ups on the page shown (100 per page).
- Failed refunds are retried only through "Retry failed refunds" on a cancelled competition. A failed refund of a single cancellation in a competition that goes ahead is resolved by hand from the `ALERT` (the sign-up list shows "Refund pending").
- A refund that failed because Stripe could not be reached may in fact have been created. Its retry uses a new key and Stripe then refuses it as already refunded, leaving it `FAILED` for the organiser to check by hand. Nobody is refunded twice.
- A profile save after a merge copies the competitor's own typed names back onto their active sign-ups (research R8 propagation), so a merge done before results can be undone by a later profile edit. Merging after registration closes, or again before results, avoids it.
- Anonymising on account deletion runs before the profile is removed. A sign-up started by the same person in the moment between that step and the revocation would keep its link to the deleted profile id.
- The CSV export shares the list's OpenAPI operation (`?format=csv`); the served document does not describe the `text/csv` response separately.

## Slice 3 — User Story 3, sign-up, payment and competitor list

| Issue | Layer | Test path | Implementation path |
|---|---|---|---|
| `#5013` | T4 SPA | `pages/__tests__/sign-up-page.integration.test.tsx` (signed out: sign-in over the page, divisions load after; incomplete profile → link to `/account/profile`) | `pages/SignUpPage`, `features/competitor/components/competitor-sign-in-gate.tsx` |
| `#5013` | T4 SPA | `pages/__tests__/bjjeire-competition-page.integration.test.tsx` (open: sign-up link; full: none) | `features/bjjeire-competitions/components/bjjeire-competition-details.tsx` |
| `#5013` | T6 | `bjjeire-tests` (planned) | running images |
| `#5014` | T1 unit | `competitor/EligibilityTest.java` (gender and belt; 40-year-old gets Adult, Master 1, Master 2; minimum-age birthday) | `competitor/Eligibility` |
| `#5014` | T2 IT | `registration/RegistrationIT.java` (`shouldOfferOnlyTheDivisionsTheCompetitorMayEnter`, `shouldRefuseADivisionForAnotherBeltOrGender`, `shouldRefuseAnOlderAgeCategoryThanTheCompetitorReaches`) | `competitor/EligibleDivisionController`, `CompetitorServiceImpl.getEligibleDivisions`, `registration/RegistrationServiceImpl.create` |
| `#5014` | T0 Pact | `contracts/pact/registration.pact.test.ts`; provider state in `web/PactProviderVerificationIT.java` | `features/registrations/api/registration-api.ts` |
| `#5014` | T4 SPA | `pages/__tests__/sign-up-page.integration.test.tsx` (only eligible divisions, fee) | `features/registrations/components/sign-up-form.tsx` |
| `#5014` | T6 | `bjjeire-tests` (planned) | running images |
| `#5015` | T2 IT | `registration/RegistrationIT.java` (`shouldTakeAPlaceAndReturnACheckoutUrlWhenASignUpStarts`, `shouldSendStripeTheBjjEireCompetitionsFeeNeverAClientValue`, `shouldKeepThePriceAlreadyPaidWhenTheOrganiserChangesTheFee`) | `RegistrationServiceImpl.create`, `StripePaymentGateway` |
| `#5015` | T2 IT | `registration/StripeWebhookIT.java` (`shouldConfirmTheSignUpAndSendOneMailWhenThePaymentSucceeds`, `shouldChangeNothingWhenTheSameEventArrivesTwice`, `shouldNotConfirmTwiceWhenStripeSendsADifferentEventForTheSamePayment`, `shouldConfirmAPaymentStartedWhileRegistrationWasOpenEvenAfterItCloses`, `shouldConfirmALatePaymentWhenAPlaceIsStillFree`, `shouldRefuseAMissingOrBadSignatureAndChangeNothing`, `shouldApplyStripesRetryWhenTheFirstDeliveryFailed`, `shouldApplyAnEventWhoseEarlierDeliveryWasRecordedButNeverFinished`, `shouldConfirmWhenADelayedPaymentSucceedsAndNotBefore`); `StripeConfigurationTest` (placeholder secrets refuse webhooks and checkout) | `StripeWebhookController`, `StripeWebhookServiceImpl`, `RegistrationServiceImpl.onCheckoutPaid`, `StripeEvent` |
| `#5015` | T2 IT | `registration/PublicCompetitorListIT.java` (confirmed only, by division; no private field in the JSON; listed straight after confirmation; draft 404) | `BjjEireCompetitionCompetitorController`, `RegistrationServiceImpl.getListedCompetitors` |
| `#5015` | T1 unit | `registration/RegistrationMailSenderTest.java` (three attempts then counted; queued after the save) | `RegistrationMailSender`, `RegistrationMails`, `SmtpMailer` |
| `#5015` | T0 Pact | `contracts/pact/registration.pact.test.ts` (create, competitor list) | `features/registrations/api/registration-api.ts` |
| `#5015` | T4 SPA | `pages/__tests__/sign-up-page.integration.test.tsx` (consents required, leaves for Checkout, non-Stripe address refused), `sign-up-complete-page.integration.test.tsx` (confirmed; waits for the webhook), `bjjeire-competition-page.integration.test.tsx` (competitor list) | `pages/SignUpPage`, `pages/SignUpCompletePage`, `features/registrations/components/bjjeire-competition-competitors.tsx`, `utils/checkout-redirect.ts` |
| `#5015` | T6 | `bjjeire-tests` (planned; Stripe test mode) | running images |
| `#5016` | T2 IT | `registration/StripeWebhookIT.java` (`shouldExpireTheSignUpAndGiveThePlaceBackWhenTheCheckoutExpires`, `shouldExpireTheSignUpWhenADelayedPaymentFails`) | `RegistrationServiceImpl.onCheckoutExpired` |
| `#5016` | T2 IT | `registration/RegistrationOwnershipIT.java` (`shouldGiveTheOwnerTheOpenCheckoutAgainWhileTheHoldLasts`, `shouldRefuseToResumeACheckoutWhoseHoldHasEnded`), `RegistrationIT.shouldGiveThePlaceBackWhenStripeCannotBeReached` | `RegistrationServiceImpl.resumeCheckout`, `create` |
| `#5016` | T2 IT | `registration/HoldSweepIT.java` (lapsed hold expired and place released once, also on parallel sweeps; confirmed and live holds untouched; waits for the Checkout margin; kept when Stripe cannot be asked, alerted once and left out a day later; a paid session is kept and alerted once; a session Stripe no longer knows is expired and the competitor can sign up again), `StripePaymentGatewayTest`, `RegistrationOwnershipIT` (`shouldTellACompetitorWhoHasAlreadyPaidThatThePaymentIsBeingConfirmedNotSendThemBack`, `shouldStillReturnTheOpenCheckoutWhenStripeCannotSayWhetherItWasPaid`), `CheckoutStatusTest` | `HoldSweep`, `RegistrationServiceImpl.expireLapsedHolds` |
| `#5016` | T4 SPA | `pages/__tests__/sign-up-page.integration.test.tsx` (back from Checkout: nothing charged, return to the same payment; hold ended), `sign-up-complete-page.integration.test.tsx` (failed → try again), `my-sign-ups-page.integration.test.tsx` (pay now; already paid → payment received) | `features/registrations/components/abandoned-checkout.tsx`, `hooks/useCheckoutRedirect.ts` |
| `#5016` | T6 | `bjjeire-tests` (planned; Stripe test mode) | running images |
| `#5017` | T2 IT | `registration/RegistrationIT.java` (`shouldRefuseASecondSignUpForTheSameDivisionWithoutCharging`, `shouldAllowANewSignUpOnceTheEarlierOneHasEnded`), `RegistrationConcurrencyIT.shouldCreateOneSignUpWhenTheSameCompetitorSubmitsTheSameDivisionManyTimesAtOnce` | `ux_registration_active_competitor_division`, `RegistrationServiceImpl.create` |
| `#5017` | T4 SPA | `pages/__tests__/sign-up-page.integration.test.tsx` (`already-registered` message) | `utils/registration-problem.ts` |
| `#5018` | T2 IT | `registration/RegistrationIT.java` (`shouldMakeGiAndNoGiTwoSignUpsWithTwoPayments`) | `RegistrationServiceImpl.create` |
| `#5019` | T1 unit | `competitor/EligibilityTest.java` (day before the 18th birthday; on the birthday; every division) | `Eligibility.isAdultOn` |
| `#5019` | T2 IT | `registration/RegistrationIT.java` (`shouldRefuseSomeoneWhoIsUnderEighteenOnTheBjjEireCompetitionDay`, `shouldExplainWhyNoDivisionIsOfferedToAnUnderEighteenOrAnIncompleteProfile`) | `CompetitorServiceImpl.underEighteen`, `RegistrationServiceImpl.create` |
| `#5019` | T4 SPA | `pages/__tests__/sign-up-page.integration.test.tsx` (under 18 explained, no division) | `pages/SignUpPage` |
| `#5019` | T6 | `bjjeire-tests` (planned) | running images |
| `#5020` | T2 IT | `registration/RegistrationIT.java` (`shouldTellTheCompetitorTheBjjEireCompetitionIsFullAndNotCharge`), `RegistrationConcurrencyIT.shouldGiveTheLastPlaceToExactlyOneOfManySimultaneousCompetitors`, `StripeWebhookIT.shouldRefundALatePaymentInFullWhenNoPlaceIsLeft`, `shouldStayOnTheRefundOnceARefundWasTriedEvenIfAPlaceComesFree` | `BjjEireCompetitionServiceImpl.takePlace`, `releasePlace`, `RegistrationServiceImpl.refundLatePayment` |
| `#5020` | T4 SPA | `pages/__tests__/sign-up-page.integration.test.tsx` (`competition-full` message on refusal and when the page opens on a full competition), `sign-up-complete-page.integration.test.tsx` (late payment refunded) | `utils/registration-problem.ts`, `pages/SignUpPage`, `pages/SignUpCompletePage` |
| `#5021` | T2 IT | `registration/RegistrationOwnershipIT.java` (`shouldListOnlyTheCallersSignUpsWithBjjEireCompetitionDivisionAmountAndStatus`, `shouldListNothingForACompetitorWithoutSignUpsOrProfile`, `shouldRefuseAnotherCompetitorsSignUpOnEveryRouteThatTakesAnId`, `shouldRefuseVisitorsAndTheOrganiser`) | `RegistrationController`, `RegistrationServiceImpl.getOwn`, `owned` |
| `#5021` | T0 Pact | `contracts/pact/registration.pact.test.ts` (`/registration/me`, `/{id}/checkout`) | `features/registrations/api/registration-api.ts` |
| `#5021` | T4 SPA | `pages/__tests__/my-sign-ups-page.integration.test.tsx` | `pages/MySignUpsPage`, `features/registrations/components/my-registrations-table.tsx` |
| `#5021` | T6 | `bjjeire-tests` (planned) | running images |
| `#5042` | T2 IT | `registration/RegistrationIT.java` (`shouldRefuseAThirdUnpaidSignUpInTheSameBjjEireCompetition`, `shouldAllowAThirdSignUpOnceOneOfTheFirstTwoIsPaid`), `RegistrationConcurrencyIT.shouldHoldAtMostTwoUnpaidSignUpsWhenOneCompetitorStartsSeveralDivisionsAtOnce` | `RegistrationServiceImpl.create`, `insertHoldingASlot`, `ux_registration_unpaid_slot` |
| `#5042` | T4 SPA | `pages/__tests__/sign-up-page.integration.test.tsx` (`too-many-unpaid` message) | `utils/registration-problem.ts` |
| `#5038` | T4 SPA | `__tests__/app-routes.integration.test.tsx` (`/competitions/:slug/signup`, `/signup/complete`, `/account/signups` redirect when off) | `config/features.ts` |

Supporting tests with no requirement issue: `registration/RegistrationStatusTest` (state machine, `active` flag, 30-minute hold), `registration/TeamKeysTest` (research R8 keys), `registration/ProfilePropagationIT` (snapshot and keys follow a profile save in running competitions; finished left alone; belt change flags `profileMismatch` and keeps the division), `registration/RegistrationIT` (`shouldRefuseWhenRegistrationIsNotOpen`, `shouldRefuseACompetitorWhoseProfileIsIncompleteOrMissing`, `shouldNeedBothConsentsBeforePaying`, `shouldRefuseAConsentThatIsNotTheBooleanTrue` — FR-012, `shouldOfferNoDivisionWhileRegistrationIsNotOpen`, `shouldAnswerABodyThatIsNotJsonWithBadRequest`, `shouldNotFindADraftBjjEireCompetitionOrAnUnknownDivision`), `StripeWebhookIT` (`shouldAcknowledgeEventTypesItDoesNotHandle`, `shouldAnswerAMethodTheWebhookDoesNotHaveWithMethodNotAllowed`, `shouldAcknowledgeAPaymentForASignUpItDoesNotKnow`, `shouldLeaveACancelledBjjEireCompetitionsSignUpForTheOrganiserWhenAPlaceCannotBeRetaken`), `features/registrations/utils/__tests__/registration-problem.unit.test.ts`, `checkout-redirect.unit.test.ts`, `types/registrations.contract.ts` (handwritten types against the served schema).

### Known limits (slice 3)

- Stripe is a recording fake in every automated test here; the SDK call shape (`StripePaymentGateway`) is not exercised against Stripe test mode until the owner supplies test keys (T001) and `bjjeire-tests` runs the T6 scenarios. Signature verification is the real SDK code against HMAC-signed payloads.
- A late payment refunded for want of a place records refund `REFUNDED` when Stripe reports it succeeded at once, otherwise `PENDING`; the refund webhooks (slice 4) complete it.
- No test seed of sign-ups yet (T079): the test-dataset prune would remove sign-ups acceptance runs create, and `placesTaken` would drift. Slice 5 adds it with medallists.
- Mail is plain text and asynchronous without an outbox (research R6): a crash between the save and the send loses that mail.
- A late refund that Stripe keeps refusing is recorded (payment `PAID`, refund `FAILED`), counted in `registration.refund.failures` and logged as `ALERT`; the alert rule itself and the organiser's view of it come with slice 4 (T107).

## Slice 2 — User Story 2, competitor account and profile

| Issue | Layer | Test path | Implementation path |
|---|---|---|---|
| `#5006` | T4 SPA | `pages/__tests__/profile-page.integration.test.tsx` (signed out: sign-in offered, no profile request; sign-in through the competitor popup loads the profile on the same page) | `features/competitor/components/competitor-sign-in-gate.tsx`, `lib/competitor-auth.ts` |
| `#5006` | T4 SPA | `lib/__tests__/api-client-competitor.integration.test.ts` (`competitor auth with the competitor tenant`) | `lib/competitor-auth.ts`, `lib/competitor-msal-config.ts` |
| `#5006` | T6 | `bjjeire-tests` (planned; hosted pages, needs the competitor tenant, T001) | competitor tenant |
| `#5007` | T1 unit | `competitor/SaveCompetitorCommandTest.java` (`shouldAcceptAFullProfile`, `shouldRequireFirstNameLastNameAndDateOfBirth`, `shouldLimitNamesToSixtyCharactersAndTeamsToEighty`, `shouldRequireAnIsoAlpha2Nationality`, `shouldRequireADateOfBirthInThePast`, `shouldCallAProfileCompleteOnlyWithNamesNationalityDateOfBirthGenderAndBelt`) | `SaveCompetitorCommand`, `IsoCountry`, `Competitor.isProfileComplete` |
| `#5007` | T2 IT | `competitor/CompetitorIT.java` (`shouldShowAnEmptyUnsavedProfileBeforeTheFirstSave`, `shouldShowASavedProfileBackToTheCompetitor`, `shouldKeepTheProfileKeyedByIssuerAndSubjectAndAuditEachSave`, `shouldReportAnIncompleteProfileThatCannotSignUpYet`) | `CompetitorController`, `CompetitorServiceImpl.saveOwn`, `getOwn` |
| `#5007` | T2 IT | `web/OpenApiContractIT.java` (`shouldPublishTheCompetitorProfileRoutesWithTheirRealResponses`) | `CompetitorController` (`@ApiResponse`) |
| `#5007` | T0 Pact | `contracts/pact/competitor.pact.test.ts`; provider states in `web/PactProviderVerificationIT.java` | `features/competitor/api/competitor-api.ts` |
| `#5007` | T3 SPA | `features/competitor/utils/__tests__/problem-message.unit.test.ts` (validation messages named by field) | `features/competitor/utils/problem-message.ts` |
| `#5007` | T3 SPA | `features/competitor/utils/__tests__/profile-form.unit.test.ts` | `features/competitor/utils/profile-form.ts` |
| `#5007` | T4 SPA | `pages/__tests__/profile-page.integration.test.tsx` (create and save; empty form errors; incomplete-profile notice) | `pages/ProfilePage`, `features/competitor/components/profile-form.tsx` |
| `#5008` | T1 unit | `competitor/SaveCompetitorCommandTest.java` (`shouldAcceptNoAcademyAndNoAffiliation`, `shouldNeedAnAcademyNameOrADirectoryGym`) | `SaveCompetitorCommand.AcademyChoice`, `NameOrGym` |
| `#5008` | T2 IT | `competitor/CompetitorIT.java` (`shouldTakeTheAcademyNameFromTheDirectoryGym`, `shouldRefuseAGymThatIsNotInTheDirectory`, `shouldAcceptATypedAcademyNameOrNoAcademyAndAnOptionalAffiliation`, `shouldRefuseAGymThatIsNotPublicInTheDirectory`, `shouldKeepAChosenGymThatHasSinceLeftTheDirectory`) | `CompetitorServiceImpl.resolveAcademy` (active gyms only; a kept gym stays) |
| `#5008` | T3 SPA | `features/competitor/utils/__tests__/profile-form.unit.test.ts` (academy modes) | `features/competitor/utils/profile-form.ts` |
| `#5008` | T4 SPA | `pages/__tests__/profile-page.integration.test.tsx` (search and pick a directory gym; no academy and empty affiliation) | `features/competitor/components/academy-picker.tsx` |
| `#5009` | T2 IT | `competitor/CompetitorPrivacyIT.java` (`shouldNeverShowOneCompetitorAnotherCompetitorsProfile`, `shouldNeverLetOneCompetitorChangeOrDeleteAnotherCompetitorsProfile`, `shouldRefuseVisitorsAndTheOrganiser`, `shouldOfferNoRouteThatNamesACompetitor`) | `CompetitorController` (caller from the token only), `config/SecurityConfig` |
| `#5009` | T2 IT | `config/BjjEireCompetitionRouteAuthorizationIT.java` (`shouldReserveCompetitorRoutesForSignedInCompetitors`) | `config/SecurityConfig` |
| `#5010` | T2 IT | `competitor/CompetitorIT.java` (`shouldNeverCreateTwoProfilesForOneIdentity`) | `ix_competitor_issuer_subject_unique`, `CompetitorServiceImpl.saveOwn` (upsert, one retry) |
| `#5010` | T6 | `bjjeire-tests` (planned; hosted pages, needs T001) | competitor tenant |
| `#5011` | T6 | `bjjeire-tests` (planned; hosted pages, needs T001) | competitor tenant |
| `#5012` | T2 IT | `competitor/CompetitorDeletionIT.java` (`shouldRemoveThePersonalDetailsAndTheSignInIdentity`, `shouldRefuseTheDeletedIdentityFromThenOn`, `shouldStillDeleteTheAccountWhenTheDirectoryCannotBeReached`, `shouldDeleteTheIdentityOfSomeoneWhoNeverSavedAProfile`, `shouldRefuseWhileTheCompetitorHasAnActiveSignUp`, `shouldRefuseWhenTheActiveSignUpStoresTheCompetitorAsAnObjectId`, `shouldAllowDeletionWhenEverySignUpHasEnded`, `shouldLetThePersonSignUpAgainWithTheSameEmailAfterDeleting`, `shouldDeleteTheNewAccountTooWhenThePersonDeletesAgain`) | `CompetitorServiceImpl.deleteOwn`, `DeletedCompetitor`, `MongoRevokedCompetitors` |
| `#5012` | T1 unit | `competitor/CompetitorServiceTest.java` (`shouldRemoveAProfileSavedWhileTheAccountWasBeingDeleted`, `shouldRefuseRatherThanFailWhenTheProfileVanishedAfterTheSave`, `shouldRemoveByIdentityAfterRevokingSoARacingFirstSaveIsNotLeftBehind`) | `CompetitorServiceImpl.saveOwn` (revoked check after the upsert), `deleteOwn` (remove by identity after revoking) |
| `#5012` | T1 unit | `config/RevocationCheckingJwtDecoderTest.java` (incl. `shouldAcceptATokenIssuedAfterTheDeletion`), `competitor/GraphIdentityDirectoryTest.java` | `config/RevocationCheckingJwtDecoder`, `GraphIdentityDirectory` |
| `#5012` | T4 SPA | `pages/__tests__/profile-page.integration.test.tsx` (confirm then delete and sign out; active sign-up message) | `features/competitor/components/account-actions.tsx` |
| `#5039` | T2 IT | `competitor/CompetitorDeletionIT.java` (`shouldShowEmptyMedalHistoryUntilResultsAreRecorded`) | `CompetitorServiceImpl.getOwnHistory` (see slice 5 for medals) |
| `#5039` | T4 SPA | `pages/__tests__/profile-page.integration.test.tsx` (totals and rows; empty state) | `features/competitor/components/medal-history.tsx` |

Supporting tests with no requirement issue: `config/LocalSignInTokensTest` (`shouldIssueACompetitorTokenThatTheLocalDecoderAccepts`, `shouldGiveTheSameEmailTheSameLocalCompetitor`), `config/RoutingJwtDecoderTest` (`shouldSendLocalCompetitorTokensToTheLocalDecoderOnlyWhenLocalSignInIsConfigured`), `config/IssuerAwareAuthoritiesConverterTest` (`shouldTreatEveryConfiguredCompetitorIssuerTheSameWay`), `config/LocalSignInIT` (`shouldLetALocalCompetitorKeepAProfile`, `shouldNeverTreatALocalCompetitorAsAnOrganiser`, `shouldRefuseALocalCompetitorSignInWithoutAValidEmail`, `shouldLetALocalCompetitorSignUpAgainWithTheSameEmailAfterDeleting`), `config/BjjEireCompetitionRouteAuthorizationIT.shouldOfferNoLocalSignInOutsideLocalDevelopment` (both local routes) — ADR-0014 amendment; `lib/__tests__/competitor-auth-local.integration.test.ts`; `lib/__tests__/api-client-competitor.integration.test.ts` (competitor token only on competitor routes, organiser token never there); `components/layout/__tests__/navigation.unit.test.tsx` (account link only with the flag, `#5038`); `__tests__/app-routes.integration.test.tsx` (`/account/profile` redirects when off, `#5038`); `utils/__tests__/dublin-time.unit.test.ts` (`dublinToday`).

### Known limits (slice 2)

- `#5006`, `#5010` (no second account) and `#5011` happen on the competitor tenant's hosted pages. No automated test here can reach them; they wait for the tenant (T001) and `bjjeire-tests`.
- The Graph deletion is proven against a mock server only. The least Graph permission for deleting an external-tenant user (T009) and the claims an External ID access token carries (`email`, `oid`) are not verified against a real tenant. Without `oid`, or without Graph credentials, the identity stays in the tenant and only the API refuses it; the failure is logged and counted.
- Account deletion does not yet anonymise earlier sign-ups or stamp `financialRecordsExpireAt`: no sign-ups exist before slice 3, and those steps are slice 4 (T091, T092). Active sign-ups already block the delete.
- `GET /me/history` is always empty until results exist (slice 5, T102).

## Slice 1 — User Story 1, organiser publishes a competition

| Issue | Layer | Test path | Implementation path |
|---|---|---|---|
| `#5001` | T2 IT | `bjjeirecompetition/BjjEireCompetitionAdminIT.java` (`shouldStoreANewBjjEireCompetitionAsADraftThatVisitorsCannotSee`, `shouldLetTheAdminListAndOpenDrafts`) | `bjjeirecompetition/BjjEireCompetitionAdminController`, `BjjEireCompetitionServiceImpl.create` |
| `#5001` | T2 IT | `bjjeirecompetition/BjjEireCompetitionMongoRepositoryIT.java` (`shouldListOnlyUpcomingPublishedBjjEireCompetitionsEarliestDayThenName`, `shouldNotServeADraftBySlug`) | `BjjEireCompetitionServiceImpl.getUpcoming`, `getPublishedBySlug` |
| `#5001` | T1 unit | `bjjeirecompetition/BjjEireCompetitionControllerTest.java` (validation: name, description, fee, window, slug, venue, division) | `CreateBjjEireCompetitionCommand`, `BjjEireCompetitionDetails.SLUG_PATTERN`, `VenueValidator` |
| `#5001` | T4 SPA | `pages/__tests__/admin-bjjeire-competitions-page.integration.test.tsx` (save → cents, UTC instants, edit page; empty-form errors) | `pages/AdminBjjEireCompetitionsPage`, `features/bjjeire-competition-admin/` |
| `#5001` | T3 SPA | `features/bjjeire-competition-admin/utils/__tests__/bjjeire-competition-form.unit.test.ts`, `division-generator.unit.test.ts` | `features/bjjeire-competition-admin/utils/` |
| `#5001` | T4 SPA | `pages/__tests__/bjjeire-competition-page.integration.test.tsx` (unknown or draft slug → not found) | `pages/BjjEireCompetitionPage`, `useBjjEireCompetition` |
| `#5002` | T2 IT | `bjjeirecompetition/BjjEireCompetitionAdminIT.java` (`shouldShowAPublishedBjjEireCompetitionToAVisitorWhoIsNotSignedIn`) | `BjjEireCompetitionServiceImpl.publish`, `BjjEireCompetitionController` |
| `#5002` | T2 IT | `bjjeirecompetition/BjjEireCompetitionMongoRepositoryIT.java` (`shouldListOnlyUpcomingPublishedBjjEireCompetitionsEarliestDayThenName`, `shouldStillServeAFinishedCancelledOrPassedCompetitionBySlug`) | `BjjEireCompetitionServiceImpl.getUpcoming`, `getPublishedBySlug` |
| `#5002` | T2 IT | `web/OpenApiContractIT.java` (`shouldReturnAPublicBjjEireCompetitionListingThatMatchesTheServedSchema`, `shouldPublishBjjEireCompetitionRoutesWithBearerAuthOnEveryAdminOperation`) | served OpenAPI |
| `#5002` | T0 Pact | `contracts/pact/bjjeire-competition.pact.test.ts`; provider state in `web/PactProviderVerificationIT.java` | `features/bjjeire-competitions/api/get-bjjeire-competitions.ts` |
| `#5002` | T4 SPA | `pages/__tests__/competitions-page-featured.integration.test.tsx`, `bjjeire-competition-page.integration.test.tsx` (details, fee, window in Irish time, grouped divisions) | `pages/CompetitionsPage` (featured section), `pages/BjjEireCompetitionPage`, `features/bjjeire-competitions/` |
| `#5002` | T4 SPA | `pages/__tests__/admin-bjjeire-competition-page.integration.test.tsx` (publish a saved draft) | `pages/AdminBjjEireCompetitionPage` |
| `#5002` | T6 | `bjjeire-tests/tests/features/competitions/` (planned, see that repo's spec) | running images |
| `#5003` | T1 unit | `bjjeirecompetition/BjjEireCompetitionRulesTest.java` (`shouldReportNotOpenBeforeRegistrationOpens`, `shouldReportOpenFromTheOpeningInstantUntilJustBeforeClosing`, `shouldReportClosedFromTheClosingInstant`) | `BjjEireCompetitionRules.registrationState` |
| `#5003` | T2 IT | `bjjeirecompetition/BjjEireCompetitionAdminIT.java` (`shouldTellAVisitorWhetherRegistrationIsNotOpenYetOpenOrClosed`) | `BjjEireCompetitionDto.at`, `BjjEireCompetitionServiceImpl.getPublishedBySlug` |
| `#5003` | T3 SPA | `features/bjjeire-competitions/utils/__tests__/bjjeire-competition-format.unit.test.ts` (`registrationMessage`) | `features/bjjeire-competitions/utils/bjjeire-competition-format.ts` |
| `#5003` | T4 SPA | `pages/__tests__/bjjeire-competition-page.integration.test.tsx` (not open / closed: message, no sign-up control) | `features/bjjeire-competitions/components/bjjeire-competition-details.tsx` |
| `#5003` | T6 | `bjjeire-tests/tests/features/competitions/` (planned; seeded `acceptance-opens-later`, `acceptance-closed`) | running images |
| `#5004` | T2 IT | `bjjeirecompetition/BjjEireCompetitionAdminIT.java` (`shouldRefuseCreateEditAndPublishToAnyoneWhoIsNotTheOrganiser`) | `config/SecurityConfig` (competition writes and `/admin` reads need the writer scope) |
| `#5004` | T2 IT | `config/BjjEireCompetitionRouteAuthorizationIT.java` (`shouldReserveBjjEireCompetitionWritesForTheAdmin`, `shouldReserveBjjEireCompetitionAdminReadsForTheAdmin`) | `config/SecurityConfig` |
| `#5004` | T4 SPA | `pages/__tests__/admin-bjjeire-competitions-page.integration.test.tsx` (signed out: sign-in asked, no request) | `features/bjjeire-competition-admin/components/admin-sign-in-gate.tsx` |
| `#5005` | T2 IT | `bjjeirecompetition/BjjEireCompetitionAdminIT.java` (`shouldStopTheOrganiserRemovingADivisionThatHasActiveSignUps`, `shouldLetTheOrganiserRemoveADivisionWhoseSignUpsAreNoLongerActive`) | `BjjEireCompetitionServiceImpl.update`, `MongoDivisionSignUps` |
| `#5005` | T4 SPA | `pages/__tests__/admin-bjjeire-competition-page.integration.test.tsx` (division-has-signups message) | `pages/AdminBjjEireCompetitionPage`, `utils/problem-message.ts` |

Supporting tests with no requirement issue: `BjjEireCompetitionRulesTest` (status transitions,
publishability, duplicate divisions, age minimums), `BjjEireCompetitionAdminIT`
(`shouldKeepDivisionIdsAndGiveNewDivisionsAnIdWhenEditing`, `shouldRefuseADivisionIdTheBjjEireCompetitionDoesNotHave`,
`shouldRefuseTheSameDivisionTwice`, `shouldRefuseASlugThatIsAlreadyTaken`,
`shouldRefuseToPublishWithoutDivisionsOrWithAnInvalidWindow`, `shouldRefuseToPublishTwiceAndToEmptyAPublishedBjjEireCompetition`,
`shouldShowAnEditToVisitorsOnTheNextRead`, `shouldNotLoseTakenPlacesWhenTheOrganiserEdits`,
`shouldRecordEachOrganiserWriteInTheAuditLog`), `BjjEireCompetitionServiceTest` (`shouldPublishOnlyADraftThatStillHasADivisionWhenItIsWritten`, `shouldPublishOnlyTheVersionWhoseWindowWasChecked`), `BjjEireCompetitionAdminIT` (`shouldStartAtVersionZeroAndCountEachWrite`, `shouldRefuseAnUpdateMadeFromAStaleCopy`), `BjjEireCompetitionControllerTest` (`shouldRejectAnUpdateWithoutTheVersionItWasEditedFrom`), `config/LocalSignInTokensTest`, `config/LocalSignInIT` and `BjjEireCompetitionRouteAuthorizationIT.shouldOfferNoLocalSignInOutsideLocalDevelopment` (ADR-0014), `__tests__/asset-base.unit.test.ts` (direct loads of two-level routes), `lib/__tests__/admin-auth-local.integration.test.ts`, `seeder/SeederIT` (competitions seeded from the test
dataset only, never pruned in production), `BjjEireCompetitionControllerTest` (unreadable body 400, wrong method 405),
`utils/__tests__/dublin-time.unit.test.ts`, `lib/__tests__/api-client.integration.test.ts` (token on
`/competition/admin` reads only).

## Slice 0 — User Story 6, existing directory stays open and read-only

| Issue | Layer | Test path | Implementation path |
|---|---|---|---|
| `#5036` | T2 IT | `config/WriteAuthorizationIT.java` (`shouldServeDirectoryListsToAnonymousVisitors`) | `config/SecurityConfig` |
| `#5036` | T2 IT | `config/BjjEireCompetitionFeatureOffIT.java` (`shouldServeDirectoryListsToAnonymousVisitors`) | `config/SecurityConfig` |
| `#5036` | T1 unit | `web/BjjEireCompetitionFeatureGateFilterTest.java` (`shouldLeaveDirectoryRoutesAloneWhenFlagIsOff`) | `web/BjjEireCompetitionFeatureGateFilter`, `common/ApiRoutes.isBjjEireCompetitionFeaturePath` |
| `#5036` | T6 | `bjjeire-tests/tests/features/{gyms,events,competitions,stores}/` (unchanged) | running images |
| `#5037` | T2 IT | `config/WriteAuthorizationIT.java` (`shouldForbidEveryDirectoryWriteForCompetitorTokens`) | `config/SecurityConfig` (catch-all writer rule) |
| `#5037` | T1 unit | `config/IssuerAwareAuthoritiesConverterTest.java` (`shouldNeverTurnCompetitorTenantScopesOrRolesIntoAuthorities`) | `config/IssuerAwareAuthoritiesConverter` |
| `#5038` | T1 unit | `web/BjjEireCompetitionFeatureGateFilterTest.java` (`shouldAnswerNotFoundOnReadsWhenFlagIsOff`, `shouldAnswerNotFoundOnWritesWhenFlagIsOff`) | `web/BjjEireCompetitionFeatureGateFilter` |
| `#5038` | T1 unit | `web/FeatureFlagDefaultsTest.java` (`shouldDefaultBjjEireCompetitionsToOffInApplicationConfiguration`) | `application.yml`, `web/FeatureFlag.BJJEIRE_COMPETITIONS` |
| `#5038` | T2 IT | `config/BjjEireCompetitionFeatureOffIT.java` (`shouldAnswerNotFoundBeforeAuthenticationOnEveryBjjEireCompetitionRead`, `...Write`, `shouldReportBjjEireCompetitionsOffToTheSpa`; the 404 problem carries a top-level `traceId`, fixed 2026-11-14 after a `bjjeire-tests` finding) | `config/SecurityConfig` (gate ahead of `BearerTokenAuthenticationFilter`), `web/BjjEireCompetitionFeatureGateFilter` |
| `#5038` | T3 SPA | `components/layout/__tests__/use-nav-items.unit.test.tsx` (no entry when off; entry when on) | `components/layout/navigation/use-nav-items.ts` |
| `#5038` | T4 SPA | `__tests__/app-routes.integration.test.tsx` (`AppRoutes: competitions`: every competition and admin route redirects to About with no request when off) | `App.tsx`, `config/features.ts` (`featureSubRoutes`) |
| `#5038` | T4 SPA | `features/feature-flags/__tests__/feature-flag-resolve.integration.test.ts` | `features/feature-flags/definitions.ts` |
| `#5038` | T0 Pact | `contracts/pact/featureflag.pact.test.ts` | `web/FeatureFlagController` |

Supporting tests with no requirement issue (ADR-0012, ADR-0013):
`config/RoutingJwtDecoderTest.java`, `config/BackoffJwtDecoderTest.java`,
`config/CompetitorTokenValidatorTest.java`, `config/BjjEireCompetitionRouteAuthorizationIT.java`,
`config/CrossCuttingFilterTest.java` (read-only exemption).

## Known limits

- `#5005` is proven against sign-up documents written straight to the `BjjEireCompetitionRegistration` collection, because the sign-up slice that owns that collection is not built. `MongoDivisionSignUps` reads only the documented fields (`competitionId`, `divisionId`, `active`); the sign-up slice must keep them.
- The organiser's sign-in is the workforce MSAL popup, or local sign-in in the local stack (ADR-0014). SPA tests mock MSAL; a real Entra sign-in is not exercised by any automated test.
- The `#5005` check and the update are separate reads: the version guard catches another organiser write in between, but not a sign-up arriving in between, because sign-ups do not change the competition's version. The sign-up slice must close that (for example, re-check inside the write filter).
- `BjjEireCompetitionRouteAuthorizationIT` treats "neither 401 nor 403" as allowed. Routes from later slices still have no controller and answer 404 there.
- `BjjEireCompetitionFeatureOffIT` covers GET and POST on a sample of the contract's routes, not every route and method. The gate is prefix-based, so the rest follow.
- "Flag on, read-only on: an admin directory write still answers 405" is proven on the filter alone (`CrossCuttingFilterTest`), not in the assembled application.
- The decoder that validates real competitor tokens is not exercised end to end: tests replace the workforce decoder and never reach the competitor tenant.

