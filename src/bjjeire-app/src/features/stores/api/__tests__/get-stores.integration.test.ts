import { http, HttpResponse } from 'msw'
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '@/testing/msw/server'
import {
  createStore,
  createPaginatedStores,
} from '@/testing/factories/store.factory'
import { getStores } from '../get-stores'

const API = 'http://localhost/api/v1/store'
const defaults = { page: 1, pageSize: 20 }

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())

function captureQuery(): { getUrl: () => URL } {
  let capturedUrl!: URL
  server.use(
    http.get(API, ({ request }) => {
      capturedUrl = new URL(request.url)
      return HttpResponse.json(createPaginatedStores([], 1, 0))
    })
  )
  return { getUrl: (): URL => capturedUrl }
}

describe('getStores', () => {
  it('sends page and pageSize params', async () => {
    const { getUrl } = captureQuery()

    await getStores(defaults)

    const params = getUrl().searchParams
    expect(params.get('page')).toBe('1')
    expect(params.get('pageSize')).toBe('20')
  })

  it('sends the requested page number', async () => {
    const { getUrl } = captureQuery()

    await getStores({ ...defaults, page: 3 })

    expect(getUrl().searchParams.get('page')).toBe('3')
  })

  it('returns the paginated response from the API', async () => {
    const store = createStore({ name: 'Tatami Fightwear' })
    server.use(
      http.get(API, () =>
        HttpResponse.json(createPaginatedStores([store], 1, 1))
      )
    )

    const result = await getStores(defaults)

    expect(result.data).toHaveLength(1)
    expect(result.data[0].name).toBe('Tatami Fightwear')
    expect(result.pagination.currentPage).toBe(1)
    expect(result.pagination.totalPages).toBe(1)
  })

  it('rejects when the API returns a non-2xx status', async () => {
    server.use(http.get(API, () => HttpResponse.json(null, { status: 500 })))

    await expect(getStores(defaults)).rejects.toThrow()
  })
})
