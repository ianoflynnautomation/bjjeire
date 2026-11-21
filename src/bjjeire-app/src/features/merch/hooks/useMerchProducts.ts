import { useQuery } from '@tanstack/react-query'
import { useFeatureFlag } from '@/features/feature-flags'
import { getProducts } from '@/features/merch/api/get-products'
import { MERCH_STALE_TIME_MS } from './merch-query-options'
import type { ProductSummaryDto } from '@/types/products'

/** The API's maximum page size; the merch section shows every product on one page. */
const MERCH_PAGE_SIZE = 100

/**
 * Published products for the merch section on Shop (#6001).
 *
 * While the request is loading or after it fails this returns an empty list,
 * so the directory never waits for it or shows its error. It makes no request
 * while the Merch flag is off (#6026), and the directory's search and paging
 * never refetch it (#6004).
 */
export function useMerchProducts(): ProductSummaryDto[] {
  const enabled = useFeatureFlag('Merch')
  const { data } = useQuery({
    queryKey: ['merch', 'products'],
    queryFn: () => getProducts({ page: 1, pageSize: MERCH_PAGE_SIZE }),
    enabled,
    retry: false,
    staleTime: MERCH_STALE_TIME_MS,
  })
  return enabled ? (data?.data ?? []) : []
}
