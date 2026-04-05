import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { optionsPassthrough } from '@/testing/msw/handlers'
import { screen, waitFor } from '@testing-library/react'
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  afterEach,
} from 'vitest'
import GymsPage from '../GymsPage'
import { renderWithProviders } from '@/testing/render-utils'
import {
  createGym,
  createPaginatedGyms,
  resetGymIdCounter,
} from '@/testing/factories/gym.factory'

vi.mock('@/config/env', () => ({
  env: { API_URL: 'http://localhost/api', PAGE_NUMBER: 1, PAGE_SIZE: 20 },
}))

vi.mock('@/lib/msal-config', () => ({
  msalInstance: {
    getAllAccounts: (): object[] => [],
    acquireTokenSilent: vi.fn(),
  },
  loginRequest: { scopes: [] },
}))

const API = 'http://localhost/api/api/gym'

const server = setupServer(optionsPassthrough)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => {
  server.resetHandlers()
  resetGymIdCounter()
})

function render(): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(<GymsPage />, {
    featureFlags: { BjjEvents: true, Gyms: true },
  })
}

describe('GymsPage Integration (API + Query + UI)', () => {
  it('shows loading state while data is being fetched', () => {
    server.use(http.get(API, () => new Promise(() => {})))
    render()

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows error state and retry button when the API fails', async () => {
    server.use(http.get(API, () => HttpResponse.json(null, { status: 500 })))
    render()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('shows empty state when no gyms are returned', async () => {
    server.use(
      http.get(API, () => HttpResponse.json(createPaginatedGyms([], 1, 0)))
    )
    render()

    expect(await screen.findByText('No Gyms Found')).toBeInTheDocument()
  })

  it('renders gym cards when data loads successfully', async () => {
    server.use(
      http.get(API, () =>
        HttpResponse.json(
          createPaginatedGyms(
            [
              createGym({ name: 'Elite Fighters Academy', county: 'Dublin' }),
              createGym({ name: 'Community BJJ Club', county: 'Cork' }),
            ],
            1,
            1
          )
        )
      )
    )
    render()

    expect(
      await screen.findByText('Elite Fighters Academy')
    ).toBeInTheDocument()
    expect(screen.getByText('Community BJJ Club')).toBeInTheDocument()
  })

  it('sends the county param when a county filter is selected', async () => {
    const dublinGym = createGym({
      name: 'Elite Fighters Academy',
      county: 'Dublin',
    })
    const corkGym = createGym({ name: 'Community BJJ Club', county: 'Cork' })
    let lastRequest: URL | null = null

    server.use(
      http.get(API, ({ request }) => {
        lastRequest = new URL(request.url)
        const county = lastRequest.searchParams.get('county')
        return HttpResponse.json(
          county === 'Dublin'
            ? createPaginatedGyms([dublinGym], 1, 1)
            : createPaginatedGyms([dublinGym, corkGym], 1, 1)
        )
      })
    )

    const { user } = render()

    expect(
      await screen.findByText('Elite Fighters Academy')
    ).toBeInTheDocument()
    expect(screen.getByText('Community BJJ Club')).toBeInTheDocument()
    expect(screen.getByText('Found 2 gyms.')).toBeInTheDocument()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /select county/i }),
      'Dublin'
    )

    expect(
      await screen.findByRole('heading', { name: /bjj gyms in dublin/i })
    ).toBeInTheDocument()
    expect(screen.getByText('Found 1 gym.')).toBeInTheDocument()
    expect(screen.getByText('Elite Fighters Academy')).toBeInTheDocument()
    expect(screen.queryByText('Community BJJ Club')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(lastRequest?.searchParams.get('county')).toBe('Dublin')
      expect(lastRequest?.searchParams.get('page')).toBe('1')
    })
  })

  it('fetches the next page when the user uses pagination controls', async () => {
    const gymPage1 = createGym({ name: 'Elite Fighters Academy' })
    const gymPage2 = createGym({ name: 'Community BJJ Club' })
    let lastRequest: URL | null = null

    server.use(
      http.get(API, ({ request }) => {
        lastRequest = new URL(request.url)
        const page = lastRequest.searchParams.get('page')
        return HttpResponse.json(
          page === '2'
            ? createPaginatedGyms([gymPage2], 2, 2)
            : createPaginatedGyms([gymPage1], 1, 2)
        )
      })
    )

    const { user } = render()

    expect(
      await screen.findByText('Elite Fighters Academy')
    ).toBeInTheDocument()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /next page/i }))

    expect(await screen.findByText('Community BJJ Club')).toBeInTheDocument()
    expect(screen.getByText('2 / 2')).toBeInTheDocument()

    await waitFor(() => {
      expect(lastRequest?.searchParams.get('page')).toBe('2')
    })
  })
})
