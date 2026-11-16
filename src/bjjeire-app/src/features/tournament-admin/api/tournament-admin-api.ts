import { api } from '@/lib/api-client'
import { API_RESOURCE_ROUTES } from '@/config/api-routes'
import type { PaginatedResponse } from '@/types/common'
import type {
  AdminCancelCommand,
  AdminRegistrationDto,
  CancellationDto,
  ChangeDivisionCommand,
  MergeTeamsCommand,
  TeamMergeDto,
} from '@/types/registrations'
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

const tournamentPath = (id: string): string =>
  `${tournaments}/${encodeURIComponent(id)}`

/** Refunds every confirmed sign-up and mails each competitor (#5026). Safe to repeat. */
export const cancelTournament = (id: string): Promise<TournamentDto> =>
  api.post(`${tournamentPath(id)}/cancel`)

export const getTournamentRegistrations = (
  id: string,
  page: number
): Promise<PaginatedResponse<AdminRegistrationDto>> =>
  api.get(`${tournamentPath(id)}/registration`, {
    params: { page, pageSize: ADMIN_PAGE_SIZE },
  })

/** Every sign-up as CSV text, for a download built in the browser (the request needs the token). */
export const exportTournamentRegistrations = (id: string): Promise<string> =>
  api.get(`${tournamentPath(id)}/registration`, {
    params: { format: 'csv' },
    responseType: 'text',
  })

export const moveTournamentRegistration = (
  id: string,
  registrationId: string,
  command: ChangeDivisionCommand
): Promise<AdminRegistrationDto> =>
  api.put(
    `${tournamentPath(id)}/registration/${encodeURIComponent(registrationId)}/division`,
    command
  )

export const cancelTournamentRegistration = (
  id: string,
  registrationId: string,
  command: AdminCancelCommand
): Promise<CancellationDto> =>
  api.post(
    `${tournamentPath(id)}/registration/${encodeURIComponent(registrationId)}/cancel`,
    command
  )

export const mergeTournamentTeams = (
  id: string,
  command: MergeTeamsCommand
): Promise<TeamMergeDto> =>
  api.post(`${tournamentPath(id)}/team-merge`, command)
