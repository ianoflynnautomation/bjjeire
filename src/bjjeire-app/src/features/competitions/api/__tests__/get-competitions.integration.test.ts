import { http, HttpResponse } from 'msw'
import { describe, it, expect } from 'vitest'
import { API_ROUTES } from '@/config/api-routes'
import { server } from '@/testing/msw/server'
import { testApiUrl } from '@/testing/seed-helpers'
import {
  createCompetition,
  createPaginatedCompetitions,
} from '@/testing/factories/competition.factory'
import { getCompetitions } from '../get-competitions'

const API = testApiUrl(API_ROUTES.competitions)
const defaults = { page: 1, pageSize: 20 }

function captureQuery(): { getUrl: () => URL } {
  let capturedUrl!: URL
  server.use(
    http.get(API, ({ request }) => {
      capturedUrl = new URL(request.url)
      return HttpResponse.json(createPaginatedCompetitions([], 1, 0))
    })
  )
  return { getUrl: (): URL => capturedUrl }
}

describe('getCompetitions', () => {
  it('given no filters, when competitions are requested, then only page and pageSize are sent', async () => {
    const { getUrl } = captureQuery()

    await getCompetitions(defaults)

    const params = getUrl().searchParams
    expect(params.get('page')).toBe('1')
    expect(params.get('pageSize')).toBe('20')
    expect(params.has('organisation')).toBe(false)
  })

  it('given a specific page, when competitions are requested, then that page number is sent', async () => {
    const { getUrl } = captureQuery()

    await getCompetitions({ ...defaults, page: 2 })

    expect(getUrl().searchParams.get('page')).toBe('2')
  })

  it('given the API responds with competitions, when competitions are requested, then the paginated response is returned', async () => {
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

  it('given the API responds with an error status, when competitions are requested, then the request rejects', async () => {
    server.use(http.get(API, () => HttpResponse.json(null, { status: 500 })))

    await expect(getCompetitions(defaults)).rejects.toThrow()
  })
})
