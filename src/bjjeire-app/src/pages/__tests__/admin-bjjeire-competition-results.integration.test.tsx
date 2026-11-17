import { screen, waitFor, within } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { uiContent } from '@/config/ui-content'
import {
  BjjEireCompetitionAdminFinishTestIds,
  BjjEireCompetitionAdminResultsTestIds,
} from '@/constants/bjjEireCompetitionDataTestIds'
import {
  createDivision,
  createBjjEireCompetition,
} from '@/testing/factories/bjjeire-competition.factory'
import {
  createAdminDivisionResult,
  createResultCompetitor,
} from '@/testing/factories/result.factory'
import {
  renderAdminBjjEireCompetitionPage,
  seedAdminBjjEireCompetition,
  seedAdminResults,
  seedClearResult,
  seedFinish,
  seedRecordResult,
} from '@/features/bjjeire-competition-admin/testing/bjjeire-competition-admin-test-helpers'
import type {
  AdminDivisionResultDto,
  BjjEireCompetitionDto,
} from '@/types/bjjeire-competitions'

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

const { results, finish } = uiContent.bjjEireCompetitionAdmin
const ID = 'bjjeire-competition-with-results'
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
    registrationState: 'CLOSED',
    divisions: [light, heavy],
    ...overrides,
  })
}

const aoife = createResultCompetitor({
  registrationId: 'aaaaaaaaaaaaaaaaaaaaaaa1',
  displayName: 'Aoife Byrne',
})
const ciaran = createResultCompetitor({
  registrationId: 'aaaaaaaaaaaaaaaaaaaaaaa2',
  displayName: 'Ciaran Byrne',
  academy: 'Team Y',
})
const niamh = createResultCompetitor({
  registrationId: 'aaaaaaaaaaaaaaaaaaaaaaa3',
  displayName: 'Niamh Byrne',
})

function lightDivision(
  overrides: Partial<AdminDivisionResultDto> = {}
): AdminDivisionResultDto {
  return createAdminDivisionResult({
    divisionId: light.id,
    competitors: [aoife, ciaran, niamh],
    ...overrides,
  })
}

async function lightCard(): Promise<HTMLElement> {
  const cards = await screen.findAllByTestId(
    BjjEireCompetitionAdminResultsTestIds.DIVISION
  )
  return cards[0]
}

