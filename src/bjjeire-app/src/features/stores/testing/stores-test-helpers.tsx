import { API_ROUTES } from '@/config/api-routes'
import { renderWithProviders } from '@/testing/render-utils'
import { createListSeeds, testApiUrl } from '@/testing/seed-helpers'
import {
  createStore,
  createPaginatedStores,
} from '@/testing/factories/store.factory'
import type { StoreDto } from '@/types/stores'
import ShopPage from '@/pages/ShopPage'
import type { FeatureFlagName } from '@/features/feature-flags/definitions'

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

export function renderShopPage(
  flags: Partial<Record<FeatureFlagName, boolean>> = {}
): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(<ShopPage />, {
    featureFlags: {
      BjjEvents: true,
      Gyms: true,
      Competitions: true,
      Stores: true,
      ...flags,
    },
  })
}
