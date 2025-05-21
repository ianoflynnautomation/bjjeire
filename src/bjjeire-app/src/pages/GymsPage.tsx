import React, { useState, useCallback, useMemo, memo } from 'react'
import { useGyms } from '@/api/get-gyms'
import { COUNTIES } from '@/constants/counties'
import { GymsList } from '@/components/Gyms/GymsList'
import { GymsPageHeader } from '@/components/Gyms/GymsPageHeader'
import SelectFilter from '@/components/Filters/SelectFilter'
import Pagination from '@/components/common/Pagination'
import LoadingState from '@/components/common/LoadingState'
import ErrorState from '@/components/common/ErrorState'
import NoDataState from '@/components/common/NoDataState'
import BackgroundFetchingIndicator from '@/components/common/BackgroundFetchingIndicator'
import { env } from '@/config/env'

export const GymsPage: React.FC = () => {
  const [selectedCounty, setSelectedCounty] = useState<
    string | 'all' | undefined
  >('all')
  const [currentPage, setCurrentPage] = useState(1)

  const {
    data: paginatedGyms,
    isLoading,
    isFetching,
    error: fetchError,
    refetch,
  } = useGyms({
    county: selectedCounty === 'all' ? undefined : selectedCounty,
    page: currentPage,
    pageSize: env.PAGE_SIZE,
    queryConfig: {
      placeholderData: previousData => previousData,
    },
  })

  const gyms = useMemo(() => paginatedGyms?.data ?? [], [paginatedGyms?.data])
  const paginationInfo = useMemo(
    () => paginatedGyms?.pagination,
    [paginatedGyms?.pagination]
  )

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleCountyChange = useCallback(
    (countyValue: string | 'all' | undefined) => {
      setSelectedCounty(countyValue === 'all' ? 'all' : countyValue)
      setCurrentPage(1)
      scrollToTop()
    },
    [scrollToTop]
  )

  const handlePageChange = useCallback(
    (_url: string | null, page?: number) => {
      if (page && page !== currentPage) {
        setCurrentPage(page)
        scrollToTop()
      }
    },
    [currentPage, scrollToTop]
  )

  const handleRetryFetch = useCallback(() => {
    refetch()
  }, [refetch])

  const countyLabel = useMemo(
    () =>
      COUNTIES.find(c => c.value === selectedCounty)?.label ||
      selectedCounty ||
      'All Counties',
    [selectedCounty]
  )

  const isInitialLoading = isLoading && gyms.length === 0
  const isBackgroundFetching = isFetching && !isLoading
  const hasFetchError = !!fetchError
  const noGymsFound =
    !isInitialLoading && !hasFetchError && gyms.length === 0 && !isFetching

  const fetchErrorMessage = useMemo(() => {
    if (!fetchError) return ''
    if (fetchError instanceof Error) {
      return fetchError.message?.includes('failed to fetch') ||
        fetchError.message?.includes('NetworkError')
        ? 'Could not connect to the server. Please check your internet connection and try again.'
        : fetchError.message ||
            'An unexpected error occurred while loading gyms. Please try again.'
    }
    return 'An unexpected error occurred.'
  }, [fetchError])

  const renderMainContent = () => {
    if (isInitialLoading) {
      return <LoadingState />
    }
    if (hasFetchError) {
      return (
        <ErrorState message={fetchErrorMessage} onRetry={handleRetryFetch} />
      )
    }
    if (noGymsFound) {
      return (
        <NoDataState
          title="No Gyms Found"
          messageLine1="No gyms match your current filters."
          messageLine2="Try a different county or check back later."
        />
      )
    }
    if (gyms.length > 0) {
      return <GymsList gyms={gyms} />
    }
    return null
  }

  return (
    <div className="min-h-screen dark:bg-slate-900 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <GymsPageHeader
          countyName={countyLabel}
          totalGyms={paginationInfo?.totalItems}
        />

        <div className="mb-8">
          <SelectFilter
            id="county-filter"
            label="Select County"
            value={selectedCounty}
            onChange={handleCountyChange}
            options={COUNTIES}
            placeholderOptionLabel="All Counties"
            disabled={isFetching || isLoading}
          />
        </div>

        <main className="relative" aria-live="polite" aria-busy={isFetching}>
          {isBackgroundFetching && gyms.length > 0 && (
            <BackgroundFetchingIndicator />
          )}
          {renderMainContent()}
        </main>

        {paginationInfo &&
          paginationInfo.totalPages > 1 &&
          !hasFetchError &&
          gyms.length > 0 && (
            <div className="mt-10 border-t border-slate-200 pt-8 dark:border-slate-700">
              <Pagination
                currentPage={currentPage}
                pagination={paginationInfo}
                onPageChange={handlePageChange}
              />
            </div>
          )}
      </div>
    </div>
  )
}

export default memo(GymsPage)
