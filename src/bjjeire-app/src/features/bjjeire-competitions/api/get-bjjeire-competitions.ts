import { api } from '@/lib/api-client'
import { API_RESOURCE_ROUTES } from '@/config/api-routes'
import type { PaginatedResponse } from '@/types/common'
import type {
  GetBjjEireCompetitionsPaginationQuery,
  BjjEireCompetitionDto,
  BjjEireCompetitionSummaryDto,
  LeaderboardDto,
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

/** Podiums and both rankings (FR-032 to FR-035); winners once finished (FR-040). */
export const getBjjEireCompetitionLeaderboard = (
  id: string
): Promise<LeaderboardDto> =>
  api.get(
    `${API_RESOURCE_ROUTES.bjjEireCompetitions}/${encodeURIComponent(id)}/leaderboard`
  )
