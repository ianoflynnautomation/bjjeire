import { api } from '@/lib/api-client'
import type { PaginatedResponse } from '@/types/common'
import type { StoreDto, GetStorePaginationQuery } from '@/types/stores'
import { env } from '@/config/env'

export const getStores = ({
  page = env.PAGE_NUMBER,
  pageSize = env.PAGE_SIZE,
}: GetStorePaginationQuery): Promise<PaginatedResponse<StoreDto>> => {
  const params: Record<string, string | number | undefined> = {
    page,
    pageSize,
  }

  return api.get('/api/store', { params })
}
