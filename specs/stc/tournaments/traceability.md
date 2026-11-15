# Traceability: tournaments

Requirement issues are defined in [spec.md](spec.md). Narrative SSOT:
[specs/features/tournaments.md](../../features/tournaments.md). Issues not
listed here are not built yet.

Paths below are relative to `src/bjjeire-api/src/test/java/com/bjjeire/api/`
(API) or `src/bjjeire-app/src/` (SPA) unless they start with a repository name.

## Slice 2 — User Story 2, competitor account and profile

| Issue | Layer | Test path | Implementation path |
|---|---|---|---|
| `#5006` | T4 SPA | `pages/__tests__/profile-page.integration.test.tsx` (signed out: sign-in offered, no profile request; sign-in through the competitor popup loads the profile on the same page) | `features/competitor/components/competitor-sign-in-gate.tsx`, `lib/competitor-auth.ts` |
| `#5006` | T4 SPA | `lib/__tests__/api-client-competitor.integration.test.ts` (`competitor auth with the competitor tenant`) | `lib/competitor-auth.ts`, `lib/competitor-msal-config.ts` |
| `#5006` | T6 | `bjjeire-tests` (planned; hosted pages, needs the competitor tenant, T001) | competitor tenant |
| `#5007` | T1 unit | `competitor/SaveCompetitorCommandTest.java` (`shouldAcceptAFullProfile`, `shouldRequireFirstNameLastNameAndDateOfBirth`, `shouldLimitNamesToSixtyCharactersAndTeamsToEighty`, `shouldRequireAnIsoAlpha2Nationality`, `shouldRequireADateOfBirthInThePast`, `shouldCallAProfileCompleteOnlyWithNamesNationalityDateOfBirthGenderAndBelt`) | `SaveCompetitorCommand`, `IsoCountry`, `Competitor.isProfileComplete` |
| `#5007` | T2 IT | `competitor/CompetitorIT.java` (`shouldAnswerNotFoundBeforeTheCompetitorHasSavedAProfile`, `shouldShowASavedProfileBackToTheCompetitor`, `shouldKeepTheProfileKeyedByIssuerAndSubjectAndAuditEachSave`, `shouldReportAnIncompleteProfileThatCannotSignUpYet`) | `CompetitorController`, `CompetitorServiceImpl.saveOwn`, `getOwn` |
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
| `#5009` | T2 IT | `config/TournamentRouteAuthorizationIT.java` (`shouldReserveCompetitorRoutesForSignedInCompetitors`) | `config/SecurityConfig` |
| `#5010` | T2 IT | `competitor/CompetitorIT.java` (`shouldNeverCreateTwoProfilesForOneIdentity`) | `ix_competitor_issuer_subject_unique`, `CompetitorServiceImpl.saveOwn` (upsert, one retry) |
| `#5010` | T6 | `bjjeire-tests` (planned; hosted pages, needs T001) | competitor tenant |
| `#5011` | T6 | `bjjeire-tests` (planned; hosted pages, needs T001) | competitor tenant |
| `#5012` | T2 IT | `competitor/CompetitorDeletionIT.java` (`shouldRemoveThePersonalDetailsAndTheSignInIdentity`, `shouldRefuseTheDeletedIdentityFromThenOn`, `shouldStillDeleteTheAccountWhenTheDirectoryCannotBeReached`, `shouldDeleteTheIdentityOfSomeoneWhoNeverSavedAProfile`, `shouldRefuseWhileTheCompetitorHasAnActiveSignUp`, `shouldRefuseWhenTheActiveSignUpStoresTheCompetitorAsAnObjectId`, `shouldAllowDeletionWhenEverySignUpHasEnded`) | `CompetitorServiceImpl.deleteOwn`, `DeletedCompetitor`, `MongoRevokedCompetitors` |
| `#5012` | T1 unit | `competitor/CompetitorServiceTest.java` (`shouldRemoveAProfileSavedWhileTheAccountWasBeingDeleted`, `shouldRefuseRatherThanFailWhenTheProfileVanishedAfterTheSave`, `shouldRemoveByIdentityAfterRevokingSoARacingFirstSaveIsNotLeftBehind`) | `CompetitorServiceImpl.saveOwn` (revoked check after the upsert), `deleteOwn` (remove by identity after revoking) |
| `#5012` | T1 unit | `config/RevocationCheckingJwtDecoderTest.java`, `competitor/GraphIdentityDirectoryTest.java` | `config/RevocationCheckingJwtDecoder`, `GraphIdentityDirectory` |
| `#5012` | T4 SPA | `pages/__tests__/profile-page.integration.test.tsx` (confirm then delete and sign out; active sign-up message) | `features/competitor/components/account-actions.tsx` |
| `#5039` | T2 IT | `competitor/CompetitorDeletionIT.java` (`shouldShowEmptyMedalHistoryUntilResultsAreRecorded`) | `CompetitorServiceImpl.getOwnHistory` (empty until slice 5) |
| `#5039` | T4 SPA | `pages/__tests__/profile-page.integration.test.tsx` (totals and rows; empty state) | `features/competitor/components/medal-history.tsx` |

