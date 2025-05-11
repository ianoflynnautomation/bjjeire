import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { HateoasPagination, PaginatedResponse } from '../types/common';

interface PaginatedQueryParams<T, TParams> {
  queryKeyBase: string[];
  fetchFn: (params: TParams & { url?: string | null }) => Promise<PaginatedResponse<T>>;
  initialParams: TParams;
}

interface PaginatedQueryResult<T, TParams> {
  data: T[] | undefined;
  pagination: HateoasPagination | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  currentPage: number;
  handlePageChange: (url: string | null, page?: number) => void;
  updateFilters: (newFilters: Partial<TParams>) => void;
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

  const { data, isLoading, isFetching, error } = useQuery<PaginatedResponse<T>>({
    queryKey: [...queryKeyBase, { ...params, url: currentUrl }],
    queryFn: () => fetchFn({ ...params, url: currentUrl }),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });

  const handlePageChange = useCallback(
    (url: string | null, page?: number) => {
      setCurrentUrl(url);
      if (page !== undefined) {
        setCurrentPage(page);
        setParams((prev) => ({ ...prev, page }));
      } else if (url) {
        const pageMatch = url.match(/page=(\d+)/);
        if (pageMatch) {
          setCurrentPage(parseInt(pageMatch[1], 10));
        }
      }
    },
    []
  );

  const updateFilters = useCallback(
    (newFilters: Partial<TParams>) => {
      setParams((prev) => ({ ...prev, ...newFilters, page: 1 }));
      setCurrentPage(1);
      setCurrentUrl(undefined); // Reset URL when filters change
    },
    []
  );

  return {
    data: data?.data,
    pagination: data?.pagination,
    isLoading,
    isFetching,
    error,
    currentPage,
    handlePageChange,
    updateFilters,
  };
};