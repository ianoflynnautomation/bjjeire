import { http, HttpResponse } from 'msw'
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from 'vitest'
import { server } from '@/testing/msw/server'
import {
  createGym,
  createPaginatedGyms,
} from '@/testing/factories/gym.factory'
import { getGyms } from '../get-gyms'

const API = 'http://localhost/api/api/gym'
const defaults = { page: 1, pageSize: 20 }

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())

function captureQuery(): { getUrl: () => URL } {
  let capturedUrl!: URL
  server.use(
    http.get(API, ({ request }) => {
      capturedUrl = new URL(request.url)
      return HttpResponse.json(createPaginatedGyms([], 1, 0))
    })
  )
  return { getUrl: (): URL => capturedUrl }
}

describe('getGyms', () => {
  it('sends page and pageSize with no other params when no filters are set', async () => {
    const { getUrl } = captureQuery()

    await getGyms(defaults)

    const params = getUrl().searchParams
    expect(params.get('page')).toBe('1')
    expect(params.get('pageSize')).toBe('20')
    expect(params.has('county')).toBe(false)
  })

  it('includes county param when a county is specified', async () => {
    const { getUrl } = captureQuery()

    await getGyms({ ...defaults, county: 'Dublin' })

    expect(getUrl().searchParams.get('county')).toBe('Dublin')
  })

  it('omits county param when county is "all"', async () => {
    const { getUrl } = captureQuery()

    await getGyms({ ...defaults, county: 'all' })

    expect(getUrl().searchParams.has('county')).toBe(false)
  })

  it('sends the requested page number', async () => {
    const { getUrl } = captureQuery()

    await getGyms({ ...defaults, page: 2 })

    expect(getUrl().searchParams.get('page')).toBe('2')
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
