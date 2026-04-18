import { api } from '@/lib/api-client'
import type { PaginatedResponse } from '@/types/common'
import type { BjjEventDto, GetBjjEventsPaginationQuery } from '@/types/event'
import { env } from '@/config/env'

export const getBjjEvents = ({
  county,
  type,
  page = env.PAGE_NUMBER,
  pageSize = env.PAGE_SIZE,
}: GetBjjEventsPaginationQuery): Promise<PaginatedResponse<BjjEventDto>> => {
  const params: Record<string, string | number | undefined> = {
    page,
    pageSize,
  }

  if (county && county !== 'all') {
    params.county = county
  }

  if (type !== undefined && type !== null && type !== 'all') {
    params.type = type
  }

  return api.get('/api/bjjevent', { params })
}
