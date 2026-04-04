import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  afterEach,
} from 'vitest'
import { CompetitionOrganisation } from '@/types/competitions'
import {
  createCompetition,
  createPaginatedCompetitions,
  resetCompetitionIdCounter,
} from '@/testing/factories/competition.factory'

vi.mock('@/config/env', () => ({
  env: { API_URL: 'http://localhost/api', PAGE_NUMBER: 1, PAGE_SIZE: 20 },
}))

const { mockMsalInstance } = vi.hoisted(() => ({
  mockMsalInstance: {
    getAllAccounts: vi.fn<() => object[]>(() => []),
    acquireTokenSilent: vi.fn(),
  },
}))

vi.mock('@/lib/msal-config', () => ({
  msalInstance: mockMsalInstance,
  loginRequest: { scopes: ['test-scope'] },
}))

const { getCompetitions } = await import('../get-competitions')

const API = 'http://localhost/api/api/competition'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => {
  server.resetHandlers()
  resetCompetitionIdCounter()
})

const defaults = { page: 1, pageSize: 20 }

describe('getCompetitions', () => {
  it('sends page and pageSize with no other params when no filters are set', async () => {
    let capturedUrl!: URL
    server.use(
      http.get(API, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json(createPaginatedCompetitions([], 1, 0))
      })
    )

    await getCompetitions(defaults)

    expect(capturedUrl.searchParams.get('page')).toBe('1')
    expect(capturedUrl.searchParams.get('pageSize')).toBe('20')
    expect(capturedUrl.searchParams.has('organisation')).toBe(false)
  })

  it('includes organisation param when a specific organisation is set', async () => {
    let capturedUrl!: URL
    server.use(
      http.get(API, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json(createPaginatedCompetitions([], 1, 0))
      })
    )

    await getCompetitions({
      ...defaults,
      organisation: CompetitionOrganisation.IBJJF,
    })

    expect(capturedUrl.searchParams.get('organisation')).toBe(
      CompetitionOrganisation.IBJJF
    )
  })

  it('omits organisation param when organisation is "all"', async () => {
    let capturedUrl!: URL
    server.use(
      http.get(API, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json(createPaginatedCompetitions([], 1, 0))
      })
    )

    await getCompetitions({ ...defaults, organisation: 'all' })

    expect(capturedUrl.searchParams.has('organisation')).toBe(false)
  })

  it('sends the requested page number', async () => {
    let capturedUrl!: URL
    server.use(
      http.get(API, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json(createPaginatedCompetitions([], 2, 3))
      })
    )

    await getCompetitions({ ...defaults, page: 2 })

    expect(capturedUrl.searchParams.get('page')).toBe('2')
  })

  it('returns the paginated response from the API', async () => {
    const competition = createCompetition({
      name: 'Dublin International Open IBJJF',
    })
    server.use(
      http.get(API, () =>
        HttpResponse.json(createPaginatedCompetitions([competition], 1, 1))
      )
    )

    const result = await getCompetitions(defaults)

    expect(result.data).toHaveLength(1)
    expect(result.data[0].name).toBe('Dublin International Open IBJJF')
    expect(result.pagination.currentPage).toBe(1)
    expect(result.pagination.totalPages).toBe(1)
  })

  it('rejects when the API returns a non-2xx status', async () => {
    server.use(http.get(API, () => HttpResponse.json(null, { status: 500 })))

    await expect(getCompetitions(defaults)).rejects.toThrow()
  })
})
