import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { uiContent } from '@/config/ui-content'
import { paths } from '@/config/paths'
import { SignUpCompleteTestIds } from '@/constants/registrationDataTestIds'
import { createRegistration } from '@/testing/factories/registration.factory'
import {
  renderSignUpCompletePage,
  seedOwnRegistrations,
} from '@/features/registrations/testing/registration-test-helpers'

const { competitorMsal } = vi.hoisted(() => ({
  competitorMsal: {
    initialize: vi.fn(() => Promise.resolve()),
    getAllAccounts: vi.fn<() => object[]>(() => [{ username: 'aoife' }]),
    acquireTokenSilent: vi.fn(() =>
      Promise.resolve({ accessToken: 'competitor-token' })
    ),
    loginPopup: vi.fn(() => Promise.resolve({})),
    logoutPopup: vi.fn(() => Promise.resolve()),
    clearCache: vi.fn(() => Promise.resolve()),
  },
}))

vi.mock('@/lib/competitor-msal-config', () => ({
  competitorMsalInstance: competitorMsal,
  competitorLoginRequest: { scopes: ['access_as_competitor'] },
}))

const { complete } = uiContent.registrations

beforeEach(() => {
  competitorMsal.getAllAccounts.mockReturnValue([{ username: 'aoife' }])
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('SignUpCompletePage', () => {
  // #5015: confirmation comes from the webhook; the page waits for it.
  it('given the payment is confirmed, when the competitor returns from Checkout, then they see that they are signed up', async () => {
    const mine = seedOwnRegistrations([
      createRegistration({ id: 'registration-1', status: 'CONFIRMED' }),
    ])
    renderSignUpCompletePage('bjjeire', 'registration-1')

    expect(
      await screen.findByTestId(SignUpCompleteTestIds.CONFIRMED)
    ).toHaveTextContent(complete.confirmedMessage)
    expect(mine.authorization[0]).toBe('Bearer competitor-token')
  })

  // #5015
  it('given the webhook has not arrived yet, when the competitor returns, then the page waits and shows the confirmation once it does', async () => {
    seedOwnRegistrations(
      [createRegistration({ id: 'registration-1', status: 'AWAITING_PAYMENT' })],
      [createRegistration({ id: 'registration-1', status: 'CONFIRMED' })]
    )
    renderSignUpCompletePage('bjjeire', 'registration-1')

    expect(
      await screen.findByTestId(SignUpCompleteTestIds.PENDING)
    ).toHaveTextContent(complete.pendingMessage)
    expect(
      await screen.findByTestId(
        SignUpCompleteTestIds.CONFIRMED,
        {},
        { timeout: 5000 }
      )
    ).toBeInTheDocument()
  })

  // #5016
  it('given the payment failed and the hold ended, when the competitor returns, then nothing is confirmed and they can try again', async () => {
    seedOwnRegistrations([
      createRegistration({ id: 'registration-1', status: 'EXPIRED' }),
    ])
    renderSignUpCompletePage('bjjeire', 'registration-1')

    expect(
      await screen.findByTestId(SignUpCompleteTestIds.FAILED)
    ).toHaveTextContent(complete.failedMessage)
    expect(screen.getByTestId(SignUpCompleteTestIds.TRY_AGAIN)).toHaveAttribute(
      'href',
      paths.tournamentSignUp.getHref('bjjeire')
    )
  })

  it('given a sign-up that is not on the account, when the page opens, then it says so', async () => {
    seedOwnRegistrations([])
    renderSignUpCompletePage('bjjeire', 'registration-404')

    expect(
      await screen.findByTestId(SignUpCompleteTestIds.UNKNOWN)
    ).toHaveTextContent(complete.unknown)
  })

  // #5020: a payment that found no place left was taken and returned in full.
  it('given the payment arrived after the place was gone and was refunded, when the competitor returns, then they are told it was refunded in full', async () => {
    seedOwnRegistrations([
      createRegistration({
        id: 'registration-1',
        status: 'CANCELLED',
        paymentStatus: 'PAID',
        refundStatus: 'REFUNDED',
      }),
    ])
    renderSignUpCompletePage('bjjeire', 'registration-1')

    const refunded = await screen.findByTestId(SignUpCompleteTestIds.REFUNDED)
    expect(refunded).toHaveTextContent(complete.refundedMessage)
    expect(refunded).not.toHaveTextContent(complete.failedMessage)
  })
})
