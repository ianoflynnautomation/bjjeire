import { noop, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { getGyms } from '@/features/gyms/api/get-gyms'
import { getBjjEvents } from '@/features/bjjevents/api/get-bjj-events'
import { getCompetitions } from '@/features/competitions/api/get-competitions'
import { getStores } from '@/features/stores/api/get-stores'
import { initialGymFilters } from '@/features/gyms/hooks/useGymsPage'
import { initialEventFilters } from '@/features/bjjevents/hooks/useEventsPage'
import { initialCompetitionFilters } from '@/features/competitions/hooks/useCompetitionsPage'
import { initialStoreFilters } from '@/features/stores/hooks/useStoresPage'

const PREFETCH_STALE_TIME = 30_000

// Normalise to the settled first-page params a list page uses after mount.
const withPage = <T extends { page?: number }>(params: T): T => ({
  ...params,
  page: params.page ?? 1,
})

// Each entry primes the exact cache entry its list page reads on mount. The key
// mirrors usePaginatedQuery: `[...queryKeyBase, { ...params, page: currentPage }]`.
// Keep these query keys in sync with the corresponding feature hook.
const registry: Partial<
  Record<string, (queryClient: QueryClient) => Promise<void>>
> = {
  events: queryClient =>
    queryClient
      .query({
        queryKey: ['bjjevents', withPage(initialEventFilters)],
        queryFn: () => getBjjEvents(withPage(initialEventFilters)),
        staleTime: PREFETCH_STALE_TIME,
      })
      // Discard the data and swallow errors, as prefetchQuery did.
      .then(noop, noop),
  gyms: queryClient =>
    queryClient
      .query({
        queryKey: ['gyms', withPage(initialGymFilters)],
        queryFn: () => getGyms(withPage(initialGymFilters)),
        staleTime: PREFETCH_STALE_TIME,
      })
      .then(noop, noop),
  competitions: queryClient =>
    queryClient
      .query({
        queryKey: ['competitions', withPage(initialCompetitionFilters)],
        queryFn: () => getCompetitions(withPage(initialCompetitionFilters)),
        staleTime: PREFETCH_STALE_TIME,
      })
      .then(noop, noop),
  stores: queryClient =>
    queryClient
      .query({
        queryKey: ['stores', withPage(initialStoreFilters)],
        queryFn: () => getStores(withPage(initialStoreFilters)),
        staleTime: PREFETCH_STALE_TIME,
      })
      .then(noop, noop),
}

/** Warm the first page of a route's data. No-op for routes without a list query (e.g. About). */
export function prefetchRouteData(queryClient: QueryClient, id: string): void {
  void registry[id]?.(queryClient)
}

/** Returns a handler that prefetches a nav route's data on hover/focus. */
export function useRoutePrefetch(): (id: string) => void {
  const queryClient = useQueryClient()
  return (id: string) => prefetchRouteData(queryClient, id)
}
