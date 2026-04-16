import { useCallback } from 'react'
import type { County } from '@/constants/counties'
import type { GetBjjEventsPaginationQuery, BjjEventDto } from '@/types/event'
import type { BjjEventType } from '@/types/event'
import { env } from '@/config/env'
import { useListPage, type UseListPageResult } from '@/hooks/useListPage'
import { getBjjEvents } from '@/features/bjjevents/api/get-bjj-events'
import { useScrollToTop } from '@/hooks/useScrollToTop'

const initialEventFilters: GetBjjEventsPaginationQuery = {
  county: 'all',
  type: 'all',
  page: env.PAGE_NUMBER,
  pageSize: env.PAGE_SIZE,
}

function eventMatchesSearch(event: BjjEventDto, term: string): boolean {
  const lower = term.toLowerCase()
  return (
    event.name.toLowerCase().includes(lower) ||
    (event.description?.toLowerCase().includes(lower) ?? false) ||
    event.county.toLowerCase().includes(lower) ||
    (event.location?.address?.toLowerCase().includes(lower) ?? false) ||
    (event.organiser?.name?.toLowerCase().includes(lower) ?? false)
  )
}

type EventFilterKey = keyof Omit<
  GetBjjEventsPaginationQuery,
  'page' | 'pageSize'
>

type UseEventsPageResult = UseListPageResult<
  BjjEventDto,
  GetBjjEventsPaginationQuery
> & {
  handleFilterChange: (
    key: EventFilterKey,
    value: County | BjjEventType | 'all' | undefined
  ) => void
}

export function useEventsPage(): UseEventsPageResult {
  const scrollToTop = useScrollToTop()

  const listPage = useListPage<BjjEventDto, GetBjjEventsPaginationQuery>({
    queryKeyBase: ['bjjevents'],
    fetchFn: getBjjEvents,
    initialParams: initialEventFilters,
    matchesSearch: eventMatchesSearch,
  })

  const { updateFilters } = listPage

  const handleFilterChange = useCallback(
    (key: EventFilterKey, value: County | BjjEventType | 'all' | undefined) => {
      updateFilters({ [key]: value } as Partial<GetBjjEventsPaginationQuery>)
      scrollToTop()
    },
    [updateFilters, scrollToTop]
  )

  return {
    ...listPage,
    handleFilterChange,
  }
}
