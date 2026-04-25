import { useCallback, useMemo } from 'react'
import { COUNTIES } from '@/constants/counties'
import { env } from '@/config/env'
import type { GymDto, GetGymsByCountyPaginationQuery } from '@/types/gyms'
import { useListPage, type UseListPageResult } from '@/hooks/useListPage'
import { getGyms } from '@/features/gyms/api/get-gyms'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { uiContent } from '@/config/ui-content'

const { filters } = uiContent.gyms

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
    (gym.location?.address?.toLowerCase().includes(lower) ?? false) ||
    gym.offeredClasses.some(c => c.toLowerCase().includes(lower))
  )
}

type UseGymsPageResult = UseListPageResult<
  GymDto,
  GetGymsByCountyPaginationQuery
> & {
  countyLabel: string
  handleCountyChange: (countyValue: string | undefined) => void
}

export function useGymsPage(): UseGymsPageResult {
  const scrollToTop = useScrollToTop()

  const listPage = useListPage<GymDto, GetGymsByCountyPaginationQuery>({
    queryKeyBase: ['gyms'],
    fetchFn: getGyms,
    initialParams: initialGymFilters,
    matchesSearch: gymMatchesSearch,
  })

  const { activeFilters, updateFilters } = listPage

  const countyLabel = useMemo(
    () =>
      COUNTIES.find(c => c.value === activeFilters.county)?.label ??
      (activeFilters.county === 'all'
        ? filters.allCountiesOption
        : activeFilters.county) ??
      filters.allCountiesOption,
    [activeFilters.county]
  )

  const handleCountyChange = useCallback(
    (countyValue: string | undefined) => {
      updateFilters({
        county: countyValue,
      })
      scrollToTop()
    },
    [updateFilters, scrollToTop]
  )

  return {
    ...listPage,
    countyLabel,
    handleCountyChange,
  }
}
