import type { JSX } from 'react'
import { GymsList } from '@/features/gyms/components/gym-list'
import { GymsPageHeader } from '@/features/gyms/components/gym-page-header'
import { GymsHeroBanner } from '@/features/gyms/components/gyms-hero-banner'
import SelectFilter from '@/components/ui/filters/select-filter'
import Pagination from '@/components/ui/grid/pagination'
import { COUNTIES } from '@/constants/counties'
import PageErrorBoundary from '@/components/error/page-error-boundary'
import PageLayout from '@/components/layout/page-layout'
import { ContentRenderer } from '@/components/ui/state/content-renderer-state'
import { uiContent } from '@/config/ui-content'
import { useGymsPage } from '@/features/gyms/hooks/useGymsPage'

const { filters } = uiContent.gyms

export default function GymsPage(): JSX.Element {
  const {
    gyms,
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
  } = useGymsPage()

  return (
    <PageErrorBoundary errorMessage="Failed to load gyms. Please try again.">
      <PageLayout>
        <GymsHeroBanner />

        <GymsPageHeader
          countyName={countyLabel}
          totalGyms={paginationInfo?.totalItems}
        />

        <div className="mb-8 pb-8 border-b border-black/8 dark:border-white/8">
          <SelectFilter
            id="county-filter"
            label={filters.countyLabel}
            value={activeFilters.county}
            onChange={handleCountyChange}
            options={COUNTIES}
            placeholderOptionLabel={filters.allCountiesOption}
            disabled={isFetching || isLoading}
          />
        </div>

        <section className="relative" aria-live="polite" aria-busy={isFetching}>
          <ContentRenderer
            isLoading={isLoading}
            isFetching={isFetching}
            fetchError={fetchError}
            formattedErrorMessage={formattedErrorMessage}
            onRetry={refetch}
            data={gyms}
            renderDataComponent={data => <GymsList gyms={data} />}
            noDataTitle="No Gyms Found"
            noDataMessageLine1="No gyms match your current filters."
            noDataMessageLine2="Try a different county or check back later."
            isInitialLoad={isInitialLoading}
            showBackgroundFetchingIndicator={gyms.length > 0}
          />
        </section>

        {paginationInfo &&
          paginationInfo.totalPages > 1 &&
          !fetchError &&
          gyms.length > 0 && (
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
