import { queryOptions } from '@tanstack/react-query';
import { api } from '../lib/api-client';
import { PaginatedResponse } from '../types/common';
import { EventFormData, BackendBjjEventDto, BjjEventDto, GetBjjEventsPaginationQuery, BackendBjjEventsResponse } from '../types/event';
import { normalizeEvent, mapEventFormDataToDto } from '../utils/dataMappers';

export const getBjjEvents = async ({
  city,
  type,
  page = 1,
  pageSize = 12,
  url,
}: GetBjjEventsPaginationQuery & { url?: string | null }): Promise<PaginatedResponse<BjjEventDto>> => {
  if (url) {
    const response = await api.get<BackendBjjEventsResponse>(url);
    return {
      data: response.data.map(normalizeEvent),
      pagination: response.pagination,
    };
  }

  const params: Record<string, string | number> = { page, pageSize };
  if (city && city !== 'all') params.city = city;
  if (type !== undefined) params.type = type;

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
}: GetBjjEventsPaginationQuery & { url?: string | null }) =>
  queryOptions({
    queryKey: ['bjjEvents', { city: city || 'all', type, page: page || 1, pageSize: pageSize || 12, url }],
    queryFn: () => getBjjEvents({ city, type, page, pageSize, url }),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });

export const postEvent = async (formData: EventFormData): Promise<BackendBjjEventDto> => {
  const apiPayload = mapEventFormDataToDto(formData);
  return api.post<BackendBjjEventDto>('/api/bjjevent', apiPayload);
};