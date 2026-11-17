import type { GeoCoordinatesDto } from './common'

export type BjjEireCompetitionStatus =
  'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'FINISHED'
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

export interface BjjEireCompetitionVenueDto {
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

interface BjjEireCompetitionBase {
  id: string
  slug: string
  name: string
  /** The competition day as `YYYY-MM-DD`, in Irish time. */
  date: string
  venue?: BjjEireCompetitionVenueDto | null
  entryFeeCents: number
  currency: string
  registrationOpensAt: string
  registrationClosesAt: string
  competitorLimit?: number | null
  placesTaken: number
  status: BjjEireCompetitionStatus
  registrationState: RegistrationState
}

export interface BjjEireCompetitionSummaryDto extends BjjEireCompetitionBase {
  divisionCount: number
}

export interface BjjEireCompetitionDto extends BjjEireCompetitionBase {
  description?: string | null
  divisions: DivisionDto[]
  /** Counts organiser writes; an update sends the one it was edited from. */
  version: number
}

/** Body of create. Update sends the same plus `version`, and replaces the full division list. */
export interface BjjEireCompetitionCommand {
  slug: string
  name: string
  description?: string | null
  date: string
  venue: BjjEireCompetitionVenueDto
  entryFeeCents: number
  registrationOpensAt: string
  registrationClosesAt: string
  competitorLimit?: number | null
  divisions: DivisionDto[]
}

export interface UpdateBjjEireCompetitionCommand extends BjjEireCompetitionCommand {
  /** The version the edit started from. A stale one is refused with 409. */
  version: number
}

export interface GetBjjEireCompetitionsPaginationQuery {
  page: number
  pageSize: number
}

// ---- Results and leaderboard (US5) -------------------------------------------

/** A medallist on a public podium: name, academy and affiliation only (FR-011). */
export interface MedallistDto {
  displayName: string
  academy?: string | null
  affiliation?: string | null
}

export interface PodiumDto {
  divisionId: string
  gold: MedallistDto
  silver?: MedallistDto | null
  bronzes: MedallistDto[]
  /** False when the division had fewer than two confirmed competitors (FR-035). */
  pointsAwarded: boolean
}

export interface TeamStandingDto {
  /** Entries level on points, golds, silvers and bronzes share a rank. */
  rank: number
  name: string
  points: number
  gold: number
  silver: number
  bronze: number
}

/** Present only once the competition is finished; more than one name means joint winners. */
export interface WinnersDto {
  academies: string[]
  affiliations: string[]
}

export interface LeaderboardDto {
  podiums: PodiumDto[]
  academyRanking: TeamStandingDto[]
  affiliationRanking: TeamStandingDto[]
  winners?: WinnersDto | null
}

/** A recorded podium by sign-up id. Admin only. */
export interface DivisionResultDto {
  goldRegistrationId: string
  silverRegistrationId?: string | null
  bronzeRegistrationIds: string[]
  recordedAt?: string | null
}

/** A confirmed competitor the organiser may choose as a medallist. */
export interface ResultCompetitorDto {
  registrationId: string
  displayName: string
  academy?: string | null
  affiliation?: string | null
}

export interface AdminDivisionResultDto {
  divisionId: string
  result?: DivisionResultDto | null
  competitors: ResultCompetitorDto[]
}

export interface RecordResultCommand {
  goldRegistrationId: string
  silverRegistrationId?: string | null
  bronzeRegistrationIds: string[]
}
