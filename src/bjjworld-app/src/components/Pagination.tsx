
import React, { memo, useCallback } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
  ariaLabel?: string;
}

const ELLIPSIS = '...';

const generatePageNumbers = (
  currentPage: number,
  totalPages: number,
  maxVisible: number
): (number | string)[] => {
  if (totalPages <= 1) return [];
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];
  const halfVisible = Math.floor((maxVisible - 2) / 2); 

  pages.push(1);

  let startPage = Math.max(2, currentPage - halfVisible);
  let endPage = Math.min(totalPages - 1, currentPage + halfVisible);

  if (currentPage - 1 <= halfVisible) { 
    endPage = Math.min(totalPages - 1, maxVisible - 2); 
  }
  if (totalPages - currentPage <= halfVisible) {
    startPage = Math.max(2, totalPages - (maxVisible - 3)); 
  }


  if (startPage > 2) {
    pages.push(ELLIPSIS);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (endPage < totalPages - 1) {
    pages.push(ELLIPSIS);
  }

  if (totalPages > 1) pages.push(totalPages); 

  return [...new Set(pages)];
};


const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  ariaLabel = 'Pagination navigation',
}) => {
  const handlePageClick = useCallback(
    (page: number | string) => {
      if (typeof page === 'number' && page !== currentPage) {
        onPageChange(page);
      }
    },
    [onPageChange, currentPage]
  );

  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = generatePageNumbers(currentPage, totalPages, maxVisiblePages < 3 ? 3 : maxVisiblePages);


  const buttonBaseClasses = "px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1";
  const inactiveButtonClasses = "bg-white text-gray-700 hover:bg-gray-100 hover:border-gray-400";
  const activeButtonClasses = "bg-blue-600 text-white border-blue-600 cursor-default pointer-events-none";
  const disabledButtonClasses = "opacity-60 cursor-not-allowed bg-gray-50 text-gray-400";


  return (
    <nav
      className="flex flex-col sm:flex-row justify-center items-center gap-3 py-6 font-sans"
      aria-label={ariaLabel}
    >
      <div className="flex items-center gap-1.5">
      <button
        className={`${buttonBaseClasses} ${inactiveButtonClasses} ${currentPage === 1 ? disabledButtonClasses : ''}`}
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        aria-disabled={currentPage === 1}
        aria-label="Go to previous page"
      >
        &laquo; Prev
      </button>

      <ul className="flex list-none p-0 m-0 gap-1.5">
        {pageNumbers.map((page, index) => (
          <li
            key={typeof page === 'number' ? `page-${page}` : `ellipsis-${index}`}
          >
            {page === ELLIPSIS ? (
              <span
                className="px-3 py-1.5 text-gray-500 self-center text-sm"
                aria-hidden="true"
              >
                {ELLIPSIS}
              </span>
            ) : (
              <button
                className={`${buttonBaseClasses} ${
                  currentPage === page
                    ? activeButtonClasses
                    : inactiveButtonClasses
                }`}
                onClick={() => handlePageClick(page as number)}
                aria-current={currentPage === page ? 'page' : undefined}
                aria-label={`Go to page ${page}`}
              >
                {page}
              </button>
            )}
          </li>
        ))}
      </ul>

      <button
        className={`${buttonBaseClasses} ${inactiveButtonClasses} ${currentPage === totalPages ? disabledButtonClasses : ''}`}
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-disabled={currentPage === totalPages}
        aria-label="Go to next page"
      >
        Next &raquo;
      </button>
      </div>
       {/* Optional: Display total pages info - can be enabled if desired */}
      <span className="mt-2 sm:mt-0 sm:ml-3 text-gray-600 text-xs self-center">
        Page {currentPage} of {totalPages}
      </span>
    </nav>
  );
}

export default memo(Pagination);