import { api } from '@/lib/api-client'
import { API_RESOURCE_ROUTES } from '@/config/api-routes'
import type { PaginatedResponse } from '@/types/common'
import type {
  GetTournamentsPaginationQuery,
  TournamentDto,
  TournamentSummaryDto,
} from '@/types/tournaments'

export const getTournaments = ({
  page,
  pageSize,
}: GetTournamentsPaginationQuery): Promise<
  PaginatedResponse<TournamentSummaryDto>
> => api.get(API_RESOURCE_ROUTES.tournaments, { params: { page, pageSize } })

export const getTournament = (slug: string): Promise<TournamentDto> =>
  api.get(`${API_RESOURCE_ROUTES.tournaments}/${encodeURIComponent(slug)}`)
