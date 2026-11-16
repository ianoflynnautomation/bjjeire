import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { uiContent } from '@/config/ui-content'
import { MySignUpsTestIds } from '@/constants/registrationDataTestIds'
import { createDivision } from '@/testing/factories/tournament.factory'
import {
  createCancellation,
  createRegistration,
  createRegistrationCheckout,
} from '@/testing/factories/registration.factory'
import {
  renderMySignUpsPage,
  seedCancelRegistration,
  seedChangeDivision,
  seedEligibleDivisions,
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

const DAY_MS = 24 * 60 * 60 * 1000
const stillOpen = (): string => new Date(Date.now() + 7 * DAY_MS).toISOString()
const alreadyClosed = (): string =>
  new Date(Date.now() - DAY_MS).toISOString()

describe('MySignUpsPage: cancel and change division', () => {
  // #5022
  it('given a confirmed sign-up and open registration, when the competitor cancels, then they are told the full fee is refunded and the cancellation is sent', async () => {
    const confirmed = createRegistration({
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      amountCents: 2500,
      refundableUntil: stillOpen(),
    })
    seedOwnRegistrations(
      [confirmed],
      [{ ...confirmed, status: 'CANCELLED', refundStatus: 'PENDING' }]
    )
    const cancelCall = seedCancelRegistration(confirmed.id, createCancellation())
    const { user } = renderMySignUpsPage()

    await user.click(await screen.findByTestId(MySignUpsTestIds.ROW_CANCEL))
    const warning = screen.getByTestId(MySignUpsTestIds.CANCEL_WARNING)
    expect(warning).toHaveTextContent(mine.refundWarningPrefix)
    expect(warning).toHaveTextContent('€25.00')
    await user.click(screen.getByTestId(MySignUpsTestIds.CANCEL_CONFIRM))

    expect(await screen.findByTestId(MySignUpsTestIds.NOTICE)).toHaveTextContent(
      `${mine.cancelledRefundPrefix} €25.00`
    )
    expect(cancelCall.calls).toHaveLength(1)
    expect(cancelCall.authorization[0]).toBe('Bearer competitor-token')
    await waitFor(() =>
      expect(screen.getByTestId(MySignUpsTestIds.ROW_STATUS)).toHaveTextContent(
        mine.statuses.CANCELLED
      )
    )
    expect(screen.queryByTestId(MySignUpsTestIds.ROW_CANCEL)).toBeNull()
  })

  // #5023
  it('given a confirmed sign-up and closed registration, when the competitor cancels, then they are warned no refund is due before confirming', async () => {
    const confirmed = createRegistration({
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      refundableUntil: alreadyClosed(),
    })
    seedOwnRegistrations([confirmed])
    const cancelCall = seedCancelRegistration(
      confirmed.id,
      createCancellation({ refunded: false, refundAmountCents: 0, refundStatus: null })
    )
    const { user } = renderMySignUpsPage()

    await user.click(await screen.findByTestId(MySignUpsTestIds.ROW_CANCEL))
    expect(screen.getByTestId(MySignUpsTestIds.CANCEL_WARNING)).toHaveTextContent(
      mine.noRefundWarning
    )
    expect(cancelCall.calls).toHaveLength(0)
    await user.click(screen.getByTestId(MySignUpsTestIds.CANCEL_CONFIRM))

    expect(await screen.findByTestId(MySignUpsTestIds.NOTICE)).toHaveTextContent(
      mine.cancelledNoRefund
    )
  })

  // #5023
  it('given the warning is shown, when the competitor keeps the sign-up, then nothing is sent', async () => {
    const confirmed = createRegistration({
      status: 'CONFIRMED',
      refundableUntil: stillOpen(),
    })
    seedOwnRegistrations([confirmed])
    const cancelCall = seedCancelRegistration(confirmed.id, createCancellation())
    const { user } = renderMySignUpsPage()

    await user.click(await screen.findByTestId(MySignUpsTestIds.ROW_CANCEL))
    await user.click(screen.getByTestId(MySignUpsTestIds.CANCEL_KEEP))

    expect(screen.queryByTestId(MySignUpsTestIds.CANCEL_WARNING)).toBeNull()
    expect(cancelCall.calls).toHaveLength(0)
  })

  // #5024
  it('given a confirmed sign-up and open registration, when the competitor picks another eligible division, then the sign-up is moved at no charge', async () => {
    const current = createDivision({ weightClass: '-76 kg' })
    const heavier = createDivision({ weightClass: '-82 kg' })
    const confirmed = createRegistration({
      status: 'CONFIRMED',
      division: current,
      refundableUntil: stillOpen(),
    })
    seedOwnRegistrations([confirmed], [{ ...confirmed, division: heavier }])
    seedEligibleDivisions(confirmed.tournamentId, [current, heavier])
    const move = seedChangeDivision(confirmed.id, {
      ...confirmed,
      division: heavier,
    })
    const { user } = renderMySignUpsPage()

    await user.click(await screen.findByTestId(MySignUpsTestIds.ROW_CHANGE))
    const select = await screen.findByTestId(MySignUpsTestIds.CHANGE_SELECT)
    expect(within(select).queryByRole('option', { name: /-76 kg/u })).toBeNull()
    await user.selectOptions(select, String(heavier.id))
    await user.click(screen.getByTestId(MySignUpsTestIds.CHANGE_SAVE))

    await waitFor(() => expect(move.calls).toEqual([{ divisionId: heavier.id }]))
    expect(await screen.findByTestId(MySignUpsTestIds.NOTICE)).toHaveTextContent(
      mine.changed
    )
    await waitFor(() =>
      expect(screen.getByTestId(MySignUpsTestIds.ROW_DIVISION)).toHaveTextContent(
        '-82 kg'
      )
    )
  })

  // #5025
  it('given registration has closed, when the competitor views a confirmed sign-up, then there is no change-division control and they are told to contact the organiser', async () => {
    seedOwnRegistrations([
      createRegistration({
        status: 'CONFIRMED',
        refundableUntil: alreadyClosed(),
      }),
    ])
    renderMySignUpsPage()

    expect(
      await screen.findByTestId(MySignUpsTestIds.CLOSED_NOTE)
    ).toHaveTextContent(mine.closedContactOrganiser)
    expect(screen.queryByTestId(MySignUpsTestIds.ROW_CHANGE)).toBeNull()
  })

  // #5025
  it('given registration closes while the page is open, when the competitor tries to change division, then the refusal tells them to contact the organiser', async () => {
    const current = createDivision({ weightClass: '-76 kg' })
    const heavier = createDivision({ weightClass: '-82 kg' })
    const confirmed = createRegistration({
      status: 'CONFIRMED',
      division: current,
      refundableUntil: stillOpen(),
    })
    seedOwnRegistrations([confirmed])
    seedEligibleDivisions(confirmed.tournamentId, [current, heavier])
    seedChangeDivision(confirmed.id, {
      problem: 'urn:bjjeire:registration-closed',
    })
    const { user } = renderMySignUpsPage()

    await user.click(await screen.findByTestId(MySignUpsTestIds.ROW_CHANGE))
    await user.selectOptions(
      await screen.findByTestId(MySignUpsTestIds.CHANGE_SELECT),
      String(heavier.id)
    )
    await user.click(screen.getByTestId(MySignUpsTestIds.CHANGE_SAVE))

    expect(
      await screen.findByTestId(MySignUpsTestIds.ACTION_ERROR)
    ).toHaveTextContent(
      uiContent.registrations.problems['urn:bjjeire:registration-closed']
    )
  })

  it('given the cancellation fails for an unknown reason, when the competitor confirms, then they are told it did not work', async () => {
    const confirmed = createRegistration({
      status: 'CONFIRMED',
      refundableUntil: stillOpen(),
    })
    seedOwnRegistrations([confirmed])
    seedCancelRegistration(confirmed.id, {
      problem: 'urn:bjjeire:internal-error',
      status: 500,
    })
    const { user } = renderMySignUpsPage()

    await user.click(await screen.findByTestId(MySignUpsTestIds.ROW_CANCEL))
    await user.click(screen.getByTestId(MySignUpsTestIds.CANCEL_CONFIRM))

    expect(
      await screen.findByTestId(MySignUpsTestIds.ACTION_ERROR)
    ).toHaveTextContent(mine.actionFailed)
  })

  it('given an unpaid or cancelled sign-up, when the competitor views it, then neither cancel nor change division is offered', async () => {
    seedOwnRegistrations([
      createRegistration({ status: 'AWAITING_PAYMENT' }),
      createRegistration({ status: 'CANCELLED', refundStatus: 'REFUNDED' }),
    ])
    renderMySignUpsPage()

    expect(await screen.findAllByTestId(MySignUpsTestIds.ROW)).toHaveLength(2)
    expect(screen.queryByTestId(MySignUpsTestIds.ROW_CANCEL)).toBeNull()
    expect(screen.queryByTestId(MySignUpsTestIds.ROW_CHANGE)).toBeNull()
  })
})
