import type { JSX } from 'react'
import EventFilters from '@/features/bjjevents/components/event-filters/event-filters'
import { EventSearchInput } from '@/features/bjjevents/components/event-search-input'
import Pagination from '@/components/ui/grid/pagination'
import { EventsPageHeader } from '@/features/bjjevents/components/event-page-header'
import { EventsHeroBanner } from '@/features/bjjevents/components/events-hero-banner'
import EventsList from '@/features/bjjevents/components/event-list'
import { EventsPageTestIds } from '@/constants/eventDataTestIds'
import PageErrorBoundary from '@/components/error/page-error-boundary'
import PageLayout from '@/components/layout/page-layout'
import { ContentRenderer } from '@/components/ui/state/content-renderer-state'
import { uiContent } from '@/config/ui-content'
import { useEventsPage } from '@/features/bjjevents/hooks/useEventsPage'

const { search } = uiContent.events

export default function EventsPage(): JSX.Element {
  const {
    filteredEvents,
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
    search: eventSearch,
  } = useEventsPage()

  return (
    <PageErrorBoundary errorMessage="Failed to load events. Please try again.">
      <PageLayout>
        <EventsHeroBanner />

        <EventsPageHeader
          countyName={activeFilters.county}
          totalEvents={
            eventSearch.isSearchActive
              ? filteredEvents.length
              : paginationInfo?.totalItems
          }
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
          <div className="mt-4 sm:w-160">
            <EventSearchInput
              value={eventSearch.searchTerm}
              onChange={eventSearch.setSearchTerm}
              onClear={eventSearch.clearSearch}
              disabled={isLoading}
              dataTestId={EventsPageTestIds.SEARCH}
            />
          </div>
        </div>

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {eventSearch.isSearchActive
            ? `${search.resultsSrPrefix} ${filteredEvents.length} ${search.resultsSrSuffix}`
            : ''}
        </p>

        <section className="relative" aria-live="polite" aria-busy={isFetching}>
          <ContentRenderer
            isLoading={isLoading}
            isFetching={isFetching}
            fetchError={fetchError}
            formattedErrorMessage={formattedErrorMessage}
            onRetry={refetch}
            data={filteredEvents}
            renderDataComponent={data => <EventsList events={data} />}
            noDataTitle={
              eventSearch.isSearchActive
                ? search.noResultsTitle
                : 'No Events Found'
            }
            noDataMessageLine1={
              eventSearch.isSearchActive
                ? search.noResultsMessage
                : 'No events match your current filters.'
            }
            noDataMessageLine2={
              eventSearch.isSearchActive
                ? undefined
                : 'Try a different filter to find events.'
            }
            isInitialLoad={isInitialLoading}
            showBackgroundFetchingIndicator={filteredEvents.length > 0}
          />
        </section>

        {!eventSearch.isSearchActive &&
          paginationInfo &&
          paginationInfo.totalPages > 1 &&
          !fetchError &&
          filteredEvents.length > 0 && (
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
