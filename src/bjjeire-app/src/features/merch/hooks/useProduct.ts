import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { getProduct } from '@/features/merch/api/get-products'
import { MERCH_STALE_TIME_MS } from './merch-query-options'
import type { ProductDto } from '@/types/products'
import { formatFetchError } from '@/utils/error-utils'

export interface UseProductResult {
  product: ProductDto | undefined
  isLoading: boolean
  /** The API has no published product at this slug: unknown, a draft or hidden. */
  isNotFound: boolean
  error: Error | null
  formattedErrorMessage: string
  refetch: () => unknown
}

export function useProduct(slug: string): UseProductResult {
  const { data, isLoading, error, refetch } = useQuery<ProductDto>({
    queryKey: ['merch', 'product', slug],
    queryFn: () => getProduct(slug),
    enabled: slug !== '',
    staleTime: MERCH_STALE_TIME_MS,
  })
  const isNotFound =
    slug === '' || (isAxiosError(error) && error.response?.status === 404)

  return {
    product: data,
    isLoading,
    isNotFound,
    error,
    formattedErrorMessage: formatFetchError(error),
    refetch,
  }
}
