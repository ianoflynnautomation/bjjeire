import { queryOptions } from '@tanstack/react-query';
import {City} from '../constants/cities';
import { api } from '../lib/api-client';
import { PaginatedResponse, HateoasPagination } from '../types/common';
import { BjjEventDto, BackendBjjEventDto, BjjEventType } from '../types/event';
import { normalizeEvent } from '../utils/dataMappers';

interface BackendBjjEventsResponse {
  data: BackendBjjEventDto[];
  pagination: HateoasPagination;
}

export interface GetBjjEventsPaginationQuery {
  city?: City | 'all';
  type?: BjjEventType | undefined;
  page?: number;
  pageSize?: number;
}

export const getBjjEvents = async ({
  city,
  type,
  page = 1,
  pageSize = 10,
  url,
}: GetBjjEventsPaginationQuery & { url?: string | null }): Promise<PaginatedResponse<BjjEventDto>> => {
  if (url) {
    const response = await api.get<BackendBjjEventsResponse>(url);
    return {
      data: response.data.map(normalizeEvent),
      pagination: response.pagination,
    };
  }

  const params: Record<string, string | number> = {
    page,
    pageSize,
  };
  if (city && city !== 'all') {
    params.city = city;
  }
  if (type !== undefined) {
    params.type = type; 
  }

  const response = await api.get<BackendBjjEventsResponse>('/api/bjjevent', { params });
  return {
    data: response.data.map(normalizeEvent),
    pagination: response.pagination,
  };
};

export const getBjjEventsQueryOptions = ({
  city,
  type,
  page,
  pageSize,
  url,
}: GetBjjEventsPaginationQuery & { url?: string | null }) => {
  const queryKeyParams = {
    city: city || 'all',
    type: type ?? undefined,
    page: page || 1,
    pageSize: pageSize || 10,
    url,
  };

  return queryOptions({
    queryKey: ['bjjEvents', queryKeyParams],
    queryFn: () => getBjjEvents({ city, type, page, pageSize, url }),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });
};