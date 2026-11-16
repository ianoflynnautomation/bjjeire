import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { uiContent } from '@/config/ui-content'
import {
  BjjEireCompetitionAdminCancelTestIds,
  BjjEireCompetitionAdminMergeTestIds,
  BjjEireCompetitionAdminSignUpsTestIds,
  BjjEireCompetitionAdminTestIds,
} from '@/constants/bjjEireCompetitionDataTestIds'
import {
  createDivision,
  createBjjEireCompetition,
} from '@/testing/factories/bjjeire-competition.factory'
import {
  createAdminRegistration,
  createCancellation,
} from '@/testing/factories/registration.factory'
import {
  renderAdminBjjEireCompetitionPage,
  seedAdminCancel,
  seedAdminMove,
  seedAdminRegistrations,
  seedAdminBjjEireCompetition,
  seedCancelBjjEireCompetition,
  seedMerge,
} from '@/features/bjjeire-competition-admin/testing/bjjeire-competition-admin-test-helpers'
import type { BjjEireCompetitionDto } from '@/types/bjjeire-competitions'

const { mockMsal } = vi.hoisted(() => ({
  mockMsal: {
    initialize: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    getAllAccounts: vi.fn<() => object[]>(() => []),
    acquireTokenSilent: vi.fn(() =>
      Promise.resolve({ accessToken: 'organiser-token' })
    ),
    loginPopup: vi.fn<() => Promise<object>>(),
  },
}))

vi.mock('@/lib/msal-config', () => ({
  msalInstance: mockMsal,
  loginRequest: { scopes: ['access_as_writer'] },
}))

const { signUps, cancelBjjEireCompetition, merge } =
  uiContent.bjjEireCompetitionAdmin
const ID = 'bjjeire-competition-with-sign-ups'
const light = createDivision({ id: 'division-light', weightClass: '-76 kg' })
const heavy = createDivision({ id: 'division-heavy', weightClass: '-82 kg' })

function published(
  overrides: Partial<BjjEireCompetitionDto> = {}
): BjjEireCompetitionDto {
  return createBjjEireCompetition({
    id: ID,
    slug: 'bjjeire',
    name: 'BjjEire',
    status: 'PUBLISHED',
    registrationState: 'OPEN',
    divisions: [light, heavy],
    ...overrides,
  })
}

