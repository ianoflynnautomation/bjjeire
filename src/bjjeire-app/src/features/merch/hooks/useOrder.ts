import { useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import type { OrderDto } from '@/types/orders'
import { formatFetchError } from '@/utils/error-utils'
import { getOrder } from '../api/orders'
import { POLL_INTERVAL_MS, shouldKeepPolling } from '../utils/order-key'

const ORDER_ID = /^[0-9a-f]{24}$/u

export interface UseOrderResult {
  order: OrderDto | undefined
  isLoading: boolean
  /** No key, a wrong key or an unknown order: the API answers all three alike (#6011). */
  isNotFound: boolean
  /** Still awaiting payment after every poll (#6007). */
  gaveUpPolling: boolean
  error: Error | null
  formattedErrorMessage: string
  refetch: () => unknown
}

/**
 * Reads a guest's order with its key. After the return from Stripe it asks
 * again every 2 seconds, up to 30 times, until the webhook confirms it (#6007).
 */
export function useOrder(
  id: string,
  key: string | null,
  returnedFromCheckout: boolean
): UseOrderResult {
  const queryClient = useQueryClient()
  const queryKey = ['merch', 'order', id, key]
  // A cut-off link reads as not found, never as a server error (QA 4).
  const validId = ORDER_ID.test(id)
  // dataUpdatedAt is read so each poll re-renders, even when the order is unchanged (QA 1).
  const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery<OrderDto>(
    {
      queryKey,
      queryFn: () => getOrder(id, key ?? ''),
      enabled: validId && key !== null,
      retry: false,
      refetchInterval: query =>
        query.state.data !== undefined &&
        shouldKeepPolling(
          query.state.data.status,
          query.state.dataUpdateCount,
          returnedFromCheckout
        )
          ? POLL_INTERVAL_MS
          : false,
    }
  )
  const reads =
    dataUpdatedAt > 0
      ? (queryClient.getQueryState(queryKey)?.dataUpdateCount ?? 0)
      : 0
  return {
    order: data,
    isLoading: isLoading && key !== null && validId,
    isNotFound:
      !validId ||
      key === null ||
      (isAxiosError(error) && error.response?.status === 404),
    gaveUpPolling:
      returnedFromCheckout &&
      data?.status === 'AWAITING_PAYMENT' &&
      !shouldKeepPolling(data.status, reads, true),
    error,
    formattedErrorMessage: formatFetchError(error),
    refetch,
  }
}