beforeEach(() => {
  mockMsal.getAllAccounts.mockReturnValue([{ username: 'owner@bjjeire.test' }])
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('AdminCompetitionPage: results (FR-031, #5028, #5033)', () => {
  // #5028
  it('given confirmed competitors, when the organiser records gold, silver and bronze, then the podium is sent by sign-up id and saved', async () => {
    seedAdminBjjEireCompetition(published())
    seedAdminResults(ID, [
      lightDivision(),
      createAdminDivisionResult({ divisionId: heavy.id }),
    ])
    const recorded = seedRecordResult(ID, (divisionId, command) =>
      lightDivision({
        divisionId,
        result: { ...command, recordedAt: '2026-06-27T18:00:00Z' },
      })
    )
    const { user } = renderAdminBjjEireCompetitionPage(ID)

    const card = await lightCard()
    expect(card).toHaveTextContent('-76 kg')
    await user.selectOptions(
      within(card).getByTestId(BjjEireCompetitionAdminResultsTestIds.GOLD),
      aoife.registrationId
    )
    await user.selectOptions(
      within(card).getByTestId(BjjEireCompetitionAdminResultsTestIds.SILVER),
      ciaran.registrationId
    )
    await user.selectOptions(
      within(card).getAllByTestId(
        BjjEireCompetitionAdminResultsTestIds.BRONZE
      )[0],
      niamh.registrationId
    )
    await user.click(
      within(card).getByTestId(BjjEireCompetitionAdminResultsTestIds.SAVE)
    )

    await waitFor(() => expect(recorded.calls).toHaveLength(1))
    expect(recorded.calls[0]).toEqual({
      divisionId: light.id,
      command: {
        goldRegistrationId: aoife.registrationId,
        silverRegistrationId: ciaran.registrationId,
        bronzeRegistrationIds: [niamh.registrationId],
      },
    })
    expect(recorded.authorization[0]).toBe('Bearer organiser-token')
    expect(
      await within(card).findByTestId(
        BjjEireCompetitionAdminResultsTestIds.NOTICE
      )
    ).toHaveTextContent(results.saved)
  })

  // FR-031
  it('given a division, when the organiser picks medallists, then only its confirmed competitors are offered and a duplicate is blocked', async () => {
    seedAdminBjjEireCompetition(published())
    seedAdminResults(ID, [lightDivision()])
    const recorded = seedRecordResult(ID, () => lightDivision())
    const { user } = renderAdminBjjEireCompetitionPage(ID)

    const card = await lightCard()
    const gold = within(card).getByTestId(
      BjjEireCompetitionAdminResultsTestIds.GOLD
    )
    const options = within(gold)
      .getAllByRole('option')
      .map(option => option.textContent)
    expect(options).toEqual([
      results.choose,
      expect.stringContaining('Aoife Byrne'),
      expect.stringContaining('Ciaran Byrne'),
      expect.stringContaining('Niamh Byrne'),
    ])

    await user.click(
      within(card).getByTestId(BjjEireCompetitionAdminResultsTestIds.SAVE)
    )
    expect(
      within(card).getByTestId(BjjEireCompetitionAdminResultsTestIds.ERROR)
    ).toHaveTextContent(results.needsGold)

    await user.selectOptions(gold, aoife.registrationId)
    await user.selectOptions(
      within(card).getByTestId(BjjEireCompetitionAdminResultsTestIds.SILVER),
      aoife.registrationId
    )
    await user.click(
      within(card).getByTestId(BjjEireCompetitionAdminResultsTestIds.SAVE)
    )
    expect(
      within(card).getByTestId(BjjEireCompetitionAdminResultsTestIds.ERROR)
    ).toHaveTextContent(results.duplicate)
    expect(recorded.calls).toHaveLength(0)
  })

  // #5033
  it('given a recorded podium, when the organiser opens the tab, then it is filled in and can be corrected or cleared', async () => {
    seedAdminBjjEireCompetition(published())
    seedAdminResults(
      ID,
      [
        lightDivision({
          result: {
            goldRegistrationId: aoife.registrationId,
            silverRegistrationId: ciaran.registrationId,
            bronzeRegistrationIds: [],
          },
        }),
      ],
      [lightDivision()]
    )
    const recorded = seedRecordResult(ID, (divisionId, command) =>
      lightDivision({ divisionId, result: command })
    )
    const cleared = seedClearResult(ID)
    const { user } = renderAdminBjjEireCompetitionPage(ID)

    const card = await lightCard()
    expect(
      within(card).getByTestId(
        BjjEireCompetitionAdminResultsTestIds.DIVISION_STATUS
      )
    ).toHaveTextContent(results.recorded)
    const gold = within(card).getByTestId(
      BjjEireCompetitionAdminResultsTestIds.GOLD
    )
    expect(gold).toHaveValue(aoife.registrationId)

    await user.selectOptions(gold, ciaran.registrationId)
    await user.selectOptions(
      within(card).getByTestId(BjjEireCompetitionAdminResultsTestIds.SILVER),
      aoife.registrationId
    )
    await user.click(
      within(card).getByTestId(BjjEireCompetitionAdminResultsTestIds.SAVE)
    )
    await waitFor(() => expect(recorded.calls).toHaveLength(1))
    expect(recorded.calls[0].command.goldRegistrationId).toBe(
      ciaran.registrationId
    )

    await user.click(
      within(card).getByTestId(BjjEireCompetitionAdminResultsTestIds.CLEAR)
    )
    await waitFor(() => expect(cleared.calls).toEqual([light.id]))
  })

  it('given the API refuses a result, when the organiser saves, then its explanation is shown', async () => {
    seedAdminBjjEireCompetition(published())
    seedAdminResults(ID, [lightDivision()])
    seedRecordResult(ID, () =>
      HttpResponse.json(
        {
          type: 'urn:bjjeire:not-in-division',
          status: 409,
          detail:
            'Every medallist must be a confirmed competitor in this division.',
        },
        { status: 409 }
      )
    )
    const { user } = renderAdminBjjEireCompetitionPage(ID)

    const card = await lightCard()
    await user.selectOptions(
      within(card).getByTestId(BjjEireCompetitionAdminResultsTestIds.GOLD),
      aoife.registrationId
    )
    await user.click(
      within(card).getByTestId(BjjEireCompetitionAdminResultsTestIds.SAVE)
    )

    expect(
      await within(card).findByTestId(
        BjjEireCompetitionAdminResultsTestIds.ERROR
      )
    ).toHaveTextContent('confirmed competitor in this division')
  })

  it('given a division with no confirmed competitors, when the organiser opens the tab, then it offers no form', async () => {
    seedAdminBjjEireCompetition(published())
    seedAdminResults(ID, [createAdminDivisionResult({ divisionId: heavy.id })])
    renderAdminBjjEireCompetitionPage(ID)

    const card = await lightCard()
    expect(card).toHaveTextContent(results.noCompetitors)
    expect(
      within(card).queryByTestId(BjjEireCompetitionAdminResultsTestIds.SAVE)
    ).not.toBeInTheDocument()
  })

  it('given a draft, when the organiser opens it, then there is no results tab and no finish action', async () => {
    seedAdminBjjEireCompetition(
      published({ status: 'DRAFT', registrationState: 'CLOSED' })
    )
    renderAdminBjjEireCompetitionPage(ID)

    expect(
      await screen.findByRole('heading', { level: 1, name: /BjjEire/ })
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId(BjjEireCompetitionAdminResultsTestIds.ROOT)
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId(BjjEireCompetitionAdminFinishTestIds.BUTTON)
    ).not.toBeInTheDocument()
  })
})

describe('AdminCompetitionPage: finish (#5041)', () => {
  it('given a published competition, when the organiser confirms finishing, then it is finished and the winners are announced', async () => {
    seedAdminBjjEireCompetition(published())
    seedAdminResults(ID, [])
    const finished = seedFinish(ID, published({ status: 'FINISHED' }))
    const { user } = renderAdminBjjEireCompetitionPage(ID)

    await user.click(
      await screen.findByTestId(BjjEireCompetitionAdminFinishTestIds.BUTTON)
    )
    expect(
      screen.getByTestId(BjjEireCompetitionAdminFinishTestIds.WARNING)
    ).toHaveTextContent(finish.warning)
    await user.click(
      screen.getByTestId(BjjEireCompetitionAdminFinishTestIds.CONFIRM)
    )

    await waitFor(() => expect(finished.calls).toHaveLength(1))
    expect(finished.authorization[0]).toBe('Bearer organiser-token')
    expect(
      await screen.findByTestId(BjjEireCompetitionAdminFinishTestIds.NOTICE)
    ).toHaveTextContent(finish.finished)
    expect(
      screen.queryByTestId(BjjEireCompetitionAdminFinishTestIds.BUTTON)
    ).not.toBeInTheDocument()
  })

  it('given the organiser changes their mind, when they keep the competition open, then nothing is sent', async () => {
    seedAdminBjjEireCompetition(published())
    seedAdminResults(ID, [])
    const finished = seedFinish(ID, published({ status: 'FINISHED' }))
    const { user } = renderAdminBjjEireCompetitionPage(ID)

    await user.click(
      await screen.findByTestId(BjjEireCompetitionAdminFinishTestIds.BUTTON)
    )
    await user.click(
      screen.getByTestId(BjjEireCompetitionAdminFinishTestIds.KEEP)
    )

    expect(
      screen.queryByTestId(BjjEireCompetitionAdminFinishTestIds.WARNING)
    ).not.toBeInTheDocument()
    expect(finished.calls).toHaveLength(0)
  })

  it('given a finished competition, when the organiser opens it, then results can still be corrected', async () => {
    seedAdminBjjEireCompetition(published({ status: 'FINISHED' }))
    seedAdminResults(ID, [lightDivision()])
    renderAdminBjjEireCompetitionPage(ID)

    const card = await lightCard()
    expect(
      within(card).getByTestId(BjjEireCompetitionAdminResultsTestIds.SAVE)
    ).toBeEnabled()
    expect(
      screen.queryByTestId(BjjEireCompetitionAdminFinishTestIds.BUTTON)
    ).not.toBeInTheDocument()
  })
})
