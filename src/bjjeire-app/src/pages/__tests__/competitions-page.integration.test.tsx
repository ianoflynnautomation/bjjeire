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
import CompetitionsPage from '../CompetitionsPage'
import { renderWithProviders } from '@/testing/render-utils'
import {
  createCompetition,
  createPaginatedCompetitions,
  resetCompetitionIdCounter,
} from '@/testing/factories/competition.factory'

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

const API = 'http://localhost/api/api/competition'

const server = setupServer(
  optionsPassthrough,
  http.get(API, () => HttpResponse.json(createPaginatedCompetitions([], 1, 0)))
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => {
  server.resetHandlers()
  resetCompetitionIdCounter()
})

function render(): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(<CompetitionsPage />, {
    featureFlags: { BjjEvents: true, Gyms: true, Competitions: true },
  })
}

describe('CompetitionsPage Integration (API + Query + UI)', () => {
  it('shows loading state while data is being fetched', () => {
    server.use(http.get(API, () => new Promise(() => {})))
    render()

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows error state and retry button when the API fails', async () => {
    server.use(http.get(API, () => HttpResponse.json(null, { status: 500 })))
    render()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    )
  })

  it('renders competition cards when data is returned', async () => {
    server.use(
      http.get(API, () =>
        HttpResponse.json(
          createPaginatedCompetitions(
            [
              createCompetition({ name: 'Dublin International Open IBJJF' }),
              createCompetition({ name: 'NAGA Ireland' }),
            ],
            1,
            1
          )
        )
      )
    )
    render()

    expect(
      await screen.findByText('Dublin International Open IBJJF')
    ).toBeInTheDocument()
    expect(screen.getByText('NAGA Ireland')).toBeInTheDocument()
  })

  it('filters competitions by search term', async () => {
    server.use(
      http.get(API, () =>
        HttpResponse.json(
          createPaginatedCompetitions(
            [
              createCompetition({
                name: 'Dublin International Open IBJJF',
                organisation: 'IBJJF',
              }),
              createCompetition({
                name: 'NAGA Ireland',
                organisation: 'NAGA',
              }),
            ],
            1,
            1
          )
        )
      )
    )
    const { user } = render()

    await screen.findByText('Dublin International Open IBJJF')

    const searchInput = screen.getByRole('searchbox')
    await user.type(searchInput, 'NAGA')

    await waitFor(() =>
      expect(
        screen.queryByText('Dublin International Open IBJJF')
      ).not.toBeInTheDocument()
    )
    expect(screen.getByText('NAGA Ireland')).toBeInTheDocument()
  })

  it('shows empty state when no competitions are returned', async () => {
    server.use(
      http.get(API, () =>
        HttpResponse.json(createPaginatedCompetitions([], 1, 0))
      )
    )
    render()

    await waitFor(() =>
      expect(screen.getByText(/no competitions found/i)).toBeInTheDocument()
    )
  })
})
