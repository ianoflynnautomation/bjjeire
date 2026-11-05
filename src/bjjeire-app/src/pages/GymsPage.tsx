import { lazy, Suspense, type JSX } from 'react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { GymsList } from '@/features/gyms/components/gym-list'
import { GymsPageHeader } from '@/features/gyms/components/gym-page-header'
import { GymsHeroBanner } from '@/features/gyms/components/gyms-hero-banner'
import { GymViewSwitch } from '@/features/gyms/components/gym-view-switch'
import { ListSearchInput } from '@/components/ui/search/list-search-input'
import SelectFilter from '@/components/ui/filters/select-filter'
import { COUNTIES } from '@/constants/counties'
import { ListPageShell } from '@/components/layout/list-page-shell'
import LoadingState from '@/components/ui/state/loading-state'
import PageErrorBoundary from '@/components/error/page-error-boundary'
import { env } from '@/config/env'
import { uiContent } from '@/config/ui-content'
import { DEFAULT_SEARCH_PAGE_SIZE } from '@/hooks/useListPage'
import { useGymsPage } from '@/features/gyms/hooks/useGymsPage'
import { GymsPageTestIds } from '@/constants/gymDataTestIds'

const { filters, search, errors, noData } = uiContent.gyms

// Loaded on demand: a visitor who stays on the list downloads no map code or CSS.
const GymMap = lazy(() =>
  import('@/features/gyms/components/gym-map/gym-map').then(module => ({
    default: module.GymMap,
  }))
)

export default function GymsPage(): JSX.Element {
  useDocumentTitle(uiContent.gyms.documentTitle)
  const page = useGymsPage()
  const {
    filteredItems: filteredGyms,
    paginationInfo,
    isLoading,
    isFetching,
    activeFilters,
    countyLabel,
    handleCountyChange,
    search: gymSearch,
    items,
    isMapEnabled,
    view,
    handleViewChange,
  } = page
  const isMapView = view === 'map'
  const hasFilters = activeFilters.county !== 'all' || gymSearch.isSearchActive
  // Only a full maximum-size page can hide gyms. A shorter page kept on screen
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
          <PageErrorBoundary errorMessage={uiContent.gyms.map.loadFailed}>
            <Suspense fallback={<LoadingState />}>
              <GymMap
                gyms={data}
                hasFilters={hasFilters}
                isTruncated={isTruncated}
              />
            </Suspense>
          </PageErrorBoundary>
        ) : (
          // The map's full result set stays on screen until the list's page arrives.
          <GymsList
            gyms={
              gymSearch.isSearchActive ? data : data.slice(0, env.PAGE_SIZE)
            }
          />
        )
      }
      hidePagination={isMapView}
      hero={<GymsHeroBanner />}
      header={
        <GymsPageHeader
          countyName={countyLabel}
          totalGyms={
            gymSearch.isSearchActive
              ? filteredGyms.length
              : paginationInfo?.totalItems
          }
        />
      }
      filterBar={
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <SelectFilter
            id="county-filter"
            label={filters.countyLabel}
            value={activeFilters.county}
            onChange={handleCountyChange}
            options={COUNTIES}
            placeholderOptionLabel={filters.allCountiesOption}
            disabled={isFetching || isLoading}
            className="sm:w-64 shrink-0"
          />
          <div className="w-full min-w-0 sm:max-w-160">
            <ListSearchInput
              inputId="gym-search"
              content={search}
              value={gymSearch.searchTerm}
              onChange={gymSearch.setSearchTerm}
              onClear={gymSearch.clearSearch}
              disabled={isLoading}
              dataTestId={GymsPageTestIds.SEARCH}
            />
          </div>
          {isMapEnabled && (
            <GymViewSwitch view={view} onChange={handleViewChange} />
          )}
        </div>
      }
    />
  )
}
