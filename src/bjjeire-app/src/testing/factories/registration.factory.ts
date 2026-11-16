import type { PaginatedResponse } from '@/types/common'
import type {
  AdminRegistrationDto,
  CancellationDto,
  DivisionCompetitorsDto,
  ListedCompetitorDto,
  RegistrationCheckoutDto,
  RegistrationDto,
} from '@/types/registrations'
import { createDivision } from './bjjeire-competition.factory'

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
    competitionId: 'bjjeire-competition-id-1',
    competitionSlug: 'test-bjjeire-competition-1',
    competitionName: 'Test Competition 1',
    competitionDate: '2026-06-27',
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

export function createCancellation(
  overrides: Partial<CancellationDto> = {}
): CancellationDto {
  return {
    refunded: true,
    refundAmountCents: 2500,
    refundStatus: 'PENDING',
    ...overrides,
  }
}

export function createAdminRegistration(
  overrides: Partial<AdminRegistrationDto> = {}
): AdminRegistrationDto {
  const id = ++_registrationId
  return {
    registrationId: `registration-id-${id}`,
    displayName: 'Aoife Byrne',
    email: 'aoife@example.test',
    phone: '+353 87 123 4567',
    dateOfBirth: '1990-04-12',
    gender: 'MALE',
    belt: 'WHITE',
    academy: 'Team X',
    affiliation: 'Alliance',
    academyKey: 'name:team x',
    affiliationKey: 'alliance',
    division: createDivision(),
    status: 'CONFIRMED',
    amountCents: 2500,
    paymentStatus: 'PAID',
    refundStatus: null,
    paymentUnconfirmed: false,
    profileMismatch: false,
    createdAt: '2026-06-10T10:00:00Z',
    ...overrides,
  }
}

export function createPaginatedAdminRegistrations(
  rows: AdminRegistrationDto[],
  page = 1,
  totalPages = 1
): PaginatedResponse<AdminRegistrationDto> {
  return {
    data: rows,
    pagination: {
      totalItems: rows.length,
      currentPage: page,
      pageSize: 100,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPageUrl: null,
      previousPageUrl: null,
    },
  }
}
