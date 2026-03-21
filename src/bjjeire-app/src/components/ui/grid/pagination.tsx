import { memo } from 'react'
import type { HateoasPagination } from '@/types/common'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/utils'
import { PaginationTestIds } from '@/constants/commonDataTestIds'

interface PaginationProps {
  currentPage: number
  pagination: HateoasPagination
  onPageChange: (url: string | null, page?: number) => void
  'data-testid'?: string
}

export default memo(function Pagination({
  currentPage,
  pagination,
  onPageChange,
  'data-testid': dataTestIdFromProp,
}: PaginationProps) {
  const {
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPageUrl,
    previousPageUrl,
    totalItems,
    pageSize,
  } = pagination

  if (totalPages <= 1) {
    return null
  }

  const rootTestId = dataTestIdFromProp ?? PaginationTestIds.ROOT

  const itemsStart =
    totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : null
  const itemsEnd =
    totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : null
  const itemsText =
    itemsStart && itemsEnd && totalItems
      ? `Showing ${itemsStart}-${itemsEnd} of ${totalItems} items`
      : ''

  return (
    <nav
      data-testid={rootTestId}
      className="flex flex-col items-center justify-center gap-4 py-8"
      aria-label="Pagination navigation"
    >
      {itemsText && (
        <p
          data-testid={PaginationTestIds.ITEMS_TEXT}
          className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium tabular-nums text-emerald-700 ring-1 ring-emerald-500/30 dark:bg-emerald-900/40 dark:text-emerald-300"
          aria-live="polite"
        >
          {itemsText}
        </p>
      )}
      <div className="flex items-center gap-2">
        {/* Previous Page */}
        <button
          data-testid={PaginationTestIds.PREV_BUTTON}
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'gap-1.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md'
          )}
          onClick={() =>
            hasPreviousPage && onPageChange(previousPageUrl, currentPage - 1)
          }
          disabled={!hasPreviousPage}
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
          Prev
        </button>

        {/* Current Page Indicator */}
        <span
          data-testid={PaginationTestIds.PAGE_INDICATOR}
          className={cn(
            buttonVariants({ variant: 'gradient', size: 'sm' }),
            'min-w-24 tabular-nums'
          )}
          aria-current="page"
          aria-label={`Page ${currentPage} of ${totalPages}`}
        >
          {currentPage} / {totalPages}
        </span>

        {/* Next Page */}
        <button
          data-testid={PaginationTestIds.NEXT_BUTTON}
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'gap-1.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md'
          )}
          onClick={() =>
            hasNextPage && onPageChange(nextPageUrl, currentPage + 1)
          }
          disabled={!hasNextPage}
          aria-label="Next page"
        >
          Next
          <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
})
