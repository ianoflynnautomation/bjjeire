import { api } from '@/lib/api-client'
import { API_RESOURCE_ROUTES } from '@/config/api-routes'
import type { PaginatedResponse } from '@/types/common'
import type {
  CompetitionDto,
  GetCompetitionsPaginationQuery,
} from '@/types/competitions'

export const getCompetitions = ({
  page,
  pageSize,
}: GetCompetitionsPaginationQuery): Promise<
  PaginatedResponse<CompetitionDto>
> => {
  const params: Record<string, string | number | undefined> = {
    page,
    pageSize,
  }
  return api.get(API_RESOURCE_ROUTES.competitions, { params })
}
