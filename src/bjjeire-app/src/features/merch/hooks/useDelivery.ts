import { useQuery } from '@tanstack/react-query'
import { getDelivery } from '../api/orders'
import { MERCH_STALE_TIME_MS } from './merch-query-options'
import type { ShopDeliveryDto } from '@/types/orders'

export const DELIVERY_QUERY_KEY = ['merch', 'delivery'] as const

/** The flat delivery fee shown before paying (#6006). */
export function useDelivery(): {
  delivery: ShopDeliveryDto | undefined
  isLoading: boolean
  isError: boolean
  refetch: () => unknown
} {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: DELIVERY_QUERY_KEY,
    queryFn: getDelivery,
    staleTime: MERCH_STALE_TIME_MS,
  })
  return { delivery: data, isLoading, isError, refetch }
}
