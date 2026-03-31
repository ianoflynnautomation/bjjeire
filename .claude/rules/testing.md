---
description: Testing conventions for Vitest (frontend) and xUnit (backend)
paths:
  - src/bjjeire-app/src/**/__tests__/
  - src/bjjeire-app/src/**/*.test.*
  - tests/
---

# Testing Conventions

## TDD Workflow — Always Tests First
Follow Red → Green → Refactor for every new feature or bug fix:

1. **Red** — write a failing test that describes the behaviour you want. Run it and confirm it fails for the right reason (not a compile error or wrong assertion).
2. **Green** — write the minimum implementation to make the test pass. No more.
3. **Refactor** — clean up the code while keeping the test green.

Never write implementation code for a new feature without a failing test already in place. If you find yourself writing code with no test, stop and write the test first.

**Frontend**: create `*.test.tsx` or `*.integration.test.tsx` first, run `npm run test` to see it fail, then implement.
**Backend**: create the xUnit test method first, run `dotnet test` to see it fail, then implement the handler/repository.

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

## Backend (.NET / xUnit)

### Layers
- `UnitTests`: mock repositories and services, test handlers/domain logic in isolation
- `IntegrationTests`: real MongoDB (test container or local), real HTTP client via `WebApplicationFactory`
- Never mock MongoDB in integration tests — divergence caused prod issues previously

### Naming
- Test class: `{ClassUnderTest}Tests`
- Method: `{MethodName}_{Scenario}_{ExpectedResult}`
- Example: `Handle_GymNotFound_ReturnsNull`

### Playwright (E2E)
- Lives in `tests/BjjEire.Web.AcceptanceTests/`
- Uses `BjjEire.Web.Playwright.Core` for shared fixtures
- Run against the full docker-compose stack
