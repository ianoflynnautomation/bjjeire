import React, { memo } from 'react';
import { HateoasPagination } from '../types/common';
import clsx from 'clsx';

interface PaginationProps {
  currentPage: number;
  pagination: HateoasPagination;
  onPageChange: (url: string | null, page?: number) => void;
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
  } = pagination;

  if (totalPages <= 1) return null;

  const buttonBaseClasses = clsx(
    'px-3 py-1.5 text-sm font-medium rounded-md border transition-colors',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
    'dark:focus-visible:ring-offset-slate-900'
  );

  const activeClasses = clsx(
    'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-emerald-600',
    'dark:from-emerald-500 dark:to-emerald-600 dark:border-emerald-500',
    'hover:bg-gradient-to-r hover:from-emerald-700 hover:to-emerald-800',
    'dark:hover:from-emerald-600 dark:hover:to-emerald-700'
  );

  const inactiveClasses = clsx(
    'bg-white text-slate-700 border-slate-300',
    'hover:bg-emerald-50 hover:border-emerald-400',
    'dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600',
    'dark:hover:bg-slate-600 dark:hover:border-emerald-500'
  );

  const disabledClasses = clsx(
    'opacity-50 cursor-not-allowed',
    'bg-white border-slate-300',
    'dark:bg-slate-700 dark:border-slate-600'
  );

  const itemsStart = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : null;
  const itemsEnd = totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : null;
  const itemsText =
    itemsStart && itemsEnd && totalItems
      ? `Showing ${itemsStart}-${itemsEnd} of ${totalItems} events`
      : '';

  return (
    <nav
      data-testid="pagination"
      className="flex flex-col items-center justify-center gap-3 py-6 bg-emerald-50 dark:bg-slate-800 rounded-md shadow-sm"
      aria-label="Pagination navigation"
    >
      {itemsText && (
        <div
          data-testid="pagination-items-text"
          className="mb-2 text-sm text-slate-600 dark:text-slate-300"
          aria-live="polite"
        >
          {itemsText}
        </div>
      )}
      <div className="flex items-center gap-3">
        {/* Previous Page */}
        <button
          data-testid="pagination-prev-button"
          className={clsx(
            buttonBaseClasses,
            hasPreviousPage ? inactiveClasses : disabledClasses
          )}
          onClick={() => hasPreviousPage && onPageChange(previousPageUrl, currentPage - 1)}
          disabled={!hasPreviousPage}
          aria-label="Previous page"
        >
          « Prev
        </button>

        {/* Current Page Indicator */}
        <span
          data-testid="pagination-page-indicator"
          className={clsx(
            'px-3 py-1.5 text-sm font-medium rounded-md border',
            activeClasses // Treat current page as "active" to match selected button styles
          )}
          aria-current="page"
        >
          Page {currentPage} of {totalPages}
        </span>

        {/* Next Page */}
        <button
          data-testid="pagination-next-button"
          className={clsx(
            buttonBaseClasses,
            hasNextPage ? inactiveClasses : disabledClasses
          )}
          onClick={() => hasNextPage && onPageChange(nextPageUrl, currentPage + 1)}
          disabled={!hasNextPage}
          aria-label="Next page"
        >
          Next »
        </button>
      </div>
    </nav>
  );
};

export default memo(Pagination);