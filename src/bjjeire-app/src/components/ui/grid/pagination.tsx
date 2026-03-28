import { memo } from 'react'
import type { JSX } from 'react'
import type { HateoasPagination } from '@/types/common'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/cn'
import { PaginationTestIds } from '@/constants/commonDataTestIds'
import { PaginationButton } from './pagination-button'

interface PaginationProps {
  currentPage: number
  pagination: HateoasPagination
  onPageChange: (url: string | null, page?: number) => void
  'data-testid'?: string
}

const Pagination = memo(function Pagination({
  currentPage,
  pagination,
  onPageChange,
  'data-testid': dataTestIdFromProp,
}: PaginationProps): JSX.Element | null {
  const {
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPageUrl,
    previousPageUrl,
    totalItems,
    pageSize,
  } = pagination

  const rootTestId = dataTestIdFromProp ?? PaginationTestIds.ROOT

  if (totalPages <= 1) {
    return null
  }

  const itemsStart =
    totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : null
  const itemsEnd =
    totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : null
  const itemsText =
    itemsStart && itemsEnd
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
        <PaginationButton
          direction="prev"
          disabled={!hasPreviousPage}
          onClick={() => onPageChange(previousPageUrl, currentPage - 1)}
          data-testid={PaginationTestIds.PREV_BUTTON}
        />
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
        <PaginationButton
          direction="next"
          disabled={!hasNextPage}
          onClick={() => onPageChange(nextPageUrl, currentPage + 1)}
          data-testid={PaginationTestIds.NEXT_BUTTON}
        />
      </div>
    </nav>
  )
})

export default Pagination
