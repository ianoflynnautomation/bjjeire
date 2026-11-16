import { api } from '@/lib/api-client'
import { API_RESOURCE_ROUTES } from '@/config/api-routes'
import type { PaginatedResponse } from '@/types/common'
import type {
  GetBjjEireCompetitionsPaginationQuery,
  BjjEireCompetitionDto,
  BjjEireCompetitionSummaryDto,
} from '@/types/bjjeire-competitions'

export const getBjjEireCompetitions = ({
  page,
  pageSize,
}: GetBjjEireCompetitionsPaginationQuery): Promise<
  PaginatedResponse<BjjEireCompetitionSummaryDto>
> =>
  api.get(API_RESOURCE_ROUTES.bjjEireCompetitions, {
    params: { page, pageSize },
  })

export const getBjjEireCompetition = (
  slug: string
): Promise<BjjEireCompetitionDto> =>
  api.get(
    `${API_RESOURCE_ROUTES.bjjEireCompetitions}/${encodeURIComponent(slug)}`
  )
