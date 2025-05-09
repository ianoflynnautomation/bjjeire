import { api } from '../lib/api-client';
import { PaginatedResponse, PaginationMeta } from '../types/common';
import {
  BjjEventDto,
  BackendBjjEventDto,
  GetBjjEventsPaginationQuery,
} from '../types/event';
import { normalizeEvent } from '../utils/dataMappers';
import { usePaginatedQuery } from '../hooks/usePaginatedQuery';

// Define the possible API response types
type BjjEventsApiResponse =
  | BackendBjjEventDto[]
  | { data: BackendBjjEventDto[]; pagination: PaginationMeta };

export const fetchBjjEvents = async (
  queryParams: GetBjjEventsPaginationQuery & { page: number; pageSize: number },
): Promise<PaginatedResponse<BjjEventDto>> => {
  const apiParams: Record<string, unknown> = {
    page: queryParams.page,
    pageSize: queryParams.pageSize,
  };
  if (queryParams.city && queryParams.city !== 'all') {
    apiParams.city = queryParams.city;
  }
  if (queryParams.type && queryParams.type !== 'all') {
    apiParams.type = queryParams.type;
  }

  try {
    const response = await api.get<BjjEventsApiResponse>('/api/bjjevent', { params: apiParams });

    const defaultPagination: PaginationMeta = {
      totalItems: 0,
      currentPage: queryParams.page,
      pageSize: queryParams.pageSize,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
      nextPageUrl: null,
      previousPageUrl: null,
    };

    if (Array.isArray(response.data)) {
      return {
        data: response.data.map(normalizeEvent),
        pagination: {
          totalItems: response.data.length,
          currentPage: queryParams.page,
          pageSize: queryParams.pageSize,
          totalPages: Math.ceil(response.data.length / queryParams.pageSize),
          hasNextPage: response.data.length > queryParams.pageSize * queryParams.page,
          hasPreviousPage: queryParams.page > 1,
          nextPageUrl: null,
          previousPageUrl: null,
        },
      };
    }

    if (response.data && typeof response.data === 'object' && Array.isArray(response.data.data)) {
      return {
        data: response.data.data.map(normalizeEvent),
        pagination: response.data.pagination ?? defaultPagination,
      };
    }

    return { data: [], pagination: defaultPagination };
  } catch (error) {
    console.error('Failed to fetch BJJ events:', error);
    return {
      data: [],
      pagination: {
        totalItems: 0,
        currentPage: queryParams.page,
        pageSize: queryParams.pageSize,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
        nextPageUrl: null,
        previousPageUrl: null,
      },
    };
  }
};

export const useBjjEvents = (
  initialFilters: Omit<GetBjjEventsPaginationQuery, 'page' | 'pageSize'>,
  initialPage = 1,
  initialPageSize = 9,
) => {
  return usePaginatedQuery<BjjEventDto, GetBjjEventsPaginationQuery>({
    queryKeyBase: ['bjjEvents'],
    fetchFn: fetchBjjEvents,
    initialParams: initialFilters,
    initialPage,
    initialPageSize,
    staleTime: 5 * 60 * 1000,
  });
};