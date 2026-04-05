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
import EventsPage from '../EventsPage'
import { BjjEventType } from '@/types/event'
import { County } from '@/constants/counties'
import { renderWithProviders } from '@/testing/render-utils'
import {
  createEvent,
  createPaginatedEvents,
  resetEventIdCounter,
} from '@/testing/factories/event.factory'

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

const API = 'http://localhost/api/api/bjjevent'

const server = setupServer(optionsPassthrough)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => {
  server.resetHandlers()
  resetEventIdCounter()
})

function render(): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(<EventsPage />, {
    featureFlags: { BjjEvents: true, Gyms: true },
  })
}

describe('EventsPage Integration (API + Query + UI)', () => {
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

  it('shows empty state when no events are returned', async () => {
    server.use(
      http.get(API, () => HttpResponse.json(createPaginatedEvents([], 1, 0)))
    )
    render()

    expect(await screen.findByText('No Events Found')).toBeInTheDocument()
  })

  it('renders event cards when data loads successfully', async () => {
    server.use(
      http.get(API, () =>
        HttpResponse.json(
          createPaginatedEvents(
            [
              createEvent({
                name: 'Dublin Open Mat 2026',
                county: County.Dublin,
              }),
              createEvent({ name: 'Cork Seminar', county: County.Cork }),
            ],
            1,
            1
          )
        )
      )
    )
    render()

    expect(await screen.findByText('Dublin Open Mat 2026')).toBeInTheDocument()
    expect(screen.getByText('Cork Seminar')).toBeInTheDocument()
  })

  it('sends the county param when a county filter is selected', async () => {
    const dublinEvent = createEvent({
      name: 'Dublin Open Mat 2026',
      county: County.Dublin,
    })
    const corkEvent = createEvent({ name: 'Cork Seminar', county: County.Cork })
    let lastRequest: URL | null = null

    server.use(
      http.get(API, ({ request }) => {
        lastRequest = new URL(request.url)
        const county = lastRequest.searchParams.get('county')
        return HttpResponse.json(
          county === 'Dublin'
            ? createPaginatedEvents([dublinEvent], 1, 1)
            : createPaginatedEvents([dublinEvent, corkEvent], 1, 1)
        )
      })
    )

    const { user } = render()

    expect(await screen.findByText('Dublin Open Mat 2026')).toBeInTheDocument()
    expect(screen.getByText('Cork Seminar')).toBeInTheDocument()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /select county/i }),
      'Dublin'
    )

    expect(
      await screen.findByRole('heading', { name: /bjj events in dublin/i })
    ).toBeInTheDocument()
    expect(screen.getByText('Dublin Open Mat 2026')).toBeInTheDocument()
    expect(screen.queryByText('Cork Seminar')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(lastRequest?.searchParams.get('county')).toBe('Dublin')
      expect(lastRequest?.searchParams.get('page')).toBe('1')
    })
  })

  it('sends the type param when an event type filter is selected', async () => {
    const openMat = createEvent({
      name: 'Dublin Open Mat',
      type: BjjEventType.OpenMat,
    })
    const tournament = createEvent({
      name: 'Cork Tournament',
      type: BjjEventType.Tournament,
    })
    let lastRequest: URL | null = null

    server.use(
      http.get(API, ({ request }) => {
        lastRequest = new URL(request.url)
        const type = lastRequest.searchParams.get('type')
        return HttpResponse.json(
          type === String(BjjEventType.Tournament)
            ? createPaginatedEvents([tournament], 1, 1)
            : createPaginatedEvents([openMat, tournament], 1, 1)
        )
      })
    )

    const { user } = render()

    expect(await screen.findByText('Dublin Open Mat')).toBeInTheDocument()
    expect(screen.getByText('Cork Tournament')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /tournament/i }))

    expect(await screen.findByText('Cork Tournament')).toBeInTheDocument()
    expect(screen.queryByText('Dublin Open Mat')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(lastRequest?.searchParams.get('type')).toBe(
        String(BjjEventType.Tournament)
      )
      expect(lastRequest?.searchParams.get('page')).toBe('1')
    })
  })

  it('fetches the next page when the user uses pagination controls', async () => {
    const eventPage1 = createEvent({ name: 'Dublin Open Mat 2026' })
    const eventPage2 = createEvent({ name: 'Cork Seminar' })
    let lastRequest: URL | null = null

    server.use(
      http.get(API, ({ request }) => {
        lastRequest = new URL(request.url)
        const page = lastRequest.searchParams.get('page')
        return HttpResponse.json(
          page === '2'
            ? createPaginatedEvents([eventPage2], 2, 2)
            : createPaginatedEvents([eventPage1], 1, 2)
        )
      })
    )

    const { user } = render()

    expect(await screen.findByText('Dublin Open Mat 2026')).toBeInTheDocument()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /next page/i }))

    expect(await screen.findByText('Cork Seminar')).toBeInTheDocument()
    expect(screen.getByText('2 / 2')).toBeInTheDocument()

    await waitFor(() => {
      expect(lastRequest?.searchParams.get('page')).toBe('2')
    })
  })
})
