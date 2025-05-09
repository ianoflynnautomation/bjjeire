import { queryOptions } from '@tanstack/react-query';
import { api } from '../lib/api-client';
import { PaginatedResponse, PaginationMeta } from '../types/common';
import { BjjEventDto, GetBjjEventsPaginationQuery, BackendBjjEventDto } from '../types/event';
import { normalizeEvent } from '../utils/dataMappers';

interface BackendBjjEventsResponse {
  data: BackendBjjEventDto[];
  meta: PaginationMeta; 
}

export const getBjjEvents = async ({
  city,
  type,
  page = 1,
  pageSize = 9,
}: GetBjjEventsPaginationQuery): Promise<PaginatedResponse<BjjEventDto>> => {
  const params: Record<string, string | number> = {
    page,
    pageSize,
  };
  if (city && city !== 'all') {
    params.city = city;
  }
  if (type && type !== 'all') {
    params.type = type;
  }

  const response = await api.get<BackendBjjEventsResponse>('/api/bjjevent', { params });
  return {
    data: response.data.map(normalizeEvent),
    meta: response.meta,
  };
};

export const getBjjEventsQueryOptions = ({
  city,
  type,
  page,
  pageSize,
}: GetBjjEventsPaginationQuery) => {
  const queryKeyParams = {
    city: city || 'all',
    type: type || 'all',
    page: page || 1,
    pageSize: pageSize || 9,
  };

  return queryOptions({
    queryKey: ['bjjEvents', queryKeyParams],
    queryFn: () => getBjjEvents({ city, type, page, pageSize }),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });
};