beforeEach(() => {
  mockMsal.getAllAccounts.mockReturnValue([{ username: 'owner@bjjeire.test' }])
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('AdminCompetitionPage: sign-ups (FR-006, FR-007)', () => {
  it('given sign-ups, when the organiser opens the competition, then each shows the private contact details, division, status and any flag', async () => {
    seedAdminBjjEireCompetition(published())
    const list = seedAdminRegistrations(ID, [
      createAdminRegistration({
        displayName: 'Aoife Byrne',
        email: 'aoife@example.test',
        division: light,
        profileMismatch: true,
      }),
      createAdminRegistration({
        displayName: 'Ciaran Byrne',
        status: 'AWAITING_PAYMENT',
        paymentStatus: 'PENDING',
        paymentUnconfirmed: true,
      }),
    ])
    renderAdminBjjEireCompetitionPage(ID)

    const rows = await screen.findAllByTestId(
      BjjEireCompetitionAdminSignUpsTestIds.ROW
    )
    expect(rows).toHaveLength(2)
    expect(
      within(rows[0]).getByTestId(
        BjjEireCompetitionAdminSignUpsTestIds.ROW_CONTACT
      )
    ).toHaveTextContent('aoife@example.test')
    expect(
      within(rows[0]).getByTestId(
        BjjEireCompetitionAdminSignUpsTestIds.ROW_NAME
      )
    ).toHaveTextContent(
      `${uiContent.registrations.genders.MALE} · ${uiContent.registrations.belts.WHITE}`
    )
    expect(
      within(rows[0]).getByTestId(
        BjjEireCompetitionAdminSignUpsTestIds.ROW_STATUS
      )
    ).toHaveTextContent(signUps.payments.PAID)
    expect(
      within(rows[0]).getByTestId(
        BjjEireCompetitionAdminSignUpsTestIds.ROW_DIVISION
      )
    ).toHaveTextContent('-76 kg')
    expect(
      within(rows[0]).getByTestId(
        BjjEireCompetitionAdminSignUpsTestIds.ROW_MISMATCH
      )
    ).toHaveTextContent(signUps.profileMismatch)
    expect(
      within(rows[1]).getByTestId(
        BjjEireCompetitionAdminSignUpsTestIds.ROW_UNCONFIRMED
      )
    ).toHaveTextContent(signUps.paymentUnconfirmed)
    expect(
      within(rows[1]).queryByTestId(
        BjjEireCompetitionAdminSignUpsTestIds.ROW_CANCEL
      )
    ).toBeNull()
    expect(list.authorization[0]).toBe('Bearer organiser-token')
  })

  it('given no sign-ups, when the organiser opens the competition, then the list says so', async () => {
    seedAdminBjjEireCompetition(published())
    seedAdminRegistrations(ID, [])
    renderAdminBjjEireCompetitionPage(ID)

    expect(
      await screen.findByTestId(BjjEireCompetitionAdminSignUpsTestIds.EMPTY)
    ).toHaveTextContent(signUps.empty)
  })

  it('given sign-ups, when the organiser exports them, then the CSV is fetched with their token and downloaded', async () => {
    seedAdminBjjEireCompetition(published())
    const list = seedAdminRegistrations(ID, [createAdminRegistration()])
    const createObjectURL = vi.fn(() => 'blob:sign-ups')
    vi.stubGlobal(
      'URL',
      Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() })
    )
    const fileNames: string[] = []
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function record(this: HTMLAnchorElement) {
        fileNames.push(this.download)
      })
    const { user } = renderAdminBjjEireCompetitionPage(ID)

    await user.click(
      await screen.findByTestId(BjjEireCompetitionAdminSignUpsTestIds.EXPORT)
    )

    await waitFor(() => expect(click).toHaveBeenCalledTimes(1))
    // #3011, #3013: the file name matches the API's Content-Disposition.
    expect(fileNames).toEqual([`competition-${ID}-signups.csv`])
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(list.authorization.at(-1)).toBe('Bearer organiser-token')
    click.mockRestore()
  })

  it('given a confirmed sign-up, when the organiser moves it to another division, then the move is sent and the list reloads', async () => {
    seedAdminBjjEireCompetition(published())
    const row = createAdminRegistration({ division: light })
    seedAdminRegistrations(ID, [row], [{ ...row, division: heavy }])
    const move = seedAdminMove(ID, row.registrationId, {
      ...row,
      division: heavy,
    })
    const { user } = renderAdminBjjEireCompetitionPage(ID)

    await user.click(
      await screen.findByTestId(BjjEireCompetitionAdminSignUpsTestIds.ROW_MOVE)
    )
    await user.selectOptions(
      screen.getByTestId(BjjEireCompetitionAdminSignUpsTestIds.MOVE_SELECT),
      String(heavy.id)
    )
    await user.click(
      screen.getByTestId(BjjEireCompetitionAdminSignUpsTestIds.MOVE_CONFIRM)
    )

    await waitFor(() => expect(move.calls).toEqual([{ divisionId: heavy.id }]))
    expect(
      await screen.findByTestId(BjjEireCompetitionAdminSignUpsTestIds.NOTICE)
    ).toHaveTextContent(signUps.moved)
    await waitFor(() =>
      expect(
        screen.getByTestId(BjjEireCompetitionAdminSignUpsTestIds.ROW_DIVISION)
      ).toHaveTextContent('-82 kg')
    )
  })

  it('given a confirmed sign-up, when the organiser cancels it without a refund, then refund false is sent', async () => {
    seedAdminBjjEireCompetition(published())
    const row = createAdminRegistration()
    seedAdminRegistrations(ID, [row], [{ ...row, status: 'CANCELLED' }])
    const cancel = seedAdminCancel(
      ID,
      row.registrationId,
      createCancellation({
        refunded: false,
        refundAmountCents: 0,
        refundStatus: null,
      })
    )
    const { user } = renderAdminBjjEireCompetitionPage(ID)

    await user.click(
      await screen.findByTestId(
        BjjEireCompetitionAdminSignUpsTestIds.ROW_CANCEL
      )
    )
    const refund = screen.getByTestId(
      BjjEireCompetitionAdminSignUpsTestIds.CANCEL_REFUND
    )
    expect(refund).toBeChecked()
    await user.click(refund)
    await user.click(
      screen.getByTestId(BjjEireCompetitionAdminSignUpsTestIds.CANCEL_CONFIRM)
    )

    await waitFor(() => expect(cancel.calls).toEqual([{ refund: false }]))
    expect(
      await screen.findByTestId(BjjEireCompetitionAdminSignUpsTestIds.NOTICE)
    ).toHaveTextContent(signUps.cancelledNoRefund)
  })

  it('given academies typed differently, when the organiser merges them, then their keys and the chosen name are sent', async () => {
    seedAdminBjjEireCompetition(published())
    seedAdminRegistrations(ID, [
      createAdminRegistration({ academy: 'Team X', academyKey: 'name:team x' }),
      createAdminRegistration({
        academy: 'team x BJJ',
        academyKey: 'name:team x bjj',
      }),
    ])
    const merged = seedMerge(ID, { updated: 2 })
    const { user } = renderAdminBjjEireCompetitionPage(ID)

    const root = await screen.findByTestId(
      BjjEireCompetitionAdminMergeTestIds.ROOT
    )
    await waitFor(() =>
      expect(
        within(root).getAllByTestId(
          BjjEireCompetitionAdminMergeTestIds.NAME_OPTION
        )
      ).toHaveLength(2)
    )
    await user.click(within(root).getByRole('checkbox', { name: 'Team X' }))
    await user.click(within(root).getByRole('checkbox', { name: 'team x BJJ' }))
    await user.type(within(root).getByLabelText(merge.targetLabel), 'Team X')
    await user.click(
      within(root).getByTestId(BjjEireCompetitionAdminMergeTestIds.SUBMIT)
    )

    await waitFor(() =>
      expect(merged.calls).toEqual([
        {
          kind: 'ACADEMY',
          fromKeys: ['name:team x', 'name:team x bjj'],
          target: 'Team X',
        },
      ])
    )
    expect(
      await screen.findByTestId(BjjEireCompetitionAdminMergeTestIds.NOTICE)
    ).toHaveTextContent(`${merge.mergedPrefix} 2 ${merge.mergedSuffix}`)
  })
})

