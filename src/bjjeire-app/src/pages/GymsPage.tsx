import React, { useCallback, useMemo } from 'react'
import { COUNTIES } from '@/constants/counties'
import { GymsList } from '@/features/gyms/components/gym-list'
import { GymsPageHeader } from '@/features/gyms/components/gym-page-header'
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

const initialGymFilters: GetGymsByCountyPaginationQuery = {
  county: 'all',
  page: env.PAGE_NUMBER,
  pageSize: env.PAGE_SIZE,
}

const GymsPage: React.FC = () => {
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

  const gyms = useMemo(() => paginatedGymsData ?? [], [paginatedGymsData])

  const handleCountyChange = useCallback(
    (countyValue: string | undefined) => {
      updateFilters({
        county: countyValue,
      } as Partial<GetGymsByCountyPaginationQuery>)
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

  const countyLabel = useMemo(() => {
    const selected = activeFilters.county
    return (
      COUNTIES.find(c => c.value === selected)?.label ||
      (selected === 'all' ? 'All Counties' : selected) ||
      'All Counties'
    )
  }, [activeFilters.county])

  const formattedErrorMessage = formatFetchError(fetchError)
  const isInitialLoading = isLoading && gyms.length === 0

  return (
    <PageErrorBoundary errorMessage="Failed to load gyms. Please try again.">
      <PageLayout>
        <GymsPageHeader
          countyName={countyLabel}
          totalGyms={paginationInfo?.totalItems}
        />

        <div className="mb-8 pb-8 border-b border-white/[0.08]">
          <SelectFilter
            id="county-filter"
            label="Select County"
            value={activeFilters.county}
            onChange={handleCountyChange}
            options={COUNTIES}
            placeholderOptionLabel="All Counties"
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

export default GymsPage
