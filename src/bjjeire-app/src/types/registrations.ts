import type { DivisionDto } from './tournaments'

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
