import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { PaginatedResponse } from "../types/common";
import {BjjEventDto, GetBjjEventsPaginationQuery, BjjEventType } from "../types/event";


export const getBjjEvent = ({
  page = 1,
  pageSize = 12,
  city,
  type,
}: GetBjjEventsPaginationQuery): Promise<PaginatedResponse<BjjEventDto>> => {
  return api.get('api/bjjevent', {
    params: {
      page,
      pageSize,
      city: city === 'all' ? undefined : city,
      type: type === 'all' ? undefined : type,
    },
  });
};

export const getBjjEventQueryOptions = ({
  page,
  pageSize,
  city,
  type,
}: GetBjjEventsPaginationQuery) => {
  return queryOptions({
    queryKey: ['bjjEvent', { page, pageSize, city, type }],
    queryFn: () => getBjjEvent({ page, pageSize, city, type }),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true, 
  });
};

type UseBjjEventsOptions = {
  page?: number;
  pageSize?: number;
  city?: string | 'all';
  type?: BjjEventType | 'all';
};

export const useBjjEvents = ({
  page = 1,
  pageSize = 12,
  city = 'all',
  type = 'all',
}: UseBjjEventsOptions) => {
  return useQuery(getBjjEventQueryOptions({ page, pageSize, city, type }));
};