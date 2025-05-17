/* eslint-disable @typescript-eslint/no-explicit-any */
import { queryOptions, useQuery } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import { County } from '../constants/counties'
import { PaginatedResponse } from '../types/common'
import { QueryConfig } from '../lib/react-query'
import { BjjEventDto, GetBjjEventsPaginationQuery, BjjEventType } from '../types/event'
import { queryConfig } from '@/lib/react-query'
import { env } from '../config/env'

export const getBjjEvents = ({
  county,
  type,
  page = env.PAGE_NUMBER,
  pageSize = env.PAGE_SIZE,
}: GetBjjEventsPaginationQuery): Promise<PaginatedResponse<BjjEventDto>> => {
  const params: Record<string, string | number> = {
    page,
    pageSize,
  }

  if (county && county !== 'all') {
    params.county = county
  }

  if (type !== undefined && type !== null) {
    params.type = type
  }

  return api.get('api/bjjevent', {
    params: {
      county,
      type,
      page,
      pageSize,
    },
  })
}

export const getBjjEventsQueryOptions = ({
  county,
  type,
  page,
  pageSize,
}: GetBjjEventsPaginationQuery) => {
  return queryOptions({
    queryKey: ['bjjevent', { county, type, page, pageSize }],
    queryFn: () => getBjjEvents({ county, type, page, pageSize }),
    placeholderData: previousData => previousData,
    staleTime: 5 * 60 * 1000,
  })
}

type UseBjjEventsOptions = {
  county?: County | 'all'
  type?: BjjEventType
  page: number
  pageSize: number
  queryConfig?: QueryConfig<typeof getBjjEventsQueryOptions>
}

export const useBjjEvents = ({
  county,
  type,
  page,
  pageSize,
}: UseBjjEventsOptions) => {
  return useQuery({
    ...getBjjEventsQueryOptions({ county, type, page, pageSize }),
    ...queryConfig,
  })
}