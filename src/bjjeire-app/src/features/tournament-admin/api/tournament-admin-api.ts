import { api } from '@/lib/api-client'
import { API_RESOURCE_ROUTES } from '@/config/api-routes'
import type { PaginatedResponse } from '@/types/common'
import type {
  TournamentCommand,
  TournamentDto,
  TournamentSummaryDto,
  UpdateTournamentCommand,
} from '@/types/tournaments'

const { tournaments, tournamentsAdmin } = API_RESOURCE_ROUTES

/** The API's largest page: the organiser sees every tournament at once. */
const ADMIN_PAGE_SIZE = 100

export const getAdminTournaments = (): Promise<
  PaginatedResponse<TournamentSummaryDto>
> =>
  api.get(tournamentsAdmin, { params: { page: 1, pageSize: ADMIN_PAGE_SIZE } })

export const getAdminTournament = (id: string): Promise<TournamentDto> =>
  api.get(`${tournamentsAdmin}/${encodeURIComponent(id)}`)

export const createTournament = (
  command: TournamentCommand
): Promise<TournamentDto> => api.post(tournaments, command)

export const updateTournament = (
  id: string,
  command: UpdateTournamentCommand
): Promise<TournamentDto> =>
  api.put(`${tournaments}/${encodeURIComponent(id)}`, command)

export const publishTournament = (id: string): Promise<TournamentDto> =>
  api.post(`${tournaments}/${encodeURIComponent(id)}/publish`)
