import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { uiContent } from '@/config/ui-content'
import { MySignUpsTestIds } from '@/constants/registrationDataTestIds'
import { createDivision } from '@/testing/factories/tournament.factory'
import {
  createRegistration,
  createRegistrationCheckout,
} from '@/testing/factories/registration.factory'
import {
  renderMySignUpsPage,
  seedOwnRegistrations,
  seedResumeCheckout,
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

const { mine } = uiContent.registrations
const assign = vi.fn<(url: string) => void>()

beforeEach(() => {
  competitorMsal.getAllAccounts.mockReturnValue([{ username: 'aoife' }])
  vi.stubGlobal('location', { href: window.location.href, assign })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('MySignUpsPage', () => {
  // #5021
  it('given a competitor with sign-ups, when they open my sign-ups, then each shows its tournament, division, amount paid and status', async () => {
    seedOwnRegistrations([
      createRegistration({
        tournamentName: 'BjjEire',
        division: createDivision({ discipline: 'NO_GI', weightClass: '-82 kg' }),
        amountCents: 2500,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
      }),
      createRegistration({
        tournamentName: 'BjjEire',
        status: 'EXPIRED',
        paymentStatus: 'FAILED',
      }),
    ])
    renderMySignUpsPage()

    const rows = await screen.findAllByTestId(MySignUpsTestIds.ROW)
    expect(rows).toHaveLength(2)
    expect(
      within(rows[0]).getByTestId(MySignUpsTestIds.ROW_TOURNAMENT)
    ).toHaveTextContent('BjjEire')
    expect(
      within(rows[0]).getByTestId(MySignUpsTestIds.ROW_DIVISION)
    ).toHaveTextContent('No-Gi')
    expect(
      within(rows[0]).getByTestId(MySignUpsTestIds.ROW_DIVISION)
    ).toHaveTextContent('-82 kg')
    expect(
      within(rows[0]).getByTestId(MySignUpsTestIds.ROW_AMOUNT)
    ).toHaveTextContent('€25.00')
    expect(
      within(rows[0]).getByTestId(MySignUpsTestIds.ROW_STATUS)
    ).toHaveTextContent(mine.statuses.CONFIRMED)
    expect(
      within(rows[1]).getByTestId(MySignUpsTestIds.ROW_STATUS)
    ).toHaveTextContent(mine.statuses.EXPIRED)
  })

  // #5021
  it('given a competitor with no sign-ups, when they open the page, then it says so', async () => {
    seedOwnRegistrations([])
    renderMySignUpsPage()

    expect(
      await screen.findByTestId(MySignUpsTestIds.EMPTY)
    ).toHaveTextContent(mine.empty)
  })

  // #5016
  it('given an unpaid sign-up, when the competitor chooses to pay, then they return to its Checkout page', async () => {
    seedOwnRegistrations([
      createRegistration({ id: 'registration-7', status: 'AWAITING_PAYMENT' }),
    ])
    seedResumeCheckout(
      'registration-7',
      createRegistrationCheckout({
        checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_7',
      })
    )
    const { user } = renderMySignUpsPage()

    await user.click(await screen.findByTestId(MySignUpsTestIds.ROW_RESUME))

    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith(
        'https://checkout.stripe.com/c/pay/cs_test_7'
      )
    )
  })

  // #5016: paid at Stripe, webhook not in yet. The competitor is told so, not sent to a finished Checkout.
  it('given an unpaid sign-up that Stripe already took payment for, when the competitor chooses to pay, then they are told the payment was received and stay on the page', async () => {
    seedOwnRegistrations([
      createRegistration({ id: 'registration-8', status: 'AWAITING_PAYMENT' }),
    ])
    seedResumeCheckout('registration-8', {
      problem: 'urn:bjjeire:payment-received',
    })
    const { user } = renderMySignUpsPage()

    await user.click(await screen.findByTestId(MySignUpsTestIds.ROW_RESUME))

    expect(
      await screen.findByText(
        uiContent.registrations.problems['urn:bjjeire:payment-received']
      )
    ).toBeInTheDocument()
    expect(assign).not.toHaveBeenCalled()
  })
})
