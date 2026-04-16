import type { JSX } from 'react'
import { GymsList } from '@/features/gyms/components/gym-list'
import { GymsPageHeader } from '@/features/gyms/components/gym-page-header'
import { GymsHeroBanner } from '@/features/gyms/components/gyms-hero-banner'
import { ListSearchInput } from '@/components/ui/search/list-search-input'
import SelectFilter from '@/components/ui/filters/select-filter'
import Pagination from '@/components/ui/grid/pagination'
import { COUNTIES } from '@/constants/counties'
import PageErrorBoundary from '@/components/error/page-error-boundary'
import PageLayout from '@/components/layout/page-layout'
import { ContentRenderer } from '@/components/ui/state/content-renderer-state'
import { uiContent } from '@/config/ui-content'
import { useGymsPage } from '@/features/gyms/hooks/useGymsPage'
import { GymsPageTestIds } from '@/constants/gymDataTestIds'

const { filters, search } = uiContent.gyms

export default function GymsPage(): JSX.Element {
  const {
    filteredItems: filteredGyms,
    paginationInfo,
    isLoading,
    isFetching,
    activeFilters,
    currentPage,
    countyLabel,
    formattedErrorMessage,
    isInitialLoading,
    fetchError,
    handleCountyChange,
    onPageChange,
    refetch,
    search: gymSearch,
  } = useGymsPage()

  return (
    <PageErrorBoundary errorMessage="Failed to load gyms. Please try again.">
      <PageLayout>
        <GymsHeroBanner />

        <GymsPageHeader
          countyName={countyLabel}
          totalGyms={
            gymSearch.isSearchActive
              ? filteredGyms.length
              : paginationInfo?.totalItems
          }
        />

        <div className="mb-6 pb-6 border-b border-black/8 dark:border-white/8">
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
            <div className="sm:w-160 shrink-0">
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
          </div>
        </div>

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {gymSearch.isSearchActive
            ? `${search.resultsSrPrefix} ${filteredGyms.length} ${search.resultsSrSuffix}`
            : ''}
        </p>

        <section className="relative" aria-live="polite" aria-busy={isFetching}>
          <ContentRenderer
            isLoading={isLoading}
            isFetching={isFetching}
            fetchError={fetchError}
            formattedErrorMessage={formattedErrorMessage}
            onRetry={refetch}
            data={filteredGyms}
            renderDataComponent={data => <GymsList gyms={data} />}
            noDataTitle={
              gymSearch.isSearchActive ? search.noResultsTitle : 'No Gyms Found'
            }
            noDataMessageLine1={
              gymSearch.isSearchActive
                ? search.noResultsMessage
                : 'No gyms match your current filters.'
            }
            noDataMessageLine2={
              gymSearch.isSearchActive
                ? undefined
                : 'Try a different county or check back later.'
            }
            isInitialLoad={isInitialLoading}
            showBackgroundFetchingIndicator={filteredGyms.length > 0}
          />
        </section>

        {!gymSearch.isSearchActive &&
          paginationInfo &&
          paginationInfo.totalPages > 1 &&
          !fetchError &&
          filteredGyms.length > 0 && (
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
