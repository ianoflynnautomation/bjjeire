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
import {
  createGym,
  createPaginatedGyms,
  resetGymIdCounter,
} from '@/testing/factories/gym.factory'

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

const { getGyms } = await import('../get-gyms')

const API = 'http://localhost/api/api/gym'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => {
  server.resetHandlers()
  resetGymIdCounter()
})

const defaults = { page: 1, pageSize: 20 }

describe('getGyms', () => {
  it('sends page and pageSize with no other params when no filters are set', async () => {
    let capturedUrl!: URL
    server.use(
      http.get(API, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json(createPaginatedGyms([], 1, 0))
      })
    )

    await getGyms(defaults)

    expect(capturedUrl.searchParams.get('page')).toBe('1')
    expect(capturedUrl.searchParams.get('pageSize')).toBe('20')
    expect(capturedUrl.searchParams.has('county')).toBe(false)
  })

  it('includes county param when a county is specified', async () => {
    let capturedUrl!: URL
    server.use(
      http.get(API, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json(createPaginatedGyms([], 1, 0))
      })
    )

    await getGyms({ ...defaults, county: 'Dublin' })

    expect(capturedUrl.searchParams.get('county')).toBe('Dublin')
  })

  it('omits county param when county is "all"', async () => {
    let capturedUrl!: URL
    server.use(
      http.get(API, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json(createPaginatedGyms([], 1, 0))
      })
    )

    await getGyms({ ...defaults, county: 'all' })

    expect(capturedUrl.searchParams.has('county')).toBe(false)
  })

  it('sends the requested page number', async () => {
    let capturedUrl!: URL
    server.use(
      http.get(API, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json(createPaginatedGyms([], 2, 3))
      })
    )

    await getGyms({ ...defaults, page: 2 })

    expect(capturedUrl.searchParams.get('page')).toBe('2')
  })

  it('returns the paginated response from the API', async () => {
    const gym = createGym({ name: 'Renzo Gracie Dublin' })
    server.use(
      http.get(API, () => HttpResponse.json(createPaginatedGyms([gym], 1, 1)))
    )

    const result = await getGyms(defaults)

    expect(result.data).toHaveLength(1)
    expect(result.data[0].name).toBe('Renzo Gracie Dublin')
    expect(result.pagination.currentPage).toBe(1)
    expect(result.pagination.totalPages).toBe(1)
  })

  it('rejects when the API returns a non-2xx status', async () => {
    server.use(http.get(API, () => HttpResponse.json(null, { status: 500 })))

    await expect(getGyms(defaults)).rejects.toThrow()
  })
})
