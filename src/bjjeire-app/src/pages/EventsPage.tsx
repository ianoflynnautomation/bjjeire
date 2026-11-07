import { lazy, Suspense, type JSX } from 'react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { EventFilters } from '@/features/bjjevents/components/event-filters/event-filters'
import { ListSearchInput } from '@/components/ui/search/list-search-input'
import { EventsPageHeader } from '@/features/bjjevents/components/event-page-header'
import { EventsHeroBanner } from '@/features/bjjevents/components/events-hero-banner'
import { EventsList } from '@/features/bjjevents/components/event-list'
import { EventViewSwitch } from '@/features/bjjevents/components/event-view-switch'
import { EventsPageTestIds } from '@/constants/eventDataTestIds'
import { ListPageShell } from '@/components/layout/list-page-shell'
import LoadingState from '@/components/ui/state/loading-state'
import PageErrorBoundary from '@/components/error/page-error-boundary'
import { env } from '@/config/env'
import { DEFAULT_SEARCH_PAGE_SIZE } from '@/hooks/useListPage'
import { uiContent } from '@/config/ui-content'
import { useEventsPage } from '@/features/bjjevents/hooks/useEventsPage'

const { search, errors, noData } = uiContent.events

// Loaded on demand: a visitor who stays on the list downloads no map code or CSS.
const EventMap = lazy(() =>
  import('@/features/bjjevents/components/event-map/event-map').then(
    module => ({ default: module.EventMap })
  )
)

export default function EventsPage(): JSX.Element {
  useDocumentTitle(uiContent.events.documentTitle)
  const page = useEventsPage()
  const {
    filteredItems: filteredEvents,
    paginationInfo,
    isLoading,
    isFetching,
    activeFilters,
    countyLabel,
    handleFilterChange,
    search: eventSearch,
    items,
    isMapEnabled,
    view,
    handleViewChange,
  } = page
  const isMapView = view === 'map'
  const hasFilters =
    activeFilters.county !== 'all' ||
    (activeFilters.types ?? []).length > 0 ||
    eventSearch.isSearchActive
  // Only a full maximum-size page can hide events. A shorter page kept on screen
  // while the map's own fetch runs says nothing about what is missing.
  const isTruncated =
    items.length >= DEFAULT_SEARCH_PAGE_SIZE &&
    (paginationInfo?.totalItems ?? 0) > items.length

  return (
    <ListPageShell
      content={{ errorMessage: errors.loadFailed, search, noData }}
      page={page}
      renderList={data =>
        isMapView ? (
          // Its own boundary: if the chunk fails, the filters and List stay reachable.
          <PageErrorBoundary errorMessage={uiContent.events.map.loadFailed}>
            <Suspense fallback={<LoadingState />}>
              <EventMap
                events={data}
                hasFilters={hasFilters}
                isTruncated={isTruncated}
              />
            </Suspense>
          </PageErrorBoundary>
        ) : (
          // The map's full result set stays on screen until the list's page arrives.
          <EventsList
            events={
              eventSearch.isSearchActive ? data : data.slice(0, env.PAGE_SIZE)
            }
          />
        )
      }
      hidePagination={isMapView}
      hero={<EventsHeroBanner />}
      header={
        <EventsPageHeader
          countyName={countyLabel}
          totalEvents={
            eventSearch.isSearchActive
              ? filteredEvents.length
              : paginationInfo?.totalItems
          }
          data-testid={EventsPageTestIds.HEADER}
        />
      }
      filterBar={
        <>
          <EventFilters
            selectedCity={activeFilters.county}
            selectedTypes={activeFilters.types ?? []}
            onCityChange={city => handleFilterChange('county', city)}
            onTypesChange={types => handleFilterChange('types', types)}
            disabled={isFetching || isLoading}
            dataTestId={EventsPageTestIds.FILTERS}
          />
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="w-full min-w-0 sm:max-w-160">
              <ListSearchInput
                inputId="event-search"
                content={search}
                value={eventSearch.searchTerm}
                onChange={eventSearch.setSearchTerm}
                onClear={eventSearch.clearSearch}
                disabled={isLoading}
                dataTestId={EventsPageTestIds.SEARCH}
              />
            </div>
            {isMapEnabled && (
              <EventViewSwitch view={view} onChange={handleViewChange} />
            )}
          </div>
        </>
      }
    />
  )
}
