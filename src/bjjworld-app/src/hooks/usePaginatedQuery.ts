import { useState, useMemo, useCallback } from 'react';
import { useQuery, QueryKey } from '@tanstack/react-query';
import { PaginatedResponse, PaginationMeta } from '../types/common';

interface UsePaginatedQueryProps<TData, TQueryParams extends object> {
  queryKeyBase: QueryKey;
  fetchFn: (params: TQueryParams & { page: number; pageSize: number }) => Promise<PaginatedResponse<TData>>;
  initialParams?: Omit<TQueryParams, 'page' | 'pageSize'>;
  initialPage?: number;
  initialPageSize?: number;
}

export interface UsePaginatedQueryResult<TData, TQueryParams extends object> {
  data: TData[] | undefined;
  meta: PaginationMeta | undefined; // Changed from `pagination` to `meta`
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  currentPage: number;
  handlePageChange: (page: number) => void;
  updateFilters: (newFilters: Partial<Omit<TQueryParams, 'page' | 'pageSize'>>) => void;
}

export function usePaginatedQuery<TData, TQueryParams extends object>({
  queryKeyBase,
  fetchFn,
  initialParams = {} as Omit<TQueryParams, 'page' | 'pageSize'>,
  initialPage = 1,
  initialPageSize = 9,
}: UsePaginatedQueryProps<TData, TQueryParams>): UsePaginatedQueryResult<TData, TQueryParams> {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [queryParams, setQueryParams] = useState<Omit<TQueryParams, 'page' | 'pageSize'>>(initialParams);

  const queryKey = useMemo(
    () => [...queryKeyBase, { ...queryParams, page: currentPage, pageSize: initialPageSize }],
    [queryKeyBase, queryParams, currentPage, initialPageSize]
  );

  const { data, isLoading, isFetching, error } = useQuery<PaginatedResponse<TData>, Error>({
    queryKey,
    queryFn: () =>
      fetchFn({
        ...queryParams,
        page: currentPage,
        pageSize: initialPageSize,
      } as TQueryParams & { page: number; pageSize: number }),
    staleTime: 5 * 60 * 1000,
  });

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  const updateFilters = useCallback(
    (newFilters: Partial<Omit<TQueryParams, 'page' | 'pageSize'>>) => {
      setQueryParams((prev) => ({ ...prev, ...newFilters }));
      setCurrentPage(1);
    },
    []
  );

  return {
    data: data?.data,
    meta: data?.meta, // Changed from `pagination` to `meta`
    isLoading,
    isFetching,
    error,
    currentPage,
    handlePageChange,
    updateFilters,
  };
}