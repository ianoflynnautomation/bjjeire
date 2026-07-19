import { http, HttpResponse } from 'msw'
import { describe, it, expect } from 'vitest'
import { API_ROUTES } from '@/config/api-routes'
import { server } from '@/testing/msw/server'
import { testApiUrl } from '@/testing/seed-helpers'
import {
  createStore,
  createPaginatedStores,
} from '@/testing/factories/store.factory'
import { getStores } from '../get-stores'

const API = testApiUrl(API_ROUTES.stores)
const defaults = { page: 1, pageSize: 20 }

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
  it('given default paging, when stores are requested, then page and pageSize are sent', async () => {
    const { getUrl } = captureQuery()

    await getStores(defaults)

    const params = getUrl().searchParams
    expect(params.get('page')).toBe('1')
    expect(params.get('pageSize')).toBe('20')
  })

  it('given a specific page, when stores are requested, then that page number is sent', async () => {
    const { getUrl } = captureQuery()

    await getStores({ ...defaults, page: 3 })

    expect(getUrl().searchParams.get('page')).toBe('3')
  })

  it('given the API responds with stores, when stores are requested, then the paginated response is returned', async () => {
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

  it('given the API responds with an error status, when stores are requested, then the request rejects', async () => {
    server.use(http.get(API, () => HttpResponse.json(null, { status: 500 })))

    await expect(getStores(defaults)).rejects.toThrow()
  })
})
