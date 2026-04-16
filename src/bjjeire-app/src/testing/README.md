# Testing Framework

## Layout

```
src/testing/
  render-utils.tsx          # renderWithProviders + hook wrappers
  setup-tests.ts            # unit + component test setup (jsdom, jest-dom)
  setup-integration-tests.ts# starts MSW server, resets factory counters
  setup-browser-tests.ts    # Playwright browser setup
  msw/
    server.ts               # node setupServer
    handlers.ts             # back-compat re-export
    handlers/
      index.ts              # composes all feature handlers
      shared.ts             # options passthrough
      feature-flags.ts
      gyms.ts
      bjj-events.ts
      competitions.ts
  factories/                # test data builders (createGym, createEvent, ...)
  utils/
    queries.ts              # waitForLoaded, expectNoError, getButton, ...
    msw-helpers.ts          # jsonHandler, errorHandler, pendingHandler, captureRequest
```

## Test Types

- `*.unit.test.{ts,tsx}` — unit / component (jsdom). Runs via `npm run test`.
- `*.integration.test.{ts,tsx}` — feature slice w/ MSW. Runs via `npm run test:integration`.
- `*.browser.test.{ts,tsx}` — Playwright-backed real-DOM. Runs via `npm run test:browser`.

The vitest configs enforce these patterns via `include` — a bare `*.test.tsx`
will not be picked up. Name the file right or it won't run.

## Rendering

```ts
import { renderWithProviders } from '@/testing/render-utils'

const { user } = renderWithProviders(<MyPage />, {
  initialRoutes: ['/gyms'],
  featureFlags: { Gyms: true },
})
```

Providers applied: `QueryClientProvider` (retry:false, staleTime:0, gcTime:0),
`FeatureFlagProvider`, `MemoryRouter`. A fresh `QueryClient` per render.

## Factories

All test data comes from factories under `src/testing/factories/` — never inline
literal DTOs in tests. Factories auto-increment IDs; call
`resetGymIdCounter()` / `resetEventIdCounter()` in `beforeEach` when order
matters. The integration setup resets counters automatically in `afterEach`.

```ts
import { createGym, createPaginatedGyms } from '@/testing/factories/gym.factory'

const page = createPaginatedGyms([createGym({ name: 'Origin BJJ' })], 1, 1)
```

## MSW

### Shared server + handlers

`@/testing/msw/server` exports a `setupServer` instance pre-configured with the
full handler set from `msw/handlers/index.ts`. Integration tests drive it
directly — **do not create a new `setupServer()` per file**:

```ts
import { server } from '@/testing/msw/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())

server.use(errorHandler('*/api/gym', 500))
```

### Per-feature testing helpers

Every feature ships a `src/features/<feature>/testing/*-test-helpers.tsx`
exposing `renderXPage()` and `seedX…()` helpers that wrap the shared `server`.
Page integration tests should compose these instead of writing raw MSW handlers:

```ts
import {
  renderGymsPage,
  seedGyms,
  seedGymsByCounty,
  seedGymsError,
} from '@/features/gyms/testing/gyms-test-helpers'

seedGyms([createGym({ name: 'Renzo Gracie Dublin' })])
renderGymsPage()
```

When adding a new feature, create `<feature>/testing/` before writing page
integration tests. This keeps selectors, API URL, and render boilerplate in
one place.

### Adding a handler

Add it to the feature file under `msw/handlers/` and export from `index.ts`.
Prefer the helpers in `utils/msw-helpers.ts` for the common cases.

## Assertion helpers

```ts
import { waitForLoaded, expectNoError, getButton } from '@/testing/utils'

await waitForLoaded()
await user.click(getButton(/next page/i))
```

## Accessibility

Component tests should include one `axe` assertion on the rendered container.
Install `jest-axe` and import inside the test file when needed:

```ts
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

const { container } = renderWithProviders(<GymCard gym={createGym()} />)
expect(await axe(container)).toHaveNoViolations()
```

## Generated API types

`npm run gen:api-types` regenerates `src/types/generated/api.ts` from the
running API's OpenAPI spec (`http://localhost:5001/openapi/v1.json`). Run the
API locally first (`dotnet run --project src/BjjEire.Api`). Factories and MSW
handlers should reference these generated types to prevent contract drift.

## Conventions

- Query priority: `getByRole` > `getByLabelText` > `getByText` > `getByTestId`.
- `userEvent.setup()` is returned from `renderWithProviders`; never call `fireEvent`
  unless testing a native-only event.
- No `../../..` imports — use `@/` alias.
- One behavior per test; AAA structure; no shared mutable state between tests.
