import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { HateoasPagination, PaginatedResponse } from '../types/common'; 

interface PaginatedQueryParams<T, TParams> {
  queryKeyBase: string[];
  fetchFn: (params: TParams & { url?: string | null }) => Promise<PaginatedResponse<T>>;
  initialParams: TParams;
}

// Add refetch to the result interface
interface PaginatedQueryResult<T, TParams> {
  data: T[] | undefined;
  pagination: HateoasPagination | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  currentPage: number;
  handlePageChange: (url: string | null, page?: number) => void;
  updateFilters: (newFilters: Partial<TParams>) => void;
  refetch: () => Promise<UseQueryResult<PaginatedResponse<T>>>; // Added refetch type
}

export const usePaginatedQuery = <T, TParams extends object>({
  queryKeyBase,
  fetchFn,
  initialParams,
}: PaginatedQueryParams<T, TParams>): PaginatedQueryResult<T, TParams> => {
  const [params, setParams] = useState<TParams>(initialParams);
  const [currentPage, setCurrentPage] = useState<number>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (initialParams as any).page || 1
  );
  const [currentUrl, setCurrentUrl] = useState<string | null | undefined>(undefined);

  // Destructure refetch from useQuery
  const { data, isLoading, isFetching, error, refetch } = useQuery<PaginatedResponse<T>>({
    queryKey: [...queryKeyBase, { ...params, page: currentPage, url: currentUrl }], // Ensure page in params is consistent with currentPage
    queryFn: () => fetchFn({ ...params, page: currentPage, url: currentUrl } as TParams & { url?: string | null; page?: number }), // Ensure page is passed
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
    // Consider adding keepPreviousData: true for a smoother UX during pagination/filtering
  });

  const handlePageChange = useCallback(
    (url: string | null, page?: number) => {
      setCurrentUrl(url); // Prioritize URL for HATEOAS links
      let newPage = currentPage;
      if (page !== undefined) {
        newPage = page;
      } else if (url) {
        const pageMatch = url.match(/[?&]page=(\d+)/);
        if (pageMatch) {
          newPage = parseInt(pageMatch[1], 10);
        }
      }
      setCurrentPage(newPage);
      // No need to setParams here if 'page' is directly used from currentPage in queryKey/queryFn
    },
    [currentPage] // Added currentPage dependency
  );

  const updateFilters = useCallback(
    (newFilters: Partial<TParams>) => {
      // Reset to page 1 when filters change
      const resetPage = 1;
      setParams((prev) => ({ ...prev, ...newFilters })); // page will be handled by currentPage
      setCurrentPage(resetPage);
      setCurrentUrl(undefined); // Reset URL to ensure filters are primary, not the old HATEOAS link
    },
    []
  );

  // Ensure the returned refetch function has the correct type
  const typedRefetch = useCallback(async () => {
    return refetch();
  }, [refetch]);


  return {
    data: data?.data,
    pagination: data?.pagination,
    isLoading,
    isFetching,
    error,
    currentPage,
    handlePageChange,
    updateFilters,
    refetch: typedRefetch, // Return refetch
  };
};