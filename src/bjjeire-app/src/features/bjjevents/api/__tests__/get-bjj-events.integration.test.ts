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
import { BjjEventType } from '@/types/event'
import { County } from '@/constants/counties'
import {
  createEvent,
  createPaginatedEvents,
  resetEventIdCounter,
} from '@/testing/factories/event.factory'

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

const { getBjjEvents } = await import('../get-bjj-events')

const API = 'http://localhost/api/api/bjjevent'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => {
  server.resetHandlers()
  resetEventIdCounter()
})

const defaults = { page: 1, pageSize: 20 }

describe('getBjjEvents', () => {
  it('sends page and pageSize with no other params when no filters are set', async () => {
    let capturedUrl!: URL
    server.use(
      http.get(API, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json(createPaginatedEvents([], 1, 0))
      })
    )

    await getBjjEvents(defaults)

    expect(capturedUrl.searchParams.get('page')).toBe('1')
    expect(capturedUrl.searchParams.get('pageSize')).toBe('20')
    expect(capturedUrl.searchParams.has('county')).toBe(false)
    expect(capturedUrl.searchParams.has('type')).toBe(false)
  })

  it('includes county param when a county is specified', async () => {
    let capturedUrl!: URL
    server.use(
      http.get(API, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json(createPaginatedEvents([], 1, 0))
      })
    )

    await getBjjEvents({ ...defaults, county: County.Dublin })

    expect(capturedUrl.searchParams.get('county')).toBe(County.Dublin)
  })

  it('omits county param when county is "all"', async () => {
    let capturedUrl!: URL
    server.use(
      http.get(API, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json(createPaginatedEvents([], 1, 0))
      })
    )

    await getBjjEvents({ ...defaults, county: 'all' })

    expect(capturedUrl.searchParams.has('county')).toBe(false)
  })

  it('includes type param when an event type is specified', async () => {
    let capturedUrl!: URL
    server.use(
      http.get(API, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json(createPaginatedEvents([], 1, 0))
      })
    )

    await getBjjEvents({ ...defaults, type: BjjEventType.Camp })

    expect(capturedUrl.searchParams.get('type')).toBe(String(BjjEventType.Camp))
  })

  it('omits type param when type is "all"', async () => {
    let capturedUrl!: URL
    server.use(
      http.get(API, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json(createPaginatedEvents([], 1, 0))
      })
    )

    await getBjjEvents({ ...defaults, type: 'all' })

    expect(capturedUrl.searchParams.has('type')).toBe(false)
  })

  it('sends the requested page number', async () => {
    let capturedUrl!: URL
    server.use(
      http.get(API, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json(createPaginatedEvents([], 3, 5))
      })
    )

    await getBjjEvents({ ...defaults, page: 3 })

    expect(capturedUrl.searchParams.get('page')).toBe('3')
  })

  it('returns the paginated response from the API', async () => {
    const event = createEvent({ name: 'Dublin Open Mat' })
    server.use(
      http.get(API, () =>
        HttpResponse.json(createPaginatedEvents([event], 1, 1))
      )
    )

    const result = await getBjjEvents(defaults)

    expect(result.data).toHaveLength(1)
    expect(result.data[0].name).toBe('Dublin Open Mat')
    expect(result.pagination.currentPage).toBe(1)
    expect(result.pagination.totalPages).toBe(1)
  })

  it('rejects when the API returns a non-2xx status', async () => {
    server.use(http.get(API, () => HttpResponse.json(null, { status: 500 })))

    await expect(getBjjEvents(defaults)).rejects.toThrow()
  })
})
