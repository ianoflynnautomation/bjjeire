import { useCallback, type ReactElement } from 'react'
import type { County } from '@/constants/counties'
import type { GetBjjEventsPaginationQuery, BjjEventDto } from '@/types/event'
import type { BjjEventType } from '@/types/event'
import EventFilters from '@/features/bjjevents/components/event-filters/event-filters'
import Pagination from '@/components/ui/grid/pagination'
import { EventsPageHeader } from '@/features/bjjevents/components/event-page-header'
import { EventsHeroBanner } from '@/features/bjjevents/components/events-hero-banner'
import EventsList from '@/features/bjjevents/components/event-list'
import { env } from '@/config/env'
import { EventsPageTestIds } from '@/constants/eventDataTestIds'
import PageErrorBoundary from '@/components/error/page-error-boundary'
import PageLayout from '@/components/layout/page-layout'
import { ContentRenderer } from '@/components/ui/state/content-renderer-state'
import { useScrollToTop } from '@/utils/scrollUtils'
import { formatFetchError } from '@/utils/errorUtils'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { getBjjEvents } from '@/features/bjjevents/api/get-bjj-events'

const initialEventFilters: GetBjjEventsPaginationQuery = {
  county: 'all',
  type: 'all',
  page: env.PAGE_NUMBER,
  pageSize: env.PAGE_SIZE,
}

export default function EventsPage(): ReactElement {
  const scrollToTop = useScrollToTop()

  const {
    data: paginatedEventsData,
    pagination: paginationInfo,
    isLoading,
    isFetching,
    error: fetchError,
    params: activeFilters,
    currentPage,
    handlePageChange: rawHandlePageChange,
    updateFilters,
    refetch,
  } = usePaginatedQuery<BjjEventDto, GetBjjEventsPaginationQuery>({
    queryKeyBase: ['bjjevents'],
    fetchFn: getBjjEvents,
    initialParams: initialEventFilters,
  })

  const events = paginatedEventsData ?? []

  const handleFilterChange = useCallback(
    (
      key: keyof Omit<GetBjjEventsPaginationQuery, 'page' | 'pageSize'>,
      value: County | BjjEventType | 'all' | undefined
    ) => {
      updateFilters({ [key]: value } as Partial<GetBjjEventsPaginationQuery>)
      scrollToTop()
    },
    [updateFilters, scrollToTop]
  )

  const onPageChange = useCallback(
    (url: string | null, page?: number) => {
      rawHandlePageChange(url, page)
      scrollToTop()
    },
    [rawHandlePageChange, scrollToTop]
  )

  const formattedErrorMessage = formatFetchError(fetchError)
  const isInitialLoading = isLoading && events.length === 0

  return (
    <PageErrorBoundary errorMessage="Failed to load events. Please try again.">
      <PageLayout>
        <EventsHeroBanner />

        <EventsPageHeader
          countyName={activeFilters.county}
          totalEvents={paginationInfo?.totalItems}
          dataTestId={EventsPageTestIds.HEADER}
        />

        <div className="mb-8 pb-8 border-b border-white/[0.08]">
          <EventFilters
            selectedCity={activeFilters.county}
            selectedType={activeFilters.type}
            onCityChange={city => handleFilterChange('county', city)}
            onTypeChange={type => handleFilterChange('type', type)}
            disabled={isFetching || isLoading}
            dataTestId={EventsPageTestIds.FILTERS}
          />
        </div>

        <section className="relative" aria-live="polite" aria-busy={isFetching}>
          <ContentRenderer
            isLoading={isLoading}
            isFetching={isFetching}
            fetchError={fetchError}
            formattedErrorMessage={formattedErrorMessage}
            onRetry={refetch}
            data={events}
            renderDataComponent={data => <EventsList events={data} />}
            noDataTitle="No Events Found"
            noDataMessageLine1="No events match your current filters."
            noDataMessageLine2="Try a different filter to find events."
            isInitialLoad={isInitialLoading}
            showBackgroundFetchingIndicator={events.length > 0}
          />
        </section>

        {paginationInfo &&
          paginationInfo.totalPages > 1 &&
          !fetchError &&
          events.length > 0 && (
            <div className="mt-10 border-t border-white/[0.08] pt-8">
              <Pagination
                currentPage={currentPage}
                pagination={paginationInfo}
                onPageChange={onPageChange}
              />
            </div>
          )}
      </PageLayout>
    </PageErrorBoundary>
  )
}
