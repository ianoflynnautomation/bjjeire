import { api } from '@/lib/api-client'
import { API_RESOURCE_ROUTES } from '@/config/api-routes'
import type { PaginatedResponse } from '@/types/common'
import type { GymDto, GetGymsByCountyPaginationQuery } from '@/types/gyms'
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
  return api.get(API_RESOURCE_ROUTES.gyms, { params })
}
