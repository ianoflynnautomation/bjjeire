import type { JSX, ReactNode } from 'react'
import PageErrorBoundary from '@/components/error/page-error-boundary'
import PageLayout from '@/components/layout/page-layout'
import Pagination from '@/components/ui/grid/pagination'
import { ContentRenderer } from '@/components/ui/state/content-renderer-state'
import type { HateoasPagination } from '@/types/common'

interface ListPageShellContent {
  errorMessage: string
  search: {
    noResultsTitle: string
    noResultsMessage: string
    resultsSrPrefix: string
    resultsSrSuffix: string
  }
  noData: {
    title: string
    messageLine1: string
    messageLine2?: string
  }
}

interface ListPageShellState<T> {
  filteredItems: T[]
  paginationInfo: HateoasPagination | undefined
  isLoading: boolean
  isFetching: boolean
  isInitialLoading: boolean
  currentPage: number
  fetchError: Error | null
  formattedErrorMessage: string
  onPageChange: (url: string | null, page?: number) => void
  refetch: () => unknown
  search: { isSearchActive: boolean }
}

interface ListPageShellProps<T> {
  content: ListPageShellContent
  page: ListPageShellState<T>
  renderList: (items: T[]) => ReactNode
  hero?: ReactNode
  header: ReactNode
  filterBar?: ReactNode
}

export function ListPageShell<T>({
  content,
  page,
  renderList,
  hero,
  header,
  filterBar,
}: ListPageShellProps<T>): JSX.Element {
  const {
    filteredItems,
    paginationInfo,
    isLoading,
    isFetching,
    isInitialLoading,
    currentPage,
    fetchError,
    formattedErrorMessage,
    onPageChange,
    refetch,
    search,
  } = page

  return (
    <PageErrorBoundary errorMessage={content.errorMessage}>
      <PageLayout>
        {hero}

        {header}

        {filterBar && (
          <div className="mb-6 border-b border-hairline pb-6">{filterBar}</div>
        )}

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {search.isSearchActive
            ? `${content.search.resultsSrPrefix} ${filteredItems.length} ${content.search.resultsSrSuffix}`
            : ''}
        </p>

        <section className="relative" aria-live="polite" aria-busy={isFetching}>
          <ContentRenderer
            isLoading={isLoading}
            isFetching={isFetching}
            fetchError={fetchError}
            formattedErrorMessage={formattedErrorMessage}
            onRetry={refetch}
            data={filteredItems}
            renderDataComponent={renderList}
            noDataTitle={
              search.isSearchActive
                ? content.search.noResultsTitle
                : content.noData.title
            }
            noDataMessageLine1={
              search.isSearchActive
                ? content.search.noResultsMessage
                : content.noData.messageLine1
            }
            noDataMessageLine2={
              search.isSearchActive ? undefined : content.noData.messageLine2
            }
            isInitialLoad={isInitialLoading}
            showBackgroundFetchingIndicator={filteredItems.length > 0}
          />
        </section>

        {!search.isSearchActive &&
          paginationInfo &&
          paginationInfo.totalPages > 1 &&
          !fetchError &&
          filteredItems.length > 0 && (
            <div className="mt-10 border-t border-hairline pt-8">
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
