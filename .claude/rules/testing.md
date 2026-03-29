---
description: Testing conventions for Vitest (frontend) and xUnit (backend)
paths:
  - src/bjjeire-app/src/**/__tests__/
  - src/bjjeire-app/src/**/*.test.*
  - tests/
---

# Testing Conventions

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
