import { queryOptions, useQuery } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import { QueryConfig } from '../lib/react-query'
import { PaginatedResponse } from '../types/common'
import { GymDto, GetGymsByCityPaginationQuery } from '../types/gyms'

export const getGyms = ({
  county,
  page = 1,
  pageSize = 12,
}: GetGymsByCityPaginationQuery): Promise<PaginatedResponse<GymDto>> => {
  const params: Record<string, string | number> = {
    page,
    pageSize,
  };
  if (county && county !== 'all') {
    params.county = county;
  }
  return api.get('api/gym', {
    params: {
      county,
      page,
      pageSize,
    },
  })
}

export const getGymsQueryOptions = ({ county, page, pageSize }: GetGymsByCityPaginationQuery) => {
  return queryOptions({
    queryKey: ['gym', { county, page, pageSize }],
    queryFn: () => getGyms({ county, page, pageSize }),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
  })
}

export interface UseGymsOptions {
  county?: string | 'all' | undefined;
  page: number;
  pageSize: number;
  queryConfig?: QueryConfig<typeof getGymsQueryOptions>;
}

export const useGyms = ({ county, page, pageSize, queryConfig }: UseGymsOptions) => {
  return useQuery({
    ...getGymsQueryOptions({ county, page, pageSize }),
    ...queryConfig,
  })
}
