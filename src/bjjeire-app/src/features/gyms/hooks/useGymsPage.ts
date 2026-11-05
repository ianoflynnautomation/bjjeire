import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { env } from '@/config/env'
import type { GymDto, GetGymsByCountyPaginationQuery } from '@/types/gyms'
import { useListPage, type UseListPageResult } from '@/hooks/useListPage'
import { getGyms } from '@/features/gyms/api/get-gyms'
import { scrollToTop } from '@/utils/scroll-utils'
import { getCountyDisplayLabel } from '@/utils/county-utils'
import { countyUrlFilter } from '@/utils/list-url-state'
import { textMatchesSearch } from '@/utils/search-text'
import { useFeatureFlag } from '@/features/feature-flags'
import {
  readGymView,
  withGymView,
  type GymView,
} from '@/features/gyms/utils/gym-view-url'

export const initialGymFilters: GetGymsByCountyPaginationQuery = {
  county: 'all',
  page: env.PAGE_NUMBER,
  pageSize: env.PAGE_SIZE,
}

const GYM_URL_FILTERS = [countyUrlFilter<GetGymsByCountyPaginationQuery>()]

function gymMatchesSearch(gym: GymDto, term: string): boolean {
  return (
    textMatchesSearch(gym.name, term) || textMatchesSearch(gym.county, term)
  )
}

type UseGymsPageResult = UseListPageResult<
  GymDto,
  GetGymsByCountyPaginationQuery
> & {
  countyLabel: string | undefined
  handleCountyChange: (countyValue: string | undefined) => void
  isMapEnabled: boolean
  view: GymView
  handleViewChange: (view: GymView) => void
}

export function useGymsPage(): UseGymsPageResult {
  const [searchParams, setSearchParams] = useSearchParams()
  const isMapEnabled = useFeatureFlag('GymsMap')
  // With the flag off a map link is just the list. The URL is left alone.
  const view = isMapEnabled ? readGymView(searchParams) : 'list'

  const listPage = useListPage<GymDto, GetGymsByCountyPaginationQuery>({
    queryKeyBase: ['gyms'],
    fetchFn: getGyms,
    initialParams: initialGymFilters,
    matchesSearch: gymMatchesSearch,
    urlFilters: GYM_URL_FILTERS,
    loadAll: view === 'map',
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

  function handleViewChange(nextView: GymView): void {
    if (nextView !== view) {
      setSearchParams(withGymView(searchParams, nextView))
    }
  }

  return {
    ...listPage,
    countyLabel,
    handleCountyChange,
    isMapEnabled,
    view,
    handleViewChange,
  }
}
