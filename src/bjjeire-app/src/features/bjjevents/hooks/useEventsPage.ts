import { useCallback, useMemo } from 'react'
import type { County } from '@/constants/counties'
import type { GetBjjEventsPaginationQuery, BjjEventDto } from '@/types/event'
import { BjjEventType } from '@/types/event'
import { env } from '@/config/env'
import { useListPage, type UseListPageResult } from '@/hooks/useListPage'
import { getBjjEvents } from '@/features/bjjevents/api/get-bjj-events'
import { scrollToTop } from '@/utils/scroll-utils'
import { getCountyDisplayLabel } from '@/utils/county-utils'
import { countyUrlFilter, type ListUrlFilter } from '@/utils/list-url-state'
import { textMatchesSearch } from '@/utils/search-text'
import { readField } from '@/utils/untrusted'

export const initialEventFilters: GetBjjEventsPaginationQuery = {
  county: 'all',
  types: [],
  page: env.PAGE_NUMBER,
  pageSize: env.PAGE_SIZE,
}

const KNOWN_EVENT_TYPES = new Set<string>(Object.values(BjjEventType))

const EVENT_URL_FILTERS: readonly ListUrlFilter<GetBjjEventsPaginationQuery>[] =
  [
    countyUrlFilter<GetBjjEventsPaginationQuery>(),
    {
      key: 'types',
      read: values =>
        values.filter((value): value is BjjEventType =>
          KNOWN_EVENT_TYPES.has(value)
        ),
      write: value => (Array.isArray(value) ? value : []),
    },
  ]

function eventMatchesSearch(event: BjjEventDto, term: string): boolean {
  return [
    event.name,
    event.description,
    event.county,
    readField(event.location, 'address'),
    readField(event.organiser, 'name'),
  ].some(value => textMatchesSearch(value, term))
}

type EventFilterKey = keyof Omit<
  GetBjjEventsPaginationQuery,
  'page' | 'pageSize'
>

type UseEventsPageResult = UseListPageResult<
  BjjEventDto,
  GetBjjEventsPaginationQuery
> & {
  countyLabel: string | undefined
  handleFilterChange: (
    key: EventFilterKey,
    value: County | BjjEventType[] | 'all' | undefined
  ) => void
}

export function useEventsPage(): UseEventsPageResult {
  const listPage = useListPage<BjjEventDto, GetBjjEventsPaginationQuery>({
    queryKeyBase: ['bjjevents'],
    fetchFn: getBjjEvents,
    initialParams: initialEventFilters,
    matchesSearch: eventMatchesSearch,
    urlFilters: EVENT_URL_FILTERS,
  })

  const { activeFilters, updateFilters } = listPage

  const countyLabel = useMemo(
    () => getCountyDisplayLabel(activeFilters.county),
    [activeFilters.county]
  )

  const handleFilterChange = useCallback(
    (
      key: EventFilterKey,
      value: County | BjjEventType[] | 'all' | undefined
    ) => {
      updateFilters({ [key]: value })
      scrollToTop()
    },
    [updateFilters]
  )

  return {
    ...listPage,
    countyLabel,
    handleFilterChange,
  }
}
