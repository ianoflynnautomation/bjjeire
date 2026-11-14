import type { GeoCoordinatesDto } from './common'

export type TournamentStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'FINISHED'
export type RegistrationState = 'NOT_OPEN' | 'OPEN' | 'CLOSED' | 'FULL'
export type Discipline = 'GI' | 'NO_GI'
export type Gender = 'MALE' | 'FEMALE'
export type AgeCategory =
  'ADULT' | 'MASTER_1' | 'MASTER_2' | 'MASTER_3' | 'MASTER_4' | 'MASTER_5'
export type Belt = 'WHITE' | 'BLUE' | 'PURPLE' | 'BROWN' | 'BLACK'

export const DISCIPLINES: readonly Discipline[] = ['GI', 'NO_GI']
export const GENDERS: readonly Gender[] = ['MALE', 'FEMALE']
export const AGE_CATEGORIES: readonly AgeCategory[] = [
  'ADULT',
  'MASTER_1',
  'MASTER_2',
  'MASTER_3',
  'MASTER_4',
  'MASTER_5',
]
export const BELTS: readonly Belt[] = [
  'WHITE',
  'BLUE',
  'PURPLE',
  'BROWN',
  'BLACK',
]

export interface TournamentVenueDto {
  address?: string | null
  venue?: string | null
  coordinates?: GeoCoordinatesDto | null
}

export interface DivisionDto {
  /** Absent on a division the organiser is adding; the API assigns it. */
  id?: string
  discipline: Discipline
  gender: Gender
  ageCategory: AgeCategory
  belt: Belt
  weightClass: string
}

interface TournamentBase {
  id: string
  slug: string
  name: string
  /** The competition day as `YYYY-MM-DD`, in Irish time. */
  date: string
  venue?: TournamentVenueDto | null
  entryFeeCents: number
  currency: string
  registrationOpensAt: string
  registrationClosesAt: string
  competitorLimit?: number | null
  placesTaken: number
  status: TournamentStatus
  registrationState: RegistrationState
}

export interface TournamentSummaryDto extends TournamentBase {
  divisionCount: number
}

export interface TournamentDto extends TournamentBase {
  description?: string | null
  divisions: DivisionDto[]
  /** Counts organiser writes; an update sends the one it was edited from. */
  version: number
}

/** Body of create. Update sends the same plus `version`, and replaces the full division list. */
export interface TournamentCommand {
  slug: string
  name: string
  description?: string | null
  date: string
  venue: TournamentVenueDto
  entryFeeCents: number
  registrationOpensAt: string
  registrationClosesAt: string
  competitorLimit?: number | null
  divisions: DivisionDto[]
}

export interface UpdateTournamentCommand extends TournamentCommand {
  /** The version the edit started from. A stale one is refused with 409. */
  version: number
}

export interface GetTournamentsPaginationQuery {
  page: number
  pageSize: number
}