describe('AdminCompetitionPage: cancel the competition (#5026)', () => {
  it('given a published competition, when the organiser confirms the cancellation, then it is sent and the competition shows as cancelled', async () => {
    seedAdminBjjEireCompetition(published())
    seedAdminRegistrations(ID, [])
    const cancelled = seedCancelBjjEireCompetition(
      ID,
      published({ status: 'CANCELLED', registrationState: 'CLOSED' })
    )
    const { user } = renderAdminBjjEireCompetitionPage(ID)

    await user.click(
      await screen.findByTestId(BjjEireCompetitionAdminCancelTestIds.BUTTON)
    )
    expect(
      screen.getByTestId(BjjEireCompetitionAdminCancelTestIds.WARNING)
    ).toHaveTextContent(cancelBjjEireCompetition.warning)
    expect(cancelled.calls).toHaveLength(0)
    await user.click(
      screen.getByTestId(BjjEireCompetitionAdminCancelTestIds.CONFIRM)
    )

    await waitFor(() => expect(cancelled.calls).toHaveLength(1))
    expect(cancelled.authorization[0]).toBe('Bearer organiser-token')
    expect(
      await screen.findByTestId(BjjEireCompetitionAdminCancelTestIds.NOTICE)
    ).toHaveTextContent(cancelBjjEireCompetition.cancelled)
    expect(
      screen.getByTestId(BjjEireCompetitionAdminTestIds.STATUS)
    ).toHaveTextContent(uiContent.bjjEireCompetitions.statuses.CANCELLED)
  })

  it('given a cancelled competition with a failed refund, when the organiser retries, then the cancellation is sent again', async () => {
    seedAdminBjjEireCompetition(published({ status: 'CANCELLED' }))
    seedAdminRegistrations(ID, [
      createAdminRegistration({ status: 'CANCELLED', refundStatus: 'FAILED' }),
    ])
    const cancelled = seedCancelBjjEireCompetition(
      ID,
      published({ status: 'CANCELLED' })
    )
    const { user } = renderAdminBjjEireCompetitionPage(ID)

    await user.click(
      await screen.findByTestId(BjjEireCompetitionAdminCancelTestIds.RETRY)
    )

    await waitFor(() => expect(cancelled.calls).toHaveLength(1))
    expect(
      screen.queryByTestId(BjjEireCompetitionAdminCancelTestIds.BUTTON)
    ).toBeNull()
  })

  it('given a draft, when the organiser opens it, then there is no sign-up list and cancelling is still offered', async () => {
    seedAdminBjjEireCompetition(published({ status: 'DRAFT' }))
    renderAdminBjjEireCompetitionPage(ID)

    expect(
      await screen.findByTestId(BjjEireCompetitionAdminCancelTestIds.BUTTON)
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId(BjjEireCompetitionAdminSignUpsTestIds.ROOT)
    ).toBeNull()
  })
})
