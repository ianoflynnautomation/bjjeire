---
description: Testing conventions for Vitest (frontend) and JUnit (backend)
paths:
  - src/bjjeire-app/src/**/__tests__/
  - src/bjjeire-app/src/**/*.test.*
  - src/bjjeire-app/src/testing/
  - src/bjjeire-app/src/features/*/testing/
  - src/bjjeire-api/src/test/
---

# Testing Conventions

Layer ownership, Spec-To-Check overlays (`specs/stc/`), and agent TDD rules:
[docs/testing-strategy.md](../../docs/testing-strategy.md).

Write the failing test first, run it, and confirm it fails for the intended reason before writing the implementation.

## Frontend (Vitest)

Full guide: `src/bjjeire-app/src/testing/README.md`.

### File names decide what runs
| Suffix | Project | Command |
|---|---|---|
| `*.unit.test.{ts,tsx}` | unit (jsdom) | `npm test` |
| `*.integration.test.{ts,tsx}` | integration (jsdom + MSW) | `npm run test:integration` |
| `*.browser.test.{ts,tsx}` | browser (Playwright) | `npm run test:browser` |
| `*.pact.test.ts` | pact | `npm run test:pact` |

A bare `*.test.tsx` matches no project and never runs. Tests live in `__tests__/` beside the code.

### Rendering
```typescript
import { renderWithProviders } from '@/testing/render-utils'

const { user } = renderWithProviders(<GymsPage />, {
  initialRoutes: ['/gyms'],
  featureFlags: { Gyms: true },
})
```
- It wraps a fresh `QueryClient`, `FeatureFlagProvider`, and `MemoryRouter`
- Flags default to off. A page behind a flag renders nothing useful unless the test passes `featureFlags`
- `MemoryRouter` comes from `react-router`. `react-router-dom` is not installed. Never mock the router; use `initialRoutes`

### API responses use MSW
- Integration tests share the server in `@/testing/msw/server`. `setup-integration-tests.ts` starts it, resets handlers, and closes it. Do not call `setupServer`, `listen`, or `close` in a test file
- An unhandled request fails the test (`onUnhandledRequest: 'error'`)
- Page tests use the feature helpers in `src/features/{feature}/testing/*-test-helpers.tsx` (`renderGymsPage`, `seedGyms`, `seedGymsError`). A new feature gets its `testing/` folder before its page tests
- Override a response with `server.use(...)` and the helpers in `@/testing/utils/msw-helpers`. Build URLs with `testApiUrl(API_ROUTES.x)`, never a literal
- Do not `vi.mock('@/lib/api-client')`

### Data and style
- Test data comes from `src/testing/factories/` (`createGym`, `createPaginatedGyms`, …). Do not inline a DTO literal
- Factories auto-increment IDs. The integration setup resets the counters; a unit test that depends on IDs calls `resetGymIdCounter()` in `beforeEach`
- Use `describe` + `it`, not `test`
- Test IDs are the constants in `src/constants/*DataTestIds.ts`
- No axe library is installed. Do not import `jest-axe`

## Backend (Java / JUnit 5)

### Layers
- `*Test`: Mockito for collaborators, standalone MockMvc for controllers
- `*IT`: real MongoDB via Testcontainers. Extend `testsupport.MongoIntegrationTest`. Never mock MongoDB in an integration test
- All `*IT` classes share one container and one Spring context. A subclass that adds its own context configuration or a mocked bean forces a second context and slows the whole run
- `MongoIntegrationTest` fixes the clock at `FIXED_NOW`. Build test dates from it, not from `Instant.now()`
- The shared `RestTemplate` uses the JDK HTTP client. `HttpURLConnection` drops a 401 body when `WWW-Authenticate` is set, so an assertion on that body looks empty even though the server wrote it

### What each command runs
- `mvn -pl src/bjjeire-api test` runs `*Test` only. Surefire excludes `*IT`
- `mvn verify` adds `*IT` through Failsafe and needs Docker
- `PactProviderVerificationIT` runs only with `-Ppact-provider`

### Naming
- Class: `{ClassUnderTest}Test`, `{ClassUnderTest}IT`, or `{Area}IT`
- Method: `should{ExpectedBehaviour}`, for example `shouldReturnNotFoundWhenGymMissing`
- Tests sit in the same feature package as the code under test

## End-to-end
- Playwright acceptance tests live in the `bjjeire-tests` repository. See `AGENTS.md` for how to edit its specs from here
