import type { JSX } from 'react'
import { CompetitionsList } from '@/features/competitions/components/competitions-list'
import { CompetitionsPageHeader } from '@/features/competitions/components/competitions-page-header'
import { CompetitionSearchInput } from '@/features/competitions/components/competition-search-input'
import Pagination from '@/components/ui/grid/pagination'
import PageErrorBoundary from '@/components/error/page-error-boundary'
import PageLayout from '@/components/layout/page-layout'
import { ContentRenderer } from '@/components/ui/state/content-renderer-state'
import { uiContent } from '@/config/ui-content'
import { useCompetitionsPage } from '@/features/competitions/hooks/useCompetitionsPage'
import { CompetitionsPageTestIds } from '@/constants/competitionDataTestIds'

const { search } = uiContent.competitions

export default function CompetitionsPage(): JSX.Element {
  const {
    filteredCompetitions,
    paginationInfo,
    isLoading,
    isFetching,
    currentPage,
    formattedErrorMessage,
    isInitialLoading,
    fetchError,
    onPageChange,
    refetch,
    search: competitionSearch,
  } = useCompetitionsPage()

  return (
    <PageErrorBoundary errorMessage="Failed to load competitions. Please try again.">
      <PageLayout>
        <CompetitionsPageHeader
          totalCompetitions={
            competitionSearch.isSearchActive
              ? filteredCompetitions.length
              : paginationInfo?.totalItems
          }
        />

        <div className="mb-6 pb-6 border-b border-black/8 dark:border-white/8">
          <div className="sm:w-160 shrink-0">
            <CompetitionSearchInput
              value={competitionSearch.searchTerm}
              onChange={competitionSearch.setSearchTerm}
              onClear={competitionSearch.clearSearch}
              disabled={isLoading}
              dataTestId={CompetitionsPageTestIds.SEARCH}
            />
          </div>
        </div>

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {competitionSearch.isSearchActive
            ? `${search.resultsSrPrefix} ${filteredCompetitions.length} ${search.resultsSrSuffix}`
            : ''}
        </p>

        <section className="relative" aria-live="polite" aria-busy={isFetching}>
          <ContentRenderer
            isLoading={isLoading}
            isFetching={isFetching}
            fetchError={fetchError}
            formattedErrorMessage={formattedErrorMessage}
            onRetry={refetch}
            data={filteredCompetitions}
            renderDataComponent={data => (
              <CompetitionsList competitions={data} />
            )}
            noDataTitle={
              competitionSearch.isSearchActive
                ? search.noResultsTitle
                : 'No Competitions Found'
            }
            noDataMessageLine1={
              competitionSearch.isSearchActive
                ? search.noResultsMessage
                : 'No competitions are available right now.'
            }
            noDataMessageLine2={
              competitionSearch.isSearchActive ? undefined : 'Check back later.'
            }
            isInitialLoad={isInitialLoading}
            showBackgroundFetchingIndicator={filteredCompetitions.length > 0}
          />
        </section>

        {!competitionSearch.isSearchActive &&
          paginationInfo &&
          paginationInfo.totalPages > 1 &&
          !fetchError &&
          filteredCompetitions.length > 0 && (
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
