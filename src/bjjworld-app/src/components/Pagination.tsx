import React, { memo } from 'react';
import { generatePageNumbers, ELLIPSIS } from '../utils/paginationUtils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
}) => {
  if (totalPages <= 1) return null;

  const pageNumbers = generatePageNumbers(currentPage, totalPages, Math.max(3, maxVisiblePages));

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number' && page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const buttonBaseClasses =
    'px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1';
  const inactiveClasses = 'bg-white text-gray-700 hover:bg-gray-100';
  const activeClasses = 'bg-blue-600 text-white border-blue-600 cursor-default';
  const disabledClasses = 'opacity-60 cursor-not-allowed bg-gray-50 text-gray-400';

  return (
    <nav className="flex items-center justify-center gap-3 py-6" aria-label="Pagination navigation">
      <button
        className={`${buttonBaseClasses} ${inactiveClasses} ${currentPage === 1 ? disabledClasses : ''}`}
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        « Prev
      </button>

      <ul className="flex gap-1.5">
        {pageNumbers.map((page, index) => (
          <li key={typeof page === 'number' ? `page-${page}` : `ellipsis-${index}`}>
            {page === ELLIPSIS ? (
              <span className="px-3 py-1.5 text-sm text-gray-500" aria-hidden="true">
                {ELLIPSIS}
              </span>
            ) : (
              <button
                className={`${buttonBaseClasses} ${currentPage === page ? activeClasses : inactiveClasses}`}
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
        className={`${buttonBaseClasses} ${inactiveClasses} ${currentPage === totalPages ? disabledClasses : ''}`}
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        Next »
      </button>
    </nav>
  );
};

export default memo(Pagination);