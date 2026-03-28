import type { JSX } from 'react'
import EventFilters from '@/features/bjjevents/components/event-filters/event-filters'
import Pagination from '@/components/ui/grid/pagination'
import { EventsPageHeader } from '@/features/bjjevents/components/event-page-header'
import { EventsHeroBanner } from '@/features/bjjevents/components/events-hero-banner'
import EventsList from '@/features/bjjevents/components/event-list'
import { EventsPageTestIds } from '@/constants/eventDataTestIds'
import PageErrorBoundary from '@/components/error/page-error-boundary'
import PageLayout from '@/components/layout/page-layout'
import { ContentRenderer } from '@/components/ui/state/content-renderer-state'
import { useEventsPage } from '@/features/bjjevents/hooks/useEventsPage'

export default function EventsPage(): JSX.Element {
  const {
    events,
    paginationInfo,
    isLoading,
    isFetching,
    activeFilters,
    currentPage,
    formattedErrorMessage,
    isInitialLoading,
    fetchError,
    handleFilterChange,
    onPageChange,
    refetch,
  } = useEventsPage()

  return (
    <PageErrorBoundary errorMessage="Failed to load events. Please try again.">
      <PageLayout>
        <EventsHeroBanner />

        <EventsPageHeader
          countyName={activeFilters.county}
          totalEvents={paginationInfo?.totalItems}
          data-testid={EventsPageTestIds.HEADER}
        />

        <div className="mb-8 pb-8 border-b border-black/8 dark:border-white/8">
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
            <div className="mt-10 border-t border-black/8 dark:border-white/8 pt-8">
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
