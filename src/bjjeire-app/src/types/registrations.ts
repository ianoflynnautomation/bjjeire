import type { Belt, DivisionDto, Gender } from './tournaments'

export type RegistrationStatus =
  'AWAITING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED'
export type RefundStatus = 'PENDING' | 'REFUNDED' | 'FAILED'

/** Body of `POST /registration`. The amount is never sent: the API charges the tournament's fee. */
export interface CreateRegistrationCommand {
  tournamentId: string
  divisionId: string
  acceptPublicListing: boolean
  acceptTerms: boolean
}

/** Where to pay for a sign-up whose place is held. */
export interface RegistrationCheckoutDto {
  registrationId: string
  checkoutUrl: string
  holdExpiresAt: string
}

/** One of the signed-in competitor's own sign-ups. */
export interface RegistrationDto {
  id: string
  tournamentId: string
  tournamentSlug?: string | null
  tournamentName?: string | null
  /** `YYYY-MM-DD`, Irish time. */
  tournamentDate?: string | null
  /** Absent when the division was removed from the tournament. */
  division?: DivisionDto | null
  status: RegistrationStatus
  amountCents: number
  currency?: string | null
  paymentStatus?: PaymentStatus | null
  refundStatus?: RefundStatus | null
  holdExpiresAt?: string | null
  refundableUntil?: string | null
  createdAt?: string | null
}

/** A competitor on a public list: name, academy and affiliation only. */
export interface ListedCompetitorDto {
  displayName: string
  academy?: string | null
  affiliation?: string | null
}

export interface DivisionCompetitorsDto {
  divisionId: string
  competitors: ListedCompetitorDto[]
}

/** What a cancellation did about the money (#5022, #5023). */
export interface CancellationDto {
  refunded: boolean
  refundAmountCents: number
  /** Absent when no refund; `FAILED` is shown as "refund pending". */
  refundStatus?: RefundStatus | null
}

/** Body of both division-change routes. */
export interface ChangeDivisionCommand {
  divisionId: string
}

/** Body of the organiser's cancel route. */
export interface AdminCancelCommand {
  refund: boolean
}

export type TeamKind = 'ACADEMY' | 'AFFILIATION'

/** Body of `POST /tournament/{id}/team-merge`. */
export interface MergeTeamsCommand {
  kind: TeamKind
  fromKeys: string[]
  target: string
  targetGymId?: string | null
}

export interface TeamMergeDto {
  updated: number
}

/** One row of the organiser's sign-up list (FR-006). Never shown to the public. */
export interface AdminRegistrationDto {
  registrationId: string
  displayName?: string | null
  email?: string | null
  phone?: string | null
  dateOfBirth?: string | null
  gender?: Gender | null
  belt?: Belt | null
  academy?: string | null
  affiliation?: string | null
  academyKey?: string | null
  affiliationKey?: string | null
  division?: DivisionDto | null
  status: RegistrationStatus
  amountCents: number
  paymentStatus?: PaymentStatus | null
  refundStatus?: RefundStatus | null
  /** Stripe took the payment but no webhook confirmed it: resolve by hand. */
  paymentUnconfirmed?: boolean
  profileMismatch?: boolean
  createdAt?: string | null
}
