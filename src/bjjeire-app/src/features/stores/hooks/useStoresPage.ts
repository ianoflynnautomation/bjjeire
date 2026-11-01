import { env } from '@/config/env'
import type { StoreDto, GetStorePaginationQuery } from '@/types/stores'
import { useListPage, type UseListPageResult } from '@/hooks/useListPage'
import { getStores } from '@/features/stores/api/get-stores'
import { textMatchesSearch } from '@/utils/search-text'

export const initialStoreFilters: GetStorePaginationQuery = {
  page: env.PAGE_NUMBER,
  pageSize: env.PAGE_SIZE,
}

function storeMatchesSearch(store: StoreDto, term: string): boolean {
  return textMatchesSearch(store.name, term)
}

export type UseStoresPageResult = UseListPageResult<
  StoreDto,
  GetStorePaginationQuery
>

export function useStoresPage(): UseStoresPageResult {
  return useListPage<StoreDto, GetStorePaginationQuery>({
    queryKeyBase: ['stores'],
    fetchFn: getStores,
    initialParams: initialStoreFilters,
    matchesSearch: storeMatchesSearch,
  })
}
