import { QueryClient } from '@tanstack/react-query'
import { describe, it, expect, vi } from 'vitest'
import { prefetchRouteData } from '../route-prefetch'
import { initialGymFilters } from '@/features/gyms/hooks/useGymsPage'

describe('prefetchRouteData', () => {
  it('given a prefetchable route id, then it primes the same first-page query key the list page uses', () => {
    const queryClient = new QueryClient()
    const spy = vi
      .spyOn(queryClient, 'prefetchQuery')
      .mockResolvedValue(undefined)

    prefetchRouteData(queryClient, 'gyms')

    expect(spy).toHaveBeenCalledTimes(1)
    // Must match usePaginatedQuery's key: [...queryKeyBase, { ...params, page }].
    expect(spy.mock.calls[0][0]).toMatchObject({
      queryKey: ['gyms', { ...initialGymFilters, page: 1 }],
    })
  })

  it('given a route with no list query (about) or an unknown id, then it does not prefetch', () => {
    const queryClient = new QueryClient()
    const spy = vi
      .spyOn(queryClient, 'prefetchQuery')
      .mockResolvedValue(undefined)

    prefetchRouteData(queryClient, 'about')
    prefetchRouteData(queryClient, 'does-not-exist')

    expect(spy).not.toHaveBeenCalled()
  })
})
