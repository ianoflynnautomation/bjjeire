// src/api/get-bjj-events.ts
import { api } from '../lib/api-client';
import { PaginatedResponse, PaginationMeta } from '../types/common';
import {
  BjjEventDto,
  BackendBjjEventDto,
  GetBjjEventsPaginationQuery,
} from '../types/event';
import { normalizeEvent } from '../utils/dataMappers';
import { usePaginatedQuery } from '../hooks/usePaginatedQuery';

// Expected backend response when pagination is included
interface BackendPaginatedEventsResponse {
  data: BackendBjjEventDto[];
  pagination: Partial<PaginationMeta> & { totalItems?: number }; // Backend might not send all fields
}

// The API can return an array directly OR an object with data and pagination
type BjjEventsApiResponse = BackendBjjEventDto[] | BackendPaginatedEventsResponse;

// Helper to construct a fallback or client-side pagination meta
// This is used when the backend doesn't provide full pagination info
const buildPaginationMeta = (
    requestedPage: number,
    requestedPageSize: number,
    itemsOnCurrentPage: number,
    backendPagination?: Partial<PaginationMeta> & { totalItems?: number }
): PaginationMeta => {
    const totalItems = backendPagination?.totalItems ?? itemsOnCurrentPage; // Prefer backend totalItems

    // Calculate totalPages:
    // 1. If backend provides totalPages, use that.
    // 2. Else, if backend provides totalItems, calculate from that.
    // 3. Else (only itemsOnCurrentPage known, and it's less than pageSize), assume this is the last page.
    // 4. Else (only itemsOnCurrentPage known, and it's a full page), we can't know true totalPages.
    //    For this case, we can make hasNextPage true and let the user find out.
    //    Or, to make Pagination component work somewhat, totalPages could be current page + 1 if full.
    let totalPages: number;
    if (backendPagination?.totalPages !== undefined) {
        totalPages = backendPagination.totalPages;
    } else if (backendPagination?.totalItems !== undefined) {
        totalPages = requestedPageSize > 0 ? Math.ceil(backendPagination.totalItems / requestedPageSize) : 0;
    } else {
        // This is the tricky case: no totalItems or totalPages from backend.
        // Only current page's items are known.
        if (itemsOnCurrentPage < requestedPageSize && itemsOnCurrentPage >= 0) {
            totalPages = requestedPage; // This is the last page
        } else {
            // We have a full page, might be more. Pagination component will be limited.
            // Setting totalPages to requestedPage + 1 is an optimistic guess to keep 'Next' alive.
            // Or, a different strategy is needed if API is like this.
            totalPages = requestedPage + (itemsOnCurrentPage === requestedPageSize ? 1 : 0); // Hacky for UI
             // A better approach for this scenario might be an "infinite scroll" like pagination
             // where 'totalPages' is not strictly enforced or known.
             // For now, this makes the 'Pagination' component show at least one more page if full.
        }
    }
    totalPages = Math.max(totalPages, requestedPage); // Ensure totalPages is at least the current page

    const currentPage = backendPagination?.currentPage ?? requestedPage;

    return {
        totalItems: totalItems,
        currentPage: currentPage,
        pageSize: requestedPageSize,
        totalPages: totalPages,
        hasNextPage: backendPagination?.hasNextPage !== undefined
            ? backendPagination.hasNextPage
            : currentPage < totalPages,
        hasPreviousPage: backendPagination?.hasPreviousPage !== undefined
            ? backendPagination.hasPreviousPage
            : currentPage > 1,
        nextPageUrl: backendPagination?.nextPageUrl ?? null,
        previousPageUrl: backendPagination?.previousPageUrl ?? null,
    };
};


export const fetchBjjEvents = async (
  // These are the params received from usePaginatedQuery
  params: GetBjjEventsPaginationQuery & { page: number; pageSize: number },
): Promise<PaginatedResponse<BjjEventDto>> => {
  const { page, pageSize, city, type } = params;

  const apiParams: Record<string, string | number> = {
    page,
    pageSize,
  };
  if (city && city !== 'all') {
    apiParams.city = city;
  }
  if (type && type !== 'all') {
    apiParams.type = type;
  }

  try {
    const response = await api.get<BjjEventsApiResponse>('/api/bjjevent', { params: apiParams });
    if (!response || !response.data) {
      console.warn('API response or response.data is undefined or null.');
      throw new Error('Invalid API response: No data received.');
    }

    let normalizedEvents: BjjEventDto[];
    let paginationMeta: PaginationMeta;

    if (Array.isArray(response.data)) {
      // Scenario B: Backend returned just an array of items
      const backendEvents = response.data as BackendBjjEventDto[];
      normalizedEvents = backendEvents.map(normalizeEvent);
      // We MUST be careful here. We don't know the true totalItems/totalPages.
      paginationMeta = buildPaginationMeta(page, pageSize, backendEvents.length, undefined);
      // The `totalPages` from buildPaginationMeta here will be an estimation if backend totals are unknown.
      // This might lead to your Pagination component showing "Page X of X" or "Page X of X+1"
      // and then adjusting as the user clicks "Next".
    } else if (typeof response.data === 'object' && 'data' in response.data && Array.isArray(response.data.data)) {
      // Scenario A: Backend returned { data: [], pagination: {} }
      const paginatedResponse = response.data as BackendPaginatedEventsResponse;
      normalizedEvents = paginatedResponse.data.map(normalizeEvent);
      paginationMeta = buildPaginationMeta(page, pageSize, paginatedResponse.data.length, paginatedResponse.pagination);
    } else {
      // Unexpected response structure
      console.error('Unexpected API response structure:', response.data);
      throw new Error('Unexpected API response structure.');
    }

    return {
      data: normalizedEvents,
      pagination: paginationMeta,
    };

  } catch (error) {
    console.error('Failed to fetch BJJ events in fetchBjjEvents:', error);
    // Re-throw the error for useQuery (and subsequently usePaginatedQuery) to handle
    throw error;
  }
};

export const useBjjEvents = (
  initialFilters: Omit<GetBjjEventsPaginationQuery, 'page' | 'pageSize'>,
  initialPage = 1,
  initialPageSize = 9,
) => {
  return usePaginatedQuery<BjjEventDto, GetBjjEventsPaginationQuery>({
    queryKeyBase: ['bjjEvents'], // Key for caching and refetching, e.g., for React Query
    fetchFn: fetchBjjEvents,  
    initialParams: initialFilters,
    initialPage,
    initialPageSize,
    staleTime: 5 * 60 * 1000, 
    // gcTime (or cacheTime in older TanStack Query versions) could also be set here
    // gcTime: 10 * 60 * 1000, // How long to keep unused data in memory (10 minutes)
  });
};