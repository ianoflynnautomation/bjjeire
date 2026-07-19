import { http, HttpResponse } from 'msw'

import { describe, it, expect } from 'vitest'
import { BjjEventType } from '@/types/event'
import { County } from '@/constants/counties'
import { API_ROUTES } from '@/config/api-routes'
import { server } from '@/testing/msw/server'
import { testApiUrl } from '@/testing/seed-helpers'
import {
  createEvent,
  createPaginatedEvents,
} from '@/testing/factories/event.factory'
import { getBjjEvents } from '../get-bjj-events'

const API = testApiUrl(API_ROUTES.bjjEvents)
const defaults = { page: 1, pageSize: 20 }

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
  it('given no filters, when events are requested, then only page and pageSize are sent', async () => {
    const { getUrl } = captureQuery()

    await getBjjEvents(defaults)

    const params = getUrl().searchParams
    expect(params.get('page')).toBe('1')
    expect(params.get('pageSize')).toBe('20')
    expect(params.has('county')).toBe(false)
    expect(params.has('types')).toBe(false)
  })

  it('given a county filter, when events are requested, then the county param is sent', async () => {
    const { getUrl } = captureQuery()

    await getBjjEvents({ ...defaults, county: County.Dublin })

    expect(getUrl().searchParams.get('county')).toBe(County.Dublin)
  })

  it('given the county filter is "all", when events are requested, then the county param is omitted', async () => {
    const { getUrl } = captureQuery()

    await getBjjEvents({ ...defaults, county: 'all' })

    expect(getUrl().searchParams.has('county')).toBe(false)
  })

  it('given a single event type filter, when events are requested, then one types param is sent', async () => {
    const { getUrl } = captureQuery()

    await getBjjEvents({ ...defaults, types: [BjjEventType.Camp] })

    expect(getUrl().searchParams.getAll('types')).toEqual([
      String(BjjEventType.Camp),
    ])
  })

  it('given multiple event type filters, when events are requested, then the types param is repeated per type', async () => {
    const { getUrl } = captureQuery()

    await getBjjEvents({
      ...defaults,
      types: [BjjEventType.Camp, BjjEventType.Seminar],
    })

    expect(getUrl().searchParams.getAll('types')).toEqual([
      String(BjjEventType.Camp),
      String(BjjEventType.Seminar),
    ])
  })

  it('given an empty types filter, when events are requested, then the types param is omitted', async () => {
    const { getUrl } = captureQuery()

    await getBjjEvents({ ...defaults, types: [] })

    expect(getUrl().searchParams.has('types')).toBe(false)
  })

  it('given a specific page, when events are requested, then that page number is sent', async () => {
    const { getUrl } = captureQuery()

    await getBjjEvents({ ...defaults, page: 3 })

    expect(getUrl().searchParams.get('page')).toBe('3')
  })

  it('given the API responds with events, when events are requested, then the paginated response is returned', async () => {
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

  it('given the API responds with an error status, when events are requested, then the request rejects', async () => {
    server.use(http.get(API, () => HttpResponse.json(null, { status: 500 })))

    await expect(getBjjEvents(defaults)).rejects.toThrow()
  })
})
