import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { uiContent } from '@/config/ui-content'
import {
  TournamentAdminCancelTestIds,
  TournamentAdminMergeTestIds,
  TournamentAdminSignUpsTestIds,
  TournamentAdminTestIds,
} from '@/constants/tournamentDataTestIds'
import {
  createDivision,
  createTournament,
} from '@/testing/factories/tournament.factory'
import {
  createAdminRegistration,
  createCancellation,
} from '@/testing/factories/registration.factory'
import {
  renderAdminTournamentPage,
  seedAdminCancel,
  seedAdminMove,
  seedAdminRegistrations,
  seedAdminTournament,
  seedCancelTournament,
  seedMerge,
} from '@/features/tournament-admin/testing/tournament-admin-test-helpers'
import type { TournamentDto } from '@/types/tournaments'

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

const { signUps, cancelTournament, merge } = uiContent.tournamentAdmin
const ID = 'tournament-with-sign-ups'
const light = createDivision({ id: 'division-light', weightClass: '-76 kg' })
const heavy = createDivision({ id: 'division-heavy', weightClass: '-82 kg' })

function published(overrides: Partial<TournamentDto> = {}): TournamentDto {
  return createTournament({
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

describe('AdminTournamentPage: sign-ups (FR-006, FR-007)', () => {
  it('given sign-ups, when the organiser opens the tournament, then each shows the private contact details, division, status and any flag', async () => {
    seedAdminTournament(published())
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
    renderAdminTournamentPage(ID)

    const rows = await screen.findAllByTestId(TournamentAdminSignUpsTestIds.ROW)
    expect(rows).toHaveLength(2)
    expect(
      within(rows[0]).getByTestId(TournamentAdminSignUpsTestIds.ROW_CONTACT)
    ).toHaveTextContent('aoife@example.test')
    expect(
      within(rows[0]).getByTestId(TournamentAdminSignUpsTestIds.ROW_NAME)
    ).toHaveTextContent(
      `${uiContent.registrations.genders.MALE} · ${uiContent.registrations.belts.WHITE}`
    )
    expect(
      within(rows[0]).getByTestId(TournamentAdminSignUpsTestIds.ROW_STATUS)
    ).toHaveTextContent(signUps.payments.PAID)
    expect(
      within(rows[0]).getByTestId(TournamentAdminSignUpsTestIds.ROW_DIVISION)
    ).toHaveTextContent('-76 kg')
    expect(
      within(rows[0]).getByTestId(TournamentAdminSignUpsTestIds.ROW_MISMATCH)
    ).toHaveTextContent(signUps.profileMismatch)
    expect(
      within(rows[1]).getByTestId(TournamentAdminSignUpsTestIds.ROW_UNCONFIRMED)
    ).toHaveTextContent(signUps.paymentUnconfirmed)
    expect(
      within(rows[1]).queryByTestId(TournamentAdminSignUpsTestIds.ROW_CANCEL)
    ).toBeNull()
    expect(list.authorization[0]).toBe('Bearer organiser-token')
  })

  it('given no sign-ups, when the organiser opens the tournament, then the list says so', async () => {
    seedAdminTournament(published())
    seedAdminRegistrations(ID, [])
    renderAdminTournamentPage(ID)

    expect(
      await screen.findByTestId(TournamentAdminSignUpsTestIds.EMPTY)
    ).toHaveTextContent(signUps.empty)
  })

  it('given sign-ups, when the organiser exports them, then the CSV is fetched with their token and downloaded', async () => {
    seedAdminTournament(published())
    const list = seedAdminRegistrations(ID, [createAdminRegistration()])
    const createObjectURL = vi.fn(() => 'blob:sign-ups')
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }))
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)
    const { user } = renderAdminTournamentPage(ID)

    await user.click(
      await screen.findByTestId(TournamentAdminSignUpsTestIds.EXPORT)
    )

    await waitFor(() => expect(click).toHaveBeenCalledTimes(1))
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(list.authorization.at(-1)).toBe('Bearer organiser-token')
    click.mockRestore()
  })

  it('given a confirmed sign-up, when the organiser moves it to another division, then the move is sent and the list reloads', async () => {
    seedAdminTournament(published())
    const row = createAdminRegistration({ division: light })
    seedAdminRegistrations(ID, [row], [{ ...row, division: heavy }])
    const move = seedAdminMove(ID, row.registrationId, {
      ...row,
      division: heavy,
    })
    const { user } = renderAdminTournamentPage(ID)

    await user.click(
      await screen.findByTestId(TournamentAdminSignUpsTestIds.ROW_MOVE)
    )
    await user.selectOptions(
      screen.getByTestId(TournamentAdminSignUpsTestIds.MOVE_SELECT),
      String(heavy.id)
    )
    await user.click(
      screen.getByTestId(TournamentAdminSignUpsTestIds.MOVE_CONFIRM)
    )

    await waitFor(() => expect(move.calls).toEqual([{ divisionId: heavy.id }]))
    expect(
      await screen.findByTestId(TournamentAdminSignUpsTestIds.NOTICE)
    ).toHaveTextContent(signUps.moved)
    await waitFor(() =>
      expect(
        screen.getByTestId(TournamentAdminSignUpsTestIds.ROW_DIVISION)
      ).toHaveTextContent('-82 kg')
    )
  })

  it('given a confirmed sign-up, when the organiser cancels it without a refund, then refund false is sent', async () => {
    seedAdminTournament(published())
    const row = createAdminRegistration()
    seedAdminRegistrations(ID, [row], [{ ...row, status: 'CANCELLED' }])
    const cancel = seedAdminCancel(
      ID,
      row.registrationId,
      createCancellation({ refunded: false, refundAmountCents: 0, refundStatus: null })
    )
    const { user } = renderAdminTournamentPage(ID)

    await user.click(
      await screen.findByTestId(TournamentAdminSignUpsTestIds.ROW_CANCEL)
    )
    const refund = screen.getByTestId(TournamentAdminSignUpsTestIds.CANCEL_REFUND)
    expect(refund).toBeChecked()
    await user.click(refund)
    await user.click(
      screen.getByTestId(TournamentAdminSignUpsTestIds.CANCEL_CONFIRM)
    )

    await waitFor(() => expect(cancel.calls).toEqual([{ refund: false }]))
    expect(
      await screen.findByTestId(TournamentAdminSignUpsTestIds.NOTICE)
    ).toHaveTextContent(signUps.cancelledNoRefund)
  })

  it('given academies typed differently, when the organiser merges them, then their keys and the chosen name are sent', async () => {
    seedAdminTournament(published())
    seedAdminRegistrations(ID, [
      createAdminRegistration({ academy: 'Team X', academyKey: 'name:team x' }),
      createAdminRegistration({
        academy: 'team x BJJ',
        academyKey: 'name:team x bjj',
      }),
    ])
    const merged = seedMerge(ID, { updated: 2 })
    const { user } = renderAdminTournamentPage(ID)

    const root = await screen.findByTestId(TournamentAdminMergeTestIds.ROOT)
    await waitFor(() =>
      expect(
        within(root).getAllByTestId(TournamentAdminMergeTestIds.NAME_OPTION)
      ).toHaveLength(2)
    )
    await user.click(within(root).getByRole('checkbox', { name: 'Team X' }))
    await user.click(within(root).getByRole('checkbox', { name: 'team x BJJ' }))
    await user.type(
      within(root).getByLabelText(merge.targetLabel),
      'Team X'
    )
    await user.click(within(root).getByTestId(TournamentAdminMergeTestIds.SUBMIT))

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
      await screen.findByTestId(TournamentAdminMergeTestIds.NOTICE)
    ).toHaveTextContent(`${merge.mergedPrefix} 2 ${merge.mergedSuffix}`)
  })
})

