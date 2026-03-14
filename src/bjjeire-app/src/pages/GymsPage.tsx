import { useCallback, type ReactElement } from 'react'
import { COUNTIES } from '@/constants/counties'
import { GymsList } from '@/features/gyms/components/gym-list'
import { GymsPageHeader } from '@/features/gyms/components/gym-page-header'
import { GymsHeroBanner } from '@/features/gyms/components/gyms-hero-banner'
import SelectFilter from '@/components/ui/filters/select-filter'
import Pagination from '@/components/ui/grid/pagination'
import { env } from '@/config/env'
import type { GymDto, GetGymsByCountyPaginationQuery } from '@/types/gyms'
import PageErrorBoundary from '@/components/error/page-error-boundary'
import PageLayout from '@/components/layout/page-layout'
import { ContentRenderer } from '@/components/ui/state/content-renderer-state'
import { useScrollToTop } from '@/utils/scrollUtils'
import { formatFetchError } from '@/utils/errorUtils'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { getGyms } from '@/features/gyms/api/get-gyms'
import { uiContent } from '@/config/ui-content'

const { filters } = uiContent.gyms

const initialGymFilters: GetGymsByCountyPaginationQuery = {
  county: 'all',
  page: env.PAGE_NUMBER,
  pageSize: env.PAGE_SIZE,
}

export default function GymsPage(): ReactElement {
  const scrollToTop = useScrollToTop()

  const {
    data: paginatedGymsData,
    pagination: paginationInfo,
    isLoading,
    isFetching,
    error: fetchError,
    params: activeFilters,
    currentPage,
    handlePageChange: rawHandlePageChange,
    updateFilters,
    refetch,
  } = usePaginatedQuery<GymDto, GetGymsByCountyPaginationQuery>({
    queryKeyBase: ['gyms'],
    fetchFn: getGyms,
    initialParams: initialGymFilters,
  })

  const gyms = paginatedGymsData ?? []

  const countyLabel =
    COUNTIES.find(c => c.value === activeFilters.county)?.label ??
    (activeFilters.county === 'all' ? filters.allCountiesOption : activeFilters.county) ??
    filters.allCountiesOption

  const handleCountyChange = useCallback(
    (countyValue: string | undefined) => {
      updateFilters({ county: countyValue } as Partial<GetGymsByCountyPaginationQuery>)
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
  const isInitialLoading = isLoading && gyms.length === 0

  return (
    <PageErrorBoundary errorMessage="Failed to load gyms. Please try again.">
      <PageLayout>
        <GymsHeroBanner />

        <GymsPageHeader
          countyName={countyLabel}
          totalGyms={paginationInfo?.totalItems}
        />

        <div className="mb-8 pb-8 border-b border-white/8">
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
            <div className="mt-10 border-t border-white/8 pt-8">
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
