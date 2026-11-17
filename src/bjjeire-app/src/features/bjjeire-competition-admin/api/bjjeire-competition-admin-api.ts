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
  AdminDivisionResultDto,
  BjjEireCompetitionCommand,
  BjjEireCompetitionDto,
  BjjEireCompetitionSummaryDto,
  RecordResultCommand,
  UpdateBjjEireCompetitionCommand,
} from '@/types/bjjeire-competitions'

const { bjjEireCompetitions, bjjEireCompetitionsAdmin } = API_RESOURCE_ROUTES

/** The API's largest page: the organiser sees every competition at once. */
const ADMIN_PAGE_SIZE = 100

export const getAdminBjjEireCompetitions = (): Promise<
  PaginatedResponse<BjjEireCompetitionSummaryDto>
> =>
  api.get(bjjEireCompetitionsAdmin, {
    params: { page: 1, pageSize: ADMIN_PAGE_SIZE },
  })

export const getAdminBjjEireCompetition = (
  id: string
): Promise<BjjEireCompetitionDto> =>
  api.get(`${bjjEireCompetitionsAdmin}/${encodeURIComponent(id)}`)

export const createBjjEireCompetition = (
  command: BjjEireCompetitionCommand
): Promise<BjjEireCompetitionDto> => api.post(bjjEireCompetitions, command)

export const updateBjjEireCompetition = (
  id: string,
  command: UpdateBjjEireCompetitionCommand
): Promise<BjjEireCompetitionDto> =>
  api.put(`${bjjEireCompetitions}/${encodeURIComponent(id)}`, command)

export const publishBjjEireCompetition = (
  id: string
): Promise<BjjEireCompetitionDto> =>
  api.post(`${bjjEireCompetitions}/${encodeURIComponent(id)}/publish`)

const bjjEireCompetitionPath = (id: string): string =>
  `${bjjEireCompetitions}/${encodeURIComponent(id)}`

/** Refunds every confirmed sign-up and mails each competitor (#5026). Safe to repeat. */
export const cancelBjjEireCompetition = (
  id: string
): Promise<BjjEireCompetitionDto> =>
  api.post(`${bjjEireCompetitionPath(id)}/cancel`)

export const getBjjEireCompetitionRegistrations = (
  id: string,
  page: number
): Promise<PaginatedResponse<AdminRegistrationDto>> =>
  api.get(`${bjjEireCompetitionPath(id)}/registration`, {
    params: { page, pageSize: ADMIN_PAGE_SIZE },
  })

/** Every sign-up as CSV text, for a download built in the browser (the request needs the token). */
export const exportBjjEireCompetitionRegistrations = (
  id: string
): Promise<string> =>
  api.get(`${bjjEireCompetitionPath(id)}/registration`, {
    params: { format: 'csv' },
    responseType: 'text',
  })

export const moveBjjEireCompetitionRegistration = (
  id: string,
  registrationId: string,
  command: ChangeDivisionCommand
): Promise<AdminRegistrationDto> =>
  api.put(
    `${bjjEireCompetitionPath(id)}/registration/${encodeURIComponent(registrationId)}/division`,
    command
  )

export const cancelBjjEireCompetitionRegistration = (
  id: string,
  registrationId: string,
  command: AdminCancelCommand
): Promise<CancellationDto> =>
  api.post(
    `${bjjEireCompetitionPath(id)}/registration/${encodeURIComponent(registrationId)}/cancel`,
    command
  )

export const mergeBjjEireCompetitionTeams = (
  id: string,
  command: MergeTeamsCommand
): Promise<TeamMergeDto> =>
  api.post(`${bjjEireCompetitionPath(id)}/team-merge`, command)

/** Each division's recorded podium and its confirmed competitors, for the results tab. */
export const getBjjEireCompetitionResults = (
  id: string
): Promise<AdminDivisionResultDto[]> =>
  api.get(`${bjjEireCompetitionsAdmin}/${encodeURIComponent(id)}/result`)

const resultPath = (id: string, divisionId: string): string =>
  `${bjjEireCompetitionPath(id)}/division/${encodeURIComponent(divisionId)}/result`

/** Records or replaces a division's podium (FR-031). */
export const recordDivisionResult = (
  id: string,
  divisionId: string,
  command: RecordResultCommand
): Promise<AdminDivisionResultDto> =>
  api.put(resultPath(id, divisionId), command)

export const clearDivisionResult = (
  id: string,
  divisionId: string
): Promise<void> => api.delete(resultPath(id, divisionId))

/** Names the winners on the leaderboard (FR-040). Results can still be corrected. */
export const finishBjjEireCompetition = (
  id: string
): Promise<BjjEireCompetitionDto> =>
  api.post(`${bjjEireCompetitionPath(id)}/finish`)
