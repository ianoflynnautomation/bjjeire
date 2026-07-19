import { useCallback, useMemo } from 'react'
import { env } from '@/config/env'
import type { GymDto, GetGymsByCountyPaginationQuery } from '@/types/gyms'
import { useListPage, type UseListPageResult } from '@/hooks/useListPage'
import { getGyms } from '@/features/gyms/api/get-gyms'
import { scrollToTop } from '@/utils/scroll-utils'
import { getCountyDisplayLabel } from '@/utils/county-utils'

const initialGymFilters: GetGymsByCountyPaginationQuery = {
  county: 'all',
  page: env.PAGE_NUMBER,
  pageSize: env.PAGE_SIZE,
}

function gymMatchesSearch(gym: GymDto, term: string): boolean {
  const lower = term.toLowerCase()
  return (
    gym.name.toLowerCase().includes(lower) ||
    (gym.description?.toLowerCase().includes(lower) ?? false) ||
    gym.county.toLowerCase().includes(lower) ||
    gym.location.address.toLowerCase().includes(lower) ||
    gym.offeredClasses.some(c => c.toLowerCase().includes(lower))
  )
}

type UseGymsPageResult = UseListPageResult<
  GymDto,
  GetGymsByCountyPaginationQuery
> & {
  countyLabel: string | undefined
  handleCountyChange: (countyValue: string | undefined) => void
}

export function useGymsPage(): UseGymsPageResult {
  const listPage = useListPage<GymDto, GetGymsByCountyPaginationQuery>({
    queryKeyBase: ['gyms'],
    fetchFn: getGyms,
    initialParams: initialGymFilters,
    matchesSearch: gymMatchesSearch,
  })

  const { activeFilters, updateFilters } = listPage

  const countyLabel = useMemo(
    () => getCountyDisplayLabel(activeFilters.county),
    [activeFilters.county]
  )

  const handleCountyChange = useCallback(
    (countyValue: string | undefined) => {
      updateFilters({
        county: countyValue,
      })
      scrollToTop()
    },
    [updateFilters]
  )

  return {
    ...listPage,
    countyLabel,
    handleCountyChange,
  }
}
