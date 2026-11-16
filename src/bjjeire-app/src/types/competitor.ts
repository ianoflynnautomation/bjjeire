import type { Belt, Gender } from './bjjeire-competitions'

/** A directory gym (`gymId`) or a name the competitor typed (`gymId` absent). */
export interface AcademyDto {
  gymId?: string | null
  name: string
}

export interface PostalAddressDto {
  street?: string | null
  postcode?: string | null
  city?: string | null
  region?: string | null
  /** ISO 3166-1 alpha-2. */
  country?: string | null
}

/**
 * The signed-in competitor's own profile. Never shown to anyone else. Before
 * the first save `saved` is false and only `email` is set.
 */
export interface CompetitorDto {
  /** From the sign-in; not editable here. */
  email?: string | null
  firstName?: string | null
  middleName?: string | null
  lastName?: string | null
  /** ISO 3166-1 alpha-2. */
  nationality?: string | null
  /** `YYYY-MM-DD`. */
  dateOfBirth?: string | null
  gender?: Gender | null
  belt?: Belt | null
  /** Absent means "no academy". */
  academy?: AcademyDto | null
  affiliation?: string | null
  phone?: string | null
  address?: PostalAddressDto | null
  /** Whether the profile holds everything a sign-up needs. */
  profileComplete: boolean
  /** False until the competitor's first save. */
  saved: boolean
}

export interface AcademyChoice {
  gymId?: string | null
  name?: string | null
}

/** Body of `PUT /competitor/me`. */
export interface SaveCompetitorCommand {
  firstName: string
  middleName?: string | null
  lastName: string
  nationality?: string | null
  dateOfBirth: string
  gender?: Gender | null
  belt?: Belt | null
  academy?: AcademyChoice | null
  affiliation?: string | null
  phone?: string | null
  address?: PostalAddressDto | null
}

export interface CompetitionMedalsDto {
  competitionId: string
  slug: string
  name: string
  date: string
  gold: number
  silver: number
  bronze: number
}

export interface CompetitorHistoryDto {
  gold: number
  silver: number
  bronze: number
  competitions: CompetitionMedalsDto[]
}