describe('AdminTournamentPage: cancel the tournament (#5026)', () => {
  it('given a published tournament, when the organiser confirms the cancellation, then it is sent and the tournament shows as cancelled', async () => {
    seedAdminTournament(published())
    seedAdminRegistrations(ID, [])
    const cancelled = seedCancelTournament(
      ID,
      published({ status: 'CANCELLED', registrationState: 'CLOSED' })
    )
    const { user } = renderAdminTournamentPage(ID)

    await user.click(
      await screen.findByTestId(TournamentAdminCancelTestIds.BUTTON)
    )
    expect(
      screen.getByTestId(TournamentAdminCancelTestIds.WARNING)
    ).toHaveTextContent(cancelTournament.warning)
    expect(cancelled.calls).toHaveLength(0)
    await user.click(screen.getByTestId(TournamentAdminCancelTestIds.CONFIRM))

    await waitFor(() => expect(cancelled.calls).toHaveLength(1))
    expect(cancelled.authorization[0]).toBe('Bearer organiser-token')
    expect(
      await screen.findByTestId(TournamentAdminCancelTestIds.NOTICE)
    ).toHaveTextContent(cancelTournament.cancelled)
    expect(screen.getByTestId(TournamentAdminTestIds.STATUS)).toHaveTextContent(
      uiContent.tournaments.statuses.CANCELLED
    )
  })

  it('given a cancelled tournament with a failed refund, when the organiser retries, then the cancellation is sent again', async () => {
    seedAdminTournament(published({ status: 'CANCELLED' }))
    seedAdminRegistrations(ID, [
      createAdminRegistration({ status: 'CANCELLED', refundStatus: 'FAILED' }),
    ])
    const cancelled = seedCancelTournament(ID, published({ status: 'CANCELLED' }))
    const { user } = renderAdminTournamentPage(ID)

    await user.click(
      await screen.findByTestId(TournamentAdminCancelTestIds.RETRY)
    )

    await waitFor(() => expect(cancelled.calls).toHaveLength(1))
    expect(screen.queryByTestId(TournamentAdminCancelTestIds.BUTTON)).toBeNull()
  })

  it('given a draft, when the organiser opens it, then there is no sign-up list and cancelling is still offered', async () => {
    seedAdminTournament(published({ status: 'DRAFT' }))
    renderAdminTournamentPage(ID)

    expect(
      await screen.findByTestId(TournamentAdminCancelTestIds.BUTTON)
    ).toBeInTheDocument()
    expect(screen.queryByTestId(TournamentAdminSignUpsTestIds.ROOT)).toBeNull()
  })
})