Supporting tests with no requirement issue: `config/LocalSignInTokensTest` (`shouldIssueACompetitorTokenThatTheLocalDecoderAccepts`, `shouldGiveTheSameEmailTheSameLocalCompetitor`), `config/RoutingJwtDecoderTest` (`shouldSendLocalCompetitorTokensToTheLocalDecoderOnlyWhenLocalSignInIsConfigured`), `config/IssuerAwareAuthoritiesConverterTest` (`shouldTreatEveryConfiguredCompetitorIssuerTheSameWay`), `config/LocalSignInIT` (`shouldLetALocalCompetitorKeepAProfile`, `shouldNeverTreatALocalCompetitorAsAnOrganiser`, `shouldRefuseALocalCompetitorSignInWithoutAValidEmail`), `config/TournamentRouteAuthorizationIT.shouldOfferNoLocalSignInOutsideLocalDevelopment` (both local routes) — ADR-0014 amendment; `lib/__tests__/competitor-auth-local.integration.test.ts`; `lib/__tests__/api-client-competitor.integration.test.ts` (competitor token only on competitor routes, organiser token never there); `components/layout/__tests__/navigation.unit.test.tsx` (account link only with the flag, `#5038`); `__tests__/app-routes.integration.test.tsx` (`/account/profile` redirects when off, `#5038`); `utils/__tests__/dublin-time.unit.test.ts` (`dublinToday`).

### Known limits (slice 2)

- `#5006`, `#5010` (no second account) and `#5011` happen on the competitor tenant's hosted pages. No automated test here can reach them; they wait for the tenant (T001) and `bjjeire-tests`.
- The Graph deletion is proven against a mock server only. The least Graph permission for deleting an external-tenant user (T009) and the claims an External ID access token carries (`email`, `oid`) are not verified against a real tenant. Without `oid`, or without Graph credentials, the identity stays in the tenant and only the API refuses it; the failure is logged and counted.
- Account deletion does not yet anonymise earlier sign-ups or stamp `financialRecordsExpireAt`: no sign-ups exist before slice 3, and those steps are slice 4 (T091, T092). Active sign-ups already block the delete.
- `GET /me/history` is always empty until results exist (slice 5, T102).

## Slice 1 — User Story 1, organiser publishes a tournament

