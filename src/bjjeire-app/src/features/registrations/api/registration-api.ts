import { api } from '@/lib/api-client'
import { API_RESOURCE_ROUTES } from '@/config/api-routes'
import type { DivisionDto } from '@/types/tournaments'
import type {
  CancellationDto,
  ChangeDivisionCommand,
  CreateRegistrationCommand,
  DivisionCompetitorsDto,
  RegistrationCheckoutDto,
  RegistrationDto,
} from '@/types/registrations'

const tournamentPath = (tournamentId: string): string =>
  `${API_RESOURCE_ROUTES.tournaments}/${encodeURIComponent(tournamentId)}`

/** Competitor token: the divisions the caller may enter. */
export const getEligibleDivisions = (
  tournamentId: string
): Promise<DivisionDto[]> =>
  api.get(`${tournamentPath(tournamentId)}/eligible-division`)

/** Public: confirmed competitors by division. */
export const getTournamentCompetitors = (
  tournamentId: string
): Promise<DivisionCompetitorsDto[]> =>
  api.get(`${tournamentPath(tournamentId)}/competitor`)

export const createRegistration = (
  command: CreateRegistrationCommand
): Promise<RegistrationCheckoutDto> =>
  api.post(API_RESOURCE_ROUTES.registration, command)

export const resumeCheckout = (
  registrationId: string
): Promise<RegistrationCheckoutDto> =>
  api.post(
    `${API_RESOURCE_ROUTES.registration}/${encodeURIComponent(registrationId)}/checkout`
  )

export const getOwnRegistrations = (): Promise<RegistrationDto[]> =>
  api.get(`${API_RESOURCE_ROUTES.registration}/me`)

const registrationPath = (registrationId: string): string =>
  `${API_RESOURCE_ROUTES.registration}/${encodeURIComponent(registrationId)}`

/** Competitor token: cancel your own confirmed sign-up (#5022, #5023). */
export const cancelRegistration = (
  registrationId: string
): Promise<CancellationDto> => api.post(`${registrationPath(registrationId)}/cancel`)

/** Competitor token: move your confirmed sign-up while registration is open (#5024). */
export const changeRegistrationDivision = (
  registrationId: string,
  command: ChangeDivisionCommand
): Promise<RegistrationDto> =>
  api.put(`${registrationPath(registrationId)}/division`, command)
