import { http, HttpResponse } from 'msw'
import { describe, it, expect } from 'vitest'
import { API_ROUTES } from '@/config/api-routes'
import { server } from '@/testing/msw/server'
import { testApiUrl } from '@/testing/seed-helpers'
import { createGym, createPaginatedGyms } from '@/testing/factories/gym.factory'
import { getGyms } from '../get-gyms'

const API = testApiUrl(API_ROUTES.gyms)
const defaults = { page: 1, pageSize: 20 }

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
  it('given no filters, when gyms are requested, then only page and pageSize are sent', async () => {
    const { getUrl } = captureQuery()

    await getGyms(defaults)

    const params = getUrl().searchParams
    expect(params.get('page')).toBe('1')
    expect(params.get('pageSize')).toBe('20')
    expect(params.has('county')).toBe(false)
  })

  it('given a county filter, when gyms are requested, then the county param is sent', async () => {
    const { getUrl } = captureQuery()

    await getGyms({ ...defaults, county: 'Dublin' })

    expect(getUrl().searchParams.get('county')).toBe('Dublin')
  })

  it('given the county filter is "all", when gyms are requested, then the county param is omitted', async () => {
    const { getUrl } = captureQuery()

    await getGyms({ ...defaults, county: 'all' })

    expect(getUrl().searchParams.has('county')).toBe(false)
  })

  it('given a specific page, when gyms are requested, then that page number is sent', async () => {
    const { getUrl } = captureQuery()

    await getGyms({ ...defaults, page: 2 })

    expect(getUrl().searchParams.get('page')).toBe('2')
  })

  it('given the API responds with gyms, when gyms are requested, then the paginated response is returned', async () => {
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

  it('given the API responds with an error status, when gyms are requested, then the request rejects', async () => {
    server.use(http.get(API, () => HttpResponse.json(null, { status: 500 })))

    await expect(getGyms(defaults)).rejects.toThrow()
  })
})
