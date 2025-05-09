import React, { memo } from 'react';
import { generatePageNumbers, ELLIPSIS } from '../utils/paginationUtils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
  ariaLabel?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  ariaLabel = 'Pagination navigation',
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = generatePageNumbers(currentPage, totalPages, Math.max(3, maxVisiblePages));

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number' && page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const buttonBaseClasses =
    'px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1';
  const inactiveButtonClasses = 'bg-white text-gray-700 hover:bg-gray-100 hover:border-gray-400';
  const activeButtonClasses = 'bg-blue-600 text-white border-blue-600 cursor-default';
  const disabledButtonClasses = 'opacity-60 cursor-not-allowed bg-gray-50 text-gray-400';

  return (
    <nav
      className="flex flex-col items-center gap-3 py-6 sm:flex-row sm:justify-center"
      aria-label={ariaLabel}
    >
      <div className="flex items-center gap-1.5">
        <button
          className={`${buttonBaseClasses} ${inactiveButtonClasses} ${
            currentPage === 1 ? disabledButtonClasses : ''
          }`}
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          aria-disabled={currentPage === 1}
          aria-label="Previous page"
        >
          « Prev
        </button>

        <ul className="flex list-none gap-1.5 p-0 m-0">
          {pageNumbers.map((page, index) => (
            <li
              key={typeof page === 'number' ? `page-${page}` : `ellipsis-${index}`}
              className="flex items-center"
            >
              {page === ELLIPSIS ? (
                <span className="px-3 py-1.5 text-sm text-gray-500" aria-hidden="true">
                  {ELLIPSIS}
                </span>
              ) : (
                <button
                  className={`${buttonBaseClasses} ${
                    currentPage === page ? activeButtonClasses : inactiveButtonClasses
                  }`}
                  onClick={() => handlePageClick(page)}
                  aria-current={currentPage === page ? 'page' : undefined}
                  aria-label={`Page ${page}`}
                >
                  {page}
                </button>
              )}
            </li>
          ))}
        </ul>

        <button
          className={`${buttonBaseClasses} ${inactiveButtonClasses} ${
            currentPage === totalPages ? disabledButtonClasses : ''
          }`}
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          Next »
        </button>
      </div>
      <span className="text-xs text-gray-600">
        Page {currentPage} of {totalPages}
      </span>
    </nav>
  );
};

export default memo(Pagination);