import { queryOptions, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { QueryConfig } from '@/lib/react-query'
import { PaginatedResponse } from '@/types/common'
import { GymDto, GetGymsByCountyPaginationQuery } from '@/types/gyms'
import { env } from '@/config/env'

export const getGyms = ({
  county,
  page = env.PAGE_NUMBER,
  pageSize = env.PAGE_SIZE,
}: GetGymsByCountyPaginationQuery): Promise<PaginatedResponse<GymDto>> => {
  const params: Record<string, string | number | undefined> = {
    page,
    pageSize,
  }
  if (county && county !== 'all') {
    params.county = county
  }
   return api.get('api/gym', { params });
}

export const getGymsQueryOptions = ({
  county,
  page,
  pageSize,
}: GetGymsByCountyPaginationQuery) => {
  return queryOptions({
    queryKey: ['gym', { county, page, pageSize }],
    queryFn: () => getGyms({ county, page, pageSize }),
    placeholderData: previousData => previousData,
    staleTime: 5 * 60 * 1000,
  })
}

export interface UseGymsOptions {
  county?: string | 'all' | undefined
  page: number
  pageSize: number
  queryConfig?: QueryConfig<typeof getGymsQueryOptions>
}

export const useGyms = ({
  county,
  page,
  pageSize,
  queryConfig,
}: UseGymsOptions) => {
  return useQuery({
    ...getGymsQueryOptions({ county, page, pageSize }),
    ...queryConfig,
  })
}
