import { api } from '@/lib/api-client'
import { API_RESOURCE_ROUTES } from '@/config/api-routes'
import type { PaginatedResponse } from '@/types/common'
import type { BjjEventDto, GetBjjEventsPaginationQuery } from '@/types/event'

export const getBjjEvents = ({
  county,
  types,
  page,
  pageSize,
}: GetBjjEventsPaginationQuery): Promise<PaginatedResponse<BjjEventDto>> => {
  const params: Record<
    string,
    string | number | (string | number)[] | undefined
  > = {
    page,
    pageSize,
  }

  if (county && county !== 'all') {
    params.county = county
  }

  if (types && types.length > 0) {
    params.types = types
  }

  return api.get(API_RESOURCE_ROUTES.bjjEvents, {
    params,
    paramsSerializer: { indexes: null },
  })
}
