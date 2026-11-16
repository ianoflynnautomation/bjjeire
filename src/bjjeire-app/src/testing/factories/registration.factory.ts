import type {
  DivisionCompetitorsDto,
  ListedCompetitorDto,
  RegistrationCheckoutDto,
  RegistrationDto,
} from '@/types/registrations'
import { createDivision } from './tournament.factory'

let _registrationId = 0

export function resetRegistrationIdCounter(): void {
  _registrationId = 0
}

export function createRegistration(
  overrides: Partial<RegistrationDto> = {}
): RegistrationDto {
  const id = ++_registrationId
  return {
    id: `registration-id-${id}`,
    tournamentId: 'tournament-id-1',
    tournamentSlug: 'test-tournament-1',
    tournamentName: 'Test Tournament 1',
    tournamentDate: '2026-06-27',
    division: createDivision(),
    status: 'AWAITING_PAYMENT',
    amountCents: 2500,
    currency: 'EUR',
    paymentStatus: 'PENDING',
    refundStatus: null,
    holdExpiresAt: '2026-06-10T10:30:00Z',
    refundableUntil: '2026-06-20T20:00:00Z',
    createdAt: '2026-06-10T10:00:00Z',
    ...overrides,
  }
}

export function createRegistrationCheckout(
  overrides: Partial<RegistrationCheckoutDto> = {}
): RegistrationCheckoutDto {
  return {
    registrationId: `registration-id-${++_registrationId}`,
    checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_1',
    holdExpiresAt: '2026-06-10T10:30:00Z',
    ...overrides,
  }
}

export function createListedCompetitor(
  overrides: Partial<ListedCompetitorDto> = {}
): ListedCompetitorDto {
  return {
    displayName: 'Aoife Byrne',
    academy: 'Team X',
    affiliation: 'Alliance',
    ...overrides,
  }
}

export function createDivisionCompetitors(
  divisionId: string,
  competitors: ListedCompetitorDto[] = []
): DivisionCompetitorsDto {
  return { divisionId, competitors }
}
