import { type ReactElement, type ReactNode } from 'react'
import { render, type RenderResult } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'

interface RenderWithProvidersOptions {
  initialRoutes?: string[]
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
}: Readonly<{
  children: ReactNode
  initialRoutes?: string[]
}>): ReactElement {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialRoutes}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {}
): RenderWithProvidersResult {
  const user = userEvent.setup() // creates a simulated user pointer + keyboard
  const renderResult = render(ui, {
    wrapper: ({ children }) => (
      <Providers initialRoutes={options.initialRoutes}>{children}</Providers>
    ),
  })
  return { ...renderResult, user }
}
