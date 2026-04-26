import type { StoreDto } from '@/types/stores'
import type { PaginatedResponse } from '@/types/common'

let _storeId = 0

export function resetStoreIdCounter(): void {
  _storeId = 0
}

export function createStore(overrides: Partial<StoreDto> = {}): StoreDto {
  const id = ++_storeId
  return {
    id: `store-id-${id}`,
    name: `Test Store ${id}`,
    description: `Description for store ${id}`,
    websiteUrl: `https://example.com/store-${id}`,
    logoUrl: `https://example.com/logo-${id}.png`,
    isActive: true,
    ...overrides,
  }
}

export function createPaginatedStores(
  stores: StoreDto[],
  page: number,
  totalPages: number
): PaginatedResponse<StoreDto> {
  return {
    data: stores,
    pagination: {
      totalItems: stores.length,
      currentPage: page,
      pageSize: 20,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPageUrl: page < totalPages ? `/api/store?page=${page + 1}` : null,
      previousPageUrl: page > 1 ? `/api/store?page=${page - 1}` : null,
    },
  }
}
