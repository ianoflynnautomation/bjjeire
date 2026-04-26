import { http, HttpResponse } from 'msw'
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { BjjEventType } from '@/types/event'
import { County } from '@/constants/counties'
import { server } from '@/testing/msw/server'
import {
  createEvent,
  createPaginatedEvents,
} from '@/testing/factories/event.factory'
import { getBjjEvents } from '../get-bjj-events'

const API = 'http://localhost/api/v1/bjjevent'
const defaults = { page: 1, pageSize: 20 }

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())

function captureQuery(status = 200): { getUrl: () => URL } {
  let capturedUrl!: URL
  server.use(
    http.get(API, ({ request }) => {
      capturedUrl = new URL(request.url)
      return HttpResponse.json(createPaginatedEvents([], 1, 0), { status })
    })
  )
  return { getUrl: (): URL => capturedUrl }
}

describe('getBjjEvents', () => {
  it('sends page and pageSize with no other params when no filters are set', async () => {
    const { getUrl } = captureQuery()

    await getBjjEvents(defaults)

    const params = getUrl().searchParams
    expect(params.get('page')).toBe('1')
    expect(params.get('pageSize')).toBe('20')
    expect(params.has('county')).toBe(false)
    expect(params.has('type')).toBe(false)
  })

  it('includes county param when a county is specified', async () => {
    const { getUrl } = captureQuery()

    await getBjjEvents({ ...defaults, county: County.Dublin })

    expect(getUrl().searchParams.get('county')).toBe(County.Dublin)
  })

  it('omits county param when county is "all"', async () => {
    const { getUrl } = captureQuery()

    await getBjjEvents({ ...defaults, county: 'all' })

    expect(getUrl().searchParams.has('county')).toBe(false)
  })

  it('includes type param when an event type is specified', async () => {
    const { getUrl } = captureQuery()

    await getBjjEvents({ ...defaults, type: BjjEventType.Camp })

    expect(getUrl().searchParams.get('type')).toBe(String(BjjEventType.Camp))
  })

  it('omits type param when type is "all"', async () => {
    const { getUrl } = captureQuery()

    await getBjjEvents({ ...defaults, type: 'all' })

    expect(getUrl().searchParams.has('type')).toBe(false)
  })

  it('sends the requested page number', async () => {
    const { getUrl } = captureQuery()

    await getBjjEvents({ ...defaults, page: 3 })

    expect(getUrl().searchParams.get('page')).toBe('3')
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
