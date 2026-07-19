import type { JSX } from 'react'
import { EventFilters } from '@/features/bjjevents/components/event-filters/event-filters'
import { ListSearchInput } from '@/components/ui/search/list-search-input'
import { EventsPageHeader } from '@/features/bjjevents/components/event-page-header'
import { EventsHeroBanner } from '@/features/bjjevents/components/events-hero-banner'
import { EventsList } from '@/features/bjjevents/components/event-list'
import { EventsPageTestIds } from '@/constants/eventDataTestIds'
import { ListPageShell } from '@/components/layout/list-page-shell'
import { uiContent } from '@/config/ui-content'
import { useEventsPage } from '@/features/bjjevents/hooks/useEventsPage'

const { search, errors, noData } = uiContent.events

export default function EventsPage(): JSX.Element {
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
  } = page

  return (
    <ListPageShell
      content={{ errorMessage: errors.loadFailed, search, noData }}
      page={page}
      renderList={data => <EventsList events={data} />}
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
          <div className="mt-4 sm:w-160">
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
        </>
      }
    />
  )
}