| Issue | Layer | Test path | Implementation path |
|---|---|---|---|
| `#5001` | T2 IT | `tournament/TournamentAdminIT.java` (`shouldStoreANewTournamentAsADraftThatVisitorsCannotSee`, `shouldLetTheAdminListAndOpenDrafts`) | `tournament/TournamentAdminController`, `TournamentServiceImpl.create` |
| `#5001` | T2 IT | `tournament/TournamentMongoRepositoryIT.java` (`shouldListOnlyPublishedFinishedAndCancelledTournamentsOrderedByDate`, `shouldNotServeADraftBySlug`) | `TournamentServiceImpl.getPublished`, `getPublishedBySlug` |
| `#5001` | T1 unit | `tournament/TournamentControllerTest.java` (validation: name, description, fee, window, slug, venue, division) | `CreateTournamentCommand`, `TournamentDetails.SLUG_PATTERN`, `VenueValidator` |
| `#5001` | T4 SPA | `pages/__tests__/admin-tournaments-page.integration.test.tsx` (save → cents, UTC instants, edit page; empty-form errors) | `pages/AdminTournamentsPage`, `features/tournament-admin/` |
| `#5001` | T3 SPA | `features/tournament-admin/utils/__tests__/tournament-form.unit.test.ts`, `division-generator.unit.test.ts` | `features/tournament-admin/utils/` |
| `#5001` | T4 SPA | `pages/__tests__/tournament-page.integration.test.tsx` (unknown or draft slug → not found) | `pages/TournamentPage`, `useTournament` |
| `#5002` | T2 IT | `tournament/TournamentAdminIT.java` (`shouldShowAPublishedTournamentToAVisitorWhoIsNotSignedIn`) | `TournamentServiceImpl.publish`, `TournamentController` |
| `#5002` | T2 IT | `tournament/TournamentMongoRepositoryIT.java` (`shouldListOnlyPublishedFinishedAndCancelledTournamentsOrderedByDate`) | `TournamentServiceImpl.getPublished` |
| `#5002` | T2 IT | `web/OpenApiContractIT.java` (`shouldReturnAPublicTournamentListingThatMatchesTheServedSchema`, `shouldPublishTournamentRoutesWithBearerAuthOnEveryAdminOperation`) | served OpenAPI |
| `#5002` | T0 Pact | `contracts/pact/tournament.pact.test.ts`; provider state in `web/PactProviderVerificationIT.java` | `features/tournaments/api/get-tournaments.ts` |
| `#5002` | T4 SPA | `pages/__tests__/tournaments-page.integration.test.tsx`, `tournament-page.integration.test.tsx` (details, fee, window in Irish time, grouped divisions) | `pages/TournamentsPage`, `pages/TournamentPage`, `features/tournaments/` |
| `#5002` | T4 SPA | `pages/__tests__/admin-tournament-page.integration.test.tsx` (publish a saved draft) | `pages/AdminTournamentPage` |
| `#5002` | T6 | `bjjeire-tests/tests/features/tournaments/` (planned, see that repo's spec) | running images |
| `#5003` | T1 unit | `tournament/TournamentRulesTest.java` (`shouldReportNotOpenBeforeRegistrationOpens`, `shouldReportOpenFromTheOpeningInstantUntilJustBeforeClosing`, `shouldReportClosedFromTheClosingInstant`) | `TournamentRules.registrationState` |
| `#5003` | T2 IT | `tournament/TournamentAdminIT.java` (`shouldTellAVisitorWhetherRegistrationIsNotOpenYetOpenOrClosed`) | `TournamentDto.at`, `TournamentServiceImpl.getPublishedBySlug` |
| `#5003` | T3 SPA | `features/tournaments/utils/__tests__/tournament-format.unit.test.ts` (`registrationMessage`) | `features/tournaments/utils/tournament-format.ts` |
| `#5003` | T4 SPA | `pages/__tests__/tournament-page.integration.test.tsx` (not open / closed: message, no sign-up control) | `features/tournaments/components/tournament-details.tsx` |
| `#5003` | T6 | `bjjeire-tests/tests/features/tournaments/` (planned; seeded `acceptance-opens-later`, `acceptance-closed`) | running images |
| `#5004` | T2 IT | `tournament/TournamentAdminIT.java` (`shouldRefuseCreateEditAndPublishToAnyoneWhoIsNotTheOrganiser`) | `config/SecurityConfig` (tournament writes and `/admin` reads need the writer scope) |
| `#5004` | T2 IT | `config/TournamentRouteAuthorizationIT.java` (`shouldReserveTournamentWritesForTheAdmin`, `shouldReserveTournamentAdminReadsForTheAdmin`) | `config/SecurityConfig` |
| `#5004` | T4 SPA | `pages/__tests__/admin-tournaments-page.integration.test.tsx` (signed out: sign-in asked, no request) | `features/tournament-admin/components/admin-sign-in-gate.tsx` |
| `#5005` | T2 IT | `tournament/TournamentAdminIT.java` (`shouldStopTheOrganiserRemovingADivisionThatHasActiveSignUps`, `shouldLetTheOrganiserRemoveADivisionWhoseSignUpsAreNoLongerActive`) | `TournamentServiceImpl.update`, `MongoDivisionSignUps` |
| `#5005` | T4 SPA | `pages/__tests__/admin-tournament-page.integration.test.tsx` (division-has-signups message) | `pages/AdminTournamentPage`, `utils/problem-message.ts` |

Supporting tests with no requirement issue: `TournamentRulesTest` (status transitions,
publishability, duplicate divisions, age minimums), `TournamentAdminIT`
(`shouldKeepDivisionIdsAndGiveNewDivisionsAnIdWhenEditing`, `shouldRefuseADivisionIdTheTournamentDoesNotHave`,
`shouldRefuseTheSameDivisionTwice`, `shouldRefuseASlugThatIsAlreadyTaken`,
`shouldRefuseToPublishWithoutDivisionsOrWithAnInvalidWindow`, `shouldRefuseToPublishTwiceAndToEmptyAPublishedTournament`,
`shouldShowAnEditToVisitorsOnTheNextRead`, `shouldNotLoseTakenPlacesWhenTheOrganiserEdits`,
`shouldRecordEachOrganiserWriteInTheAuditLog`), `TournamentServiceTest` (`shouldPublishOnlyADraftThatStillHasADivisionWhenItIsWritten`, `shouldPublishOnlyTheVersionWhoseWindowWasChecked`), `TournamentAdminIT` (`shouldStartAtVersionZeroAndCountEachWrite`, `shouldRefuseAnUpdateMadeFromAStaleCopy`), `TournamentControllerTest` (`shouldRejectAnUpdateWithoutTheVersionItWasEditedFrom`), `config/LocalSignInTokensTest`, `config/LocalSignInIT` and `TournamentRouteAuthorizationIT.shouldOfferNoLocalSignInOutsideLocalDevelopment` (ADR-0014), `__tests__/asset-base.unit.test.ts` (direct loads of two-level routes), `lib/__tests__/admin-auth-local.integration.test.ts`, `seeder/SeederIT` (tournaments seeded from the test
dataset only, never pruned in production), `TournamentControllerTest` (unreadable body 400, wrong method 405),
`utils/__tests__/dublin-time.unit.test.ts`, `lib/__tests__/api-client.integration.test.ts` (token on
`/tournament/admin` reads only).

## Slice 0 — User Story 6, existing directory stays open and read-only

| Issue | Layer | Test path | Implementation path |
|---|---|---|---|
| `#5036` | T2 IT | `config/WriteAuthorizationIT.java` (`shouldServeDirectoryListsToAnonymousVisitors`) | `config/SecurityConfig` |
| `#5036` | T2 IT | `config/TournamentFeatureOffIT.java` (`shouldServeDirectoryListsToAnonymousVisitors`) | `config/SecurityConfig` |
| `#5036` | T1 unit | `web/TournamentFeatureGateFilterTest.java` (`shouldLeaveDirectoryRoutesAloneWhenFlagIsOff`) | `web/TournamentFeatureGateFilter`, `common/ApiRoutes.isTournamentFeaturePath` |
| `#5036` | T6 | `bjjeire-tests/tests/features/{gyms,events,competitions,stores}/` (unchanged) | running images |
| `#5037` | T2 IT | `config/WriteAuthorizationIT.java` (`shouldForbidEveryDirectoryWriteForCompetitorTokens`) | `config/SecurityConfig` (catch-all writer rule) |
| `#5037` | T1 unit | `config/IssuerAwareAuthoritiesConverterTest.java` (`shouldNeverTurnCompetitorTenantScopesOrRolesIntoAuthorities`) | `config/IssuerAwareAuthoritiesConverter` |
| `#5038` | T1 unit | `web/TournamentFeatureGateFilterTest.java` (`shouldAnswerNotFoundOnReadsWhenFlagIsOff`, `shouldAnswerNotFoundOnWritesWhenFlagIsOff`) | `web/TournamentFeatureGateFilter` |
| `#5038` | T1 unit | `web/FeatureFlagDefaultsTest.java` (`shouldDefaultTournamentsToOffInApplicationConfiguration`) | `application.yml`, `web/FeatureFlag.TOURNAMENTS` |
| `#5038` | T2 IT | `config/TournamentFeatureOffIT.java` (`shouldAnswerNotFoundBeforeAuthenticationOnEveryTournamentRead`, `...Write`, `shouldReportTournamentsOffToTheSpa`; the 404 problem carries a top-level `traceId`, fixed 2026-11-14 after a `bjjeire-tests` finding) | `config/SecurityConfig` (gate ahead of `BearerTokenAuthenticationFilter`), `web/TournamentFeatureGateFilter` |
| `#5038` | T3 SPA | `components/layout/__tests__/use-nav-items.unit.test.tsx` (no entry when off; entry when on) | `components/layout/navigation/use-nav-items.ts` |
| `#5038` | T4 SPA | `__tests__/app-routes.integration.test.tsx` (`AppRoutes: tournaments`: every tournament and admin route redirects to About with no request when off) | `App.tsx`, `config/features.ts` (`featureSubRoutes`) |
| `#5038` | T4 SPA | `features/feature-flags/__tests__/feature-flag-resolve.integration.test.ts` | `features/feature-flags/definitions.ts` |
| `#5038` | T0 Pact | `contracts/pact/featureflag.pact.test.ts` | `web/FeatureFlagController` |

Supporting tests with no requirement issue (ADR-0012, ADR-0013):
`config/RoutingJwtDecoderTest.java`, `config/BackoffJwtDecoderTest.java`,
`config/CompetitorTokenValidatorTest.java`, `config/TournamentRouteAuthorizationIT.java`,
`config/CrossCuttingFilterTest.java` (read-only exemption).

## Known limits

- `#5005` is proven against sign-up documents written straight to the `TournamentRegistration` collection, because the sign-up slice that owns that collection is not built. `MongoDivisionSignUps` reads only the documented fields (`tournamentId`, `divisionId`, `active`); the sign-up slice must keep them.
- The organiser's sign-in is the workforce MSAL popup, or local sign-in in the local stack (ADR-0014). SPA tests mock MSAL; a real Entra sign-in is not exercised by any automated test.
- The `#5005` check and the update are separate reads: the version guard catches another organiser write in between, but not a sign-up arriving in between, because sign-ups do not change the tournament's version. The sign-up slice must close that (for example, re-check inside the write filter).
- `TournamentRouteAuthorizationIT` treats "neither 401 nor 403" as allowed. Routes from later slices still have no controller and answer 404 there.
- `TournamentFeatureOffIT` covers GET and POST on a sample of the contract's routes, not every route and method. The gate is prefix-based, so the rest follow.
- "Flag on, read-only on: an admin directory write still answers 405" is proven on the filter alone (`CrossCuttingFilterTest`), not in the assembled application.
- The decoder that validates real competitor tokens is not exercised end to end: tests replace the workforce decoder and never reach the competitor tenant.
