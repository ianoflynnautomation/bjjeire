import { API_ROUTES } from '@/config/api-routes'
import { renderWithProviders } from '@/testing/render-utils'
import { createListSeeds, testApiUrl } from '@/testing/seed-helpers'
import {
  createStore,
  createPaginatedStores,
} from '@/testing/factories/store.factory'
import type { StoreDto } from '@/types/stores'
import StoresPage from '@/pages/StoresPage'

export const STORES_API = testApiUrl(API_ROUTES.stores)

const seeds = createListSeeds<StoreDto>(
  STORES_API,
  createPaginatedStores,
  () => [createStore()]
)

export const seedStores = seeds.seed
export const seedStoresPaged = seeds.seedPaged
export const seedStoresError = seeds.seedError
export const seedStoresPending = seeds.seedPending

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
