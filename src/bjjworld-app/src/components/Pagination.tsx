import React, { memo } from 'react'
import { HateoasPagination } from '../types/common'

interface PaginationProps {
  currentPage: number
  pagination: HateoasPagination
  onPageChange: (url: string | null, page?: number) => void
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, pagination, onPageChange }) => {
  const {
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPageUrl,
    previousPageUrl,
    totalItems,
    pageSize,
  } = pagination

  if (totalPages <= 1) return null

  const buttonBaseClasses =
    'px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
  const inactiveClasses = 'bg-white text-gray-700 hover:bg-gray-100'
  const disabledClasses = 'opacity-60 cursor-not-allowed bg-gray-50 text-gray-400'

  // Fallback URLs when nextPageUrl/previousPageUrl are null
  const fallbackNextUrl = hasNextPage
    ? `/api/bjjevent?page=${currentPage + 1}&pageSize=${pageSize}`
    : null
  const fallbackPrevUrl = hasPreviousPage
    ? `/api/bjjevent?page=${currentPage - 1}&pageSize=${pageSize}`
    : null

  // Calculate items shown (e.g., "Showing 1-10 of 12 events")
  const itemsStart = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : null
  const itemsEnd = totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : null
  const itemsText =
    itemsStart && itemsEnd && totalItems
      ? `Showing ${itemsStart}-${itemsEnd} of ${totalItems} events`
      : ''

  return (
    <nav
      className="flex flex-col items-center justify-center gap-3 py-6"
      aria-label="Pagination navigation"
    >
      {itemsText && (
        <div className="mb-2 text-sm text-gray-600" aria-live="polite">
          {itemsText}
        </div>
      )}
      <div className="flex items-center gap-3">
        {/* Previous Page */}
        <button
          className={`${buttonBaseClasses} ${inactiveClasses} ${!hasPreviousPage ? disabledClasses : ''}`}
          onClick={() =>
            hasPreviousPage && onPageChange(previousPageUrl || fallbackPrevUrl, currentPage - 1)
          }
          disabled={!hasPreviousPage}
          aria-label="Previous page"
        >
          « Prev
        </button>

        {/* Current Page Indicator */}
        <span className="px-3 py-1.5 text-sm font-medium text-gray-700" aria-current="page">
          Page {currentPage} of {totalPages}
        </span>

        {/* Next Page */}
        <button
          className={`${buttonBaseClasses} ${inactiveClasses} ${!hasNextPage ? disabledClasses : ''}`}
          onClick={() =>
            hasNextPage && onPageChange(nextPageUrl || fallbackNextUrl, currentPage + 1)
          }
          disabled={!hasNextPage}
          aria-label="Next page"
        >
          Next »
        </button>
      </div>
    </nav>
  )
}

export default memo(Pagination)
