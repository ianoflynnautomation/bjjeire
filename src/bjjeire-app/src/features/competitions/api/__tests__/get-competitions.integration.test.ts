import { http, HttpResponse } from 'msw'
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '@/testing/msw/server'
import {
  createCompetition,
  createPaginatedCompetitions,
} from '@/testing/factories/competition.factory'
import { getCompetitions } from '../get-competitions'

const API = 'http://localhost/api/api/competition'
const defaults = { page: 1, pageSize: 20 }

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())

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
  it('sends page and pageSize with no other params when no filters are set', async () => {
    const { getUrl } = captureQuery()

    await getCompetitions(defaults)

    const params = getUrl().searchParams
    expect(params.get('page')).toBe('1')
    expect(params.get('pageSize')).toBe('20')
    expect(params.has('organisation')).toBe(false)
  })

  it('sends the requested page number', async () => {
    const { getUrl } = captureQuery()

    await getCompetitions({ ...defaults, page: 2 })

    expect(getUrl().searchParams.get('page')).toBe('2')
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
