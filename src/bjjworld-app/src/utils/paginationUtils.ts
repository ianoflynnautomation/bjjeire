export const ELLIPSIS = '...';

export const generatePageNumbers = (
  currentPage: number,
  totalPages: number,
  maxVisible: number
): (number | string)[] => {
  if (totalPages <= 1) return [];
  // Ensure maxVisible is at least 3 to handle first, last, and one page or ellipsis
  const effectiveMaxVisible = Math.max(3, maxVisible);

  if (totalPages <= effectiveMaxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];
  const numSidePages = Math.floor((effectiveMaxVisible - 3) / 2); // Pages around current, besides 1, last, and ellipses
  const pagesBeforeCurrent = Math.max(0, numSidePages);
  const pagesAfterCurrent = Math.max(0, effectiveMaxVisible - 3 - pagesBeforeCurrent);


  // Always add the first page
  pages.push(1);

  // Ellipsis after first page
  let showStartEllipsis = currentPage > 2 + pagesBeforeCurrent;
  if (1 + pagesBeforeCurrent + 1 + pagesAfterCurrent + 1 >= totalPages -1 ) showStartEllipsis = false;


  let startPage = Math.max(2, currentPage - pagesBeforeCurrent);
  let endPage = Math.min(totalPages - 1, currentPage + pagesAfterCurrent);

  // Adjust start and end pages if current page is near the beginning or end
    if (currentPage - 1 <= pagesBeforeCurrent +1) { // Near the start
        endPage = Math.min(totalPages - 1, 1 + (effectiveMaxVisible -2) );
        showStartEllipsis = false;
    }

    if (totalPages - currentPage <= pagesAfterCurrent+1) { // Near the end
        startPage = Math.max(2, totalPages - (effectiveMaxVisible - 2));
         if (startPage <= 2) showStartEllipsis = false; // no ellipsis if startPage is 2
    }


  if (showStartEllipsis && startPage > 2) {
    pages.push(ELLIPSIS);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  // Ellipsis before last page
  let showEndEllipsis = currentPage < totalPages - 1 - pagesAfterCurrent;
  if (endPage >= totalPages -1) showEndEllipsis = false;
    if (totalPages - currentPage <= pagesAfterCurrent+1 ) { // Near the end
      showEndEllipsis = false;
    }


  if (showEndEllipsis && endPage < totalPages - 1) {
    pages.push(ELLIPSIS);
  }

  // Always add the last page if totalPages > 1
  if (totalPages > 1) pages.push(totalPages);

  return pages;
};