---
description: Testing conventions for Vitest (frontend) and JUnit (backend)
paths:
  - src/bjjeire-app/src/**/__tests__/
  - src/bjjeire-app/src/**/*.test.*
  - src/bjjeire-api/src/test/
---

# Testing Conventions

## TDD Workflow — Always Tests First
Follow Red → Green → Refactor for every new feature or bug fix:

1. **Red** — write a failing test that describes the behaviour you want. Run it and confirm it fails for the right reason (not a compile error or wrong assertion).
2. **Green** — write the minimum implementation to make the test pass. No more.
3. **Refactor** — clean up the code while keeping the test green.

Never write implementation code for a new feature without a failing test already in place. If you find yourself writing code with no test, stop and write the test first.

**Frontend**: create `*.test.tsx` or `*.integration.test.tsx` first, run `npm run test` to see it fail, then implement.
**Backend**: create the JUnit test method first, run `mvn -pl src/bjjeire-api test` to see it fail, then implement the service/repository.

## Frontend (Vitest)

### Test Configs
- `vitest.unit.config.ts` — unit tests (`npm run test`)
- `vitest.integration.config.ts` — integration tests (`npm run test:integration`)
- `vitest.browser.config.ts` — browser tests (`npm run test:browser`)

### Test Structure
- Integration tests live in `src/pages/__tests__/` and `src/features/**/__tests__/`
- Test files named `*.test.tsx` or `*.integration.test.tsx`
- Use `describe` + `it` (not `test`) for consistency
- `beforeEach` resets mocks and ID counters — always call `mockReset()` and factory reset functions

### Render Utilities
```typescript
import { renderWithProviders } from '@/testing/render-utils'
// Wraps with: QueryClient (retry:false, staleTime:0, gcTime:0) + MemoryRouter
const { user } = renderWithProviders(<MyPage />)
```

### Factories
- `src/testing/factories/` — `createGym()`, `createEvent()`, `createPaginatedGyms()`, etc.
- Always call `resetGymIdCounter()` / `resetEventIdCounter()` in `beforeEach`

### Mocking API
```typescript
vi.mock('@/lib/api-client', () => ({ api: { get: vi.fn() } }))
const mockedApiGet = vi.mocked(api.get)
mockedApiGet.mockResolvedValue(createPaginatedGyms([gym], 1, 1))
```

### Accessibility
- Use `jest-axe` + `axe(container)` in happy-path tests
- `expect(results).toHaveNoViolations()`

## Backend (Java / JUnit 5)

### Layers
- Unit tests (`*Test`): Mockito for repositories/collaborators, MockMvc standalone for controllers — test services/domain logic in isolation
- Integration tests (`*IT`): real MongoDB via Testcontainers — extend `testsupport.MongoIntegrationTest`
- Never mock MongoDB in integration tests — divergence caused prod issues previously

### Naming
- Test class: `{ClassUnderTest}Test` (unit) or `{ClassUnderTest}IT` / `{Area}IT` (integration)
- Method: `should{ExpectedBehaviour}` describing the scenario, e.g. `shouldReturnNotFoundWhenGymMissing`
- Tests live in the same feature package as the code under test (`com.bjjeire.api.gym`, …)

### Playwright (E2E)
- Lives in the separate `bjjeire-tests` repository (run in CI via its reusable `playwright-docker.yml` workflow)
- Runs against the full docker-compose stack
