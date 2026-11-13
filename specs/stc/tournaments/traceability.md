# Traceability: tournaments

Requirement issues are defined in [spec.md](spec.md). Narrative SSOT:
[specs/features/tournaments.md](../../features/tournaments.md). Issues not
listed here are not built yet.

| Issue | Layer | Test path | Implementation path |
|---|---|---|---|
| `#5036` | T2 IT | `config/WriteAuthorizationIT.java` (`shouldServeDirectoryListsToAnonymousVisitors`) | `config/SecurityConfig` |
| `#5036` | T1 unit | `web/TournamentFeatureGateFilterTest.java` (`shouldLeaveDirectoryRoutesAloneWhenFlagIsOff`) | `web/TournamentFeatureGateFilter`, `common/ApiRoutes.isTournamentFeaturePath` |
| `#5036` | T6 | `bjjeire-tests/tests/features/{gyms,events,competitions,stores}/` (unchanged) | running images |
| `#5037` | T2 IT | `config/WriteAuthorizationIT.java` (`shouldForbidEveryDirectoryWriteForCompetitorTokens`) | `config/SecurityConfig` (catch-all writer rule) |
| `#5037` | T1 unit | `config/IssuerAwareAuthoritiesConverterTest.java` (`shouldNeverTurnCompetitorTenantScopesOrRolesIntoAuthorities`) | `config/IssuerAwareAuthoritiesConverter` |
| `#5038` | T1 unit | `web/TournamentFeatureGateFilterTest.java` (`shouldAnswerNotFoundOnReadsWhenFlagIsOff`, `shouldAnswerNotFoundOnWritesWhenFlagIsOff`) | `web/TournamentFeatureGateFilter` |
| `#5038` | T1 unit | `web/FeatureFlagDefaultsTest.java` (`shouldDefaultTournamentsToOffInApplicationConfiguration`) | `application.yml`, `web/FeatureFlag.TOURNAMENTS` |
| `#5038` | T3 SPA | `src/bjjeire-app/src/components/layout/__tests__/use-nav-items.unit.test.tsx` | `features/feature-flags/definitions.ts` |
| `#5038` | T4 SPA | `src/bjjeire-app/src/features/feature-flags/__tests__/feature-flag-resolve.integration.test.ts` | `features/feature-flags/definitions.ts` |
| `#5038` | T0 Pact | `src/bjjeire-app/src/contracts/pact/featureflag.pact.test.ts` | `web/FeatureFlagController` |
| `#5036` | T2 IT | `config/TournamentFeatureOffIT.java` (`shouldServeDirectoryListsToAnonymousVisitors`) | `config/SecurityConfig` |
| `#5038` | T2 IT | `config/TournamentFeatureOffIT.java` (`shouldAnswerNotFoundBeforeAuthenticationOnEveryTournamentRead`, `...Write`, `shouldReportTournamentsOffToTheSpa`) | `config/SecurityConfig` (gate ahead of `BearerTokenAuthenticationFilter`) |

Supporting tests with no requirement issue (ADR-0012, ADR-0013):
`config/RoutingJwtDecoderTest.java`, `config/BackoffJwtDecoderTest.java`,
`config/CompetitorTokenValidatorTest.java`, `config/TournamentRouteAuthorizationIT.java`,
`config/CrossCuttingFilterTest.java` (read-only exemption).

Known limits of these tests:

- The SPA tests for `#5038` pass whatever the flag's value, because the SPA has no
  tournament or account entry point yet. They guard against a future ungated one.
- `TournamentRouteAuthorizationIT` treats "neither 401 nor 403" as allowed. With no
  controllers a 404 passes. It proves the access rules, not the routes, and nothing about
  the Stripe signature.
- `TournamentFeatureOffIT` covers GET and POST on a sample of the contract's routes, not every
  route and method. The gate is prefix-based, so the rest follow.
- "Flag on, read-only on: an admin directory write still answers 405" is proven on the filter
  alone (`CrossCuttingFilterTest`), not in the assembled application.
- The decoder that validates real competitor tokens is not exercised end to end: tests
  replace the workforce decoder and never reach the competitor tenant.
