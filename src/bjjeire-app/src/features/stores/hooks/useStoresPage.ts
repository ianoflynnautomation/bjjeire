import { env } from '@/config/env'
import type { StoreDto, GetStorePaginationQuery } from '@/types/stores'
import { useListPage, type UseListPageResult } from '@/hooks/useListPage'
import { getStores } from '@/features/stores/api/get-stores'

const initialStoreFilters: GetStorePaginationQuery = {
  page: env.PAGE_NUMBER,
  pageSize: env.PAGE_SIZE,
}

function storeMatchesSearch(store: StoreDto, term: string): boolean {
  const lower = term.toLowerCase()
  return (
    store.name.toLowerCase().includes(lower) ||
    (store.description?.toLowerCase().includes(lower) ?? false)
  )
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
