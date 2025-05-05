import { memo, useCallback } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Maximum number of page links to show besides first/last and ellipses. Default is 5. */
  maxVisiblePages?: number;
  /** Custom ARIA label for the navigation landmark */
  ariaLabel?: string;
}

const ELLIPSIS = '...';

/**
 * Generates an array of page numbers and ellipses for pagination UI.
 */
const generatePageNumbers = (
  currentPage: number,
  totalPages: number,
  maxVisible: number // Should be an odd number for best results (e.g., 3, 5, 7)
): (number | string)[] => {
  if (totalPages <= 1) return [];
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];
  const halfVisible = Math.floor(maxVisible / 2);

  pages.push(1);

  let startPage = Math.max(2, currentPage - halfVisible);
  let endPage = Math.min(totalPages - 1, currentPage + halfVisible);

  if (currentPage - halfVisible <= 2) {
    endPage = maxVisible - 1;
  }
  if (currentPage + halfVisible >= totalPages - 1) {
    startPage = totalPages - maxVisible + 2;
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

  pages.push(totalPages);

  return pages;
};

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  ariaLabel = 'Pagination navigation',
}: PaginationProps) {
  const handlePageClick = useCallback(
    (page: number | string) => {
      if (typeof page === 'number') {
        onPageChange(page);
      }
    },
    [onPageChange]
  );

  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = generatePageNumbers(currentPage, totalPages, maxVisiblePages);

  return (
    <nav
      className="flex justify-center items-center gap-2 py-4 font-sans"
      aria-label={ariaLabel}
    >
      {/* Previous Button */}
      <button
        className="px-2 py-1 border border-gray-300 bg-white text-blue-600 rounded-md disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 hover:bg-gray-100 hover:border-gray-400 transition-colors"
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        aria-disabled={currentPage === 1}
        aria-label="Go to previous page"
      >
        &lt; Previous
      </button>

      {/* Page Number Links/Buttons */}
      <ul className="flex list-none p-0 m-0 gap-1">
        {pageNumbers.map((page, index) => (
          <li
            key={typeof page === 'number' ? `page-${page}` : `ellipsis-${index}`}
          >
            {page === ELLIPSIS ? (
              <span
                className="px-2 py-1 text-gray-500 self-center"
                aria-hidden="true"
              >
                {ELLIPSIS}
              </span>
            ) : (
              <button
                className={`px-3 py-1 min-w-[2.2rem] text-center border border-gray-300 rounded-md transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-700 font-bold cursor-default pointer-events-none'
                    : 'bg-white text-blue-600 hover:bg-gray-100 hover:border-gray-400'
                }`}
                onClick={() => handlePageClick(page)}
                aria-current={currentPage === page ? 'page' : undefined}
                aria-label={`Go to page ${page}`}
              >
                {page}
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Next Button */}
      <button
        className="px-2 py-1 border border-gray-300 bg-white text-blue-600 rounded-md disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 hover:bg-gray-100 hover:border-gray-400 transition-colors"
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-disabled={currentPage === totalPages}
        aria-label="Go to next page"
      >
        Next &gt;
      </button>

      {/* Optional: Display total pages info */}
      {/* <span className="ml-2 text-gray-600 text-sm self-center">
        Page {currentPage} of {totalPages}
      </span> */}
    </nav>
  );
}

export default memo(Pagination);