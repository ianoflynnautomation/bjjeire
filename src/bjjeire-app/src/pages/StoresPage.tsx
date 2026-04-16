import type { JSX } from 'react'
import { StoresList } from '@/features/stores/components/store-list'
import { StoresPageHeader } from '@/features/stores/components/stores-page-header'
import { ListSearchInput } from '@/components/ui/search/list-search-input'
import Pagination from '@/components/ui/grid/pagination'
import PageErrorBoundary from '@/components/error/page-error-boundary'
import PageLayout from '@/components/layout/page-layout'
import { ContentRenderer } from '@/components/ui/state/content-renderer-state'
import { uiContent } from '@/config/ui-content'
import { useStoresPage } from '@/features/stores/hooks/useStoresPage'
import { StoresPageTestIds } from '@/constants/storeDataTestIds'

const { search } = uiContent.stores

export default function StoresPage(): JSX.Element {
  const {
    filteredItems: filteredStores,
    paginationInfo,
    isLoading,
    isFetching,
    currentPage,
    formattedErrorMessage,
    isInitialLoading,
    fetchError,
    onPageChange,
    refetch,
    search: storeSearch,
  } = useStoresPage()

  return (
    <PageErrorBoundary errorMessage="Failed to load stores. Please try again.">
      <PageLayout>
        <StoresPageHeader
          totalStores={
            storeSearch.isSearchActive
              ? filteredStores.length
              : paginationInfo?.totalItems
          }
        />

        <div className="mb-6 border-b border-black/8 pb-6 dark:border-white/8">
          <div className="shrink-0 sm:w-160">
            <ListSearchInput
              inputId="store-search"
              content={search}
              value={storeSearch.searchTerm}
              onChange={storeSearch.setSearchTerm}
              onClear={storeSearch.clearSearch}
              disabled={isLoading}
              dataTestId={StoresPageTestIds.SEARCH}
            />
          </div>
        </div>

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {storeSearch.isSearchActive
            ? `${search.resultsSrPrefix} ${filteredStores.length} ${search.resultsSrSuffix}`
            : ''}
        </p>

        <section className="relative" aria-live="polite" aria-busy={isFetching}>
          <ContentRenderer
            isLoading={isLoading}
            isFetching={isFetching}
            fetchError={fetchError}
            formattedErrorMessage={formattedErrorMessage}
            onRetry={refetch}
            data={filteredStores}
            renderDataComponent={data => <StoresList stores={data} />}
            noDataTitle={
              storeSearch.isSearchActive
                ? search.noResultsTitle
                : 'No Stores Found'
            }
            noDataMessageLine1={
              storeSearch.isSearchActive
                ? search.noResultsMessage
                : 'No stores are available right now.'
            }
            noDataMessageLine2={
              storeSearch.isSearchActive ? undefined : 'Check back later.'
            }
            isInitialLoad={isInitialLoading}
            showBackgroundFetchingIndicator={filteredStores.length > 0}
          />
        </section>

        {!storeSearch.isSearchActive &&
          paginationInfo &&
          paginationInfo.totalPages > 1 &&
          !fetchError &&
          filteredStores.length > 0 && (
            <div className="mt-10 border-t border-black/8 pt-8 dark:border-white/8">
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
