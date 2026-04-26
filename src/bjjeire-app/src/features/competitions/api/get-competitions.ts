import { api } from '@/lib/api-client'
import type { PaginatedResponse } from '@/types/common'
import type {
  CompetitionDto,
  GetCompetitionsPaginationQuery,
} from '@/types/competitions'
import { env } from '@/config/env'

export const getCompetitions = ({
  page = env.PAGE_NUMBER,
  pageSize = env.PAGE_SIZE,
}: GetCompetitionsPaginationQuery): Promise<
  PaginatedResponse<CompetitionDto>
> => {
  const params: Record<string, string | number | undefined> = {
    page,
    pageSize,
  }
  return api.get('/competition', { params })
}
