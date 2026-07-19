import { type ReactElement, type ReactNode } from 'react'
import { render, type RenderResult } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import {
  FeatureFlagProvider,
  resolveFlags,
  type FeatureFlagsMap,
} from '@/features/feature-flags'

interface RenderWithProvidersOptions {
  initialRoutes?: string[]
  featureFlags?: Partial<FeatureFlagsMap>
}

interface RenderWithProvidersResult extends RenderResult {
  user: UserEvent
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // don't retry failed requests — tests fail fast and clearly
        staleTime: 0, // always treat cached data as stale — no data bleeds between tests
        gcTime: 0, // garbage-collect cached data immediately after use
      },
    },
  })
}

function buildFlags(overrides?: Partial<FeatureFlagsMap>): FeatureFlagsMap {
  return resolveFlags(overrides ? [overrides] : [])
}

export function makeFeatureFlagWrapper(
  overrides?: Partial<FeatureFlagsMap>
): ({ children }: { children: ReactNode }) => ReactElement {
  const queryClient = createTestQueryClient()
  const flags = buildFlags(overrides)
  return function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return (
      <QueryClientProvider client={queryClient}>
        <FeatureFlagProvider flags={flags}>
          <MemoryRouter>{children}</MemoryRouter>
        </FeatureFlagProvider>
      </QueryClientProvider>
    )
  }
}

export function makeHookWrapper(): ({
  children,
}: {
  children: ReactNode
}) => ReactElement {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function Providers({
  children,
  initialRoutes = ['/'],
  featureFlags,
}: Readonly<{
  children: ReactNode
  initialRoutes?: string[]
  featureFlags?: Partial<FeatureFlagsMap>
}>): ReactElement {
  const queryClient = createTestQueryClient()
  const flags = buildFlags(featureFlags)
  return (
    <QueryClientProvider client={queryClient}>
      <FeatureFlagProvider flags={flags}>
        <MemoryRouter initialEntries={initialRoutes}>{children}</MemoryRouter>
      </FeatureFlagProvider>
    </QueryClientProvider>
  )
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {}
): RenderWithProvidersResult {
  const user = userEvent.setup()
  const renderResult = render(ui, {
    wrapper: ({ children }) => (
      <Providers
        initialRoutes={options.initialRoutes}
        featureFlags={options.featureFlags}
      >
        {children}
      </Providers>
    ),
  })
  return { ...renderResult, user }
}
