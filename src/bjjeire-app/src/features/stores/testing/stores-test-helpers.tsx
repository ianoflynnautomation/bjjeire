import { http, HttpResponse } from 'msw'
import { server } from '@/testing/msw/server'
import { renderWithProviders } from '@/testing/render-utils'
import {
  createStore,
  createPaginatedStores,
} from '@/testing/factories/store.factory'
import type { StoreDto } from '@/types/stores'
import type { PaginatedResponse } from '@/types/common'
import StoresPage from '@/pages/StoresPage'

export const STORES_API = 'http://localhost/api/store'

export function seedStores(stores: StoreDto[] = [createStore()]): void {
  server.use(
    http.get(STORES_API, () =>
      HttpResponse.json(createPaginatedStores(stores, 1, 1))
    )
  )
}

export function seedStoresPaged(
  pages: Record<number, PaginatedResponse<StoreDto>>
): { getLastUrl: () => URL | null } {
  let lastUrl: URL | null = null
  server.use(
    http.get(STORES_API, ({ request }) => {
      lastUrl = new URL(request.url)
      const page = Number(lastUrl.searchParams.get('page') ?? 1)
      return HttpResponse.json(pages[page] ?? pages[1])
    })
  )
  return { getLastUrl: (): URL | null => lastUrl }
}

export function seedStoresError(status = 500): void {
  server.use(http.get(STORES_API, () => HttpResponse.json(null, { status })))
}

export function seedStoresPending(): void {
  server.use(http.get(STORES_API, () => new Promise(() => {})))
}

export function renderStoresPage(): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(<StoresPage />, {
    featureFlags: {
      BjjEvents: true,
      Gyms: true,
      Competitions: true,
      Stores: true,
    },
  })
}
