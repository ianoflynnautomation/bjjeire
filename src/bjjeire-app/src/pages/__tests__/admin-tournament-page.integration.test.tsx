import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { uiContent } from '@/config/ui-content'
import { TournamentAdminTestIds } from '@/constants/tournamentDataTestIds'
import {
  createDivision,
  createTournament,
} from '@/testing/factories/tournament.factory'
import {
  renderAdminTournamentPage,
  seedAdminTournament,
  seedAdminTournamentMissing,
  seedPublish,
  seedUpdate,
  seedUpdateProblem,
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

const { divisions, edit, publish, form, signIn } = uiContent.tournamentAdmin
const ID = 'tournament-under-edit'

function draft(overrides: Partial<TournamentDto> = {}): TournamentDto {
  return createTournament({
    id: ID,
    slug: 'bjjeire',
    name: 'BjjEire',
    status: 'DRAFT',
    registrationState: 'CLOSED',
    ...overrides,
  })
}

async function generate(
  user: ReturnType<typeof renderAdminTournamentPage>['user'],
  ticks: string[],
  weightClasses: string
): Promise<void> {
  for (const name of ticks) {
    await user.click(screen.getByRole('checkbox', { name }))
  }
  await user.type(screen.getByLabelText(divisions.weightClasses), weightClasses)
  await user.click(screen.getByTestId(TournamentAdminTestIds.GENERATE))
}

beforeEach(() => {
  mockMsal.getAllAccounts.mockReturnValue([{ username: 'owner@bjjeire.test' }])
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('AdminTournamentPage', () => {
  it('given nobody is signed in, when the page opens, then it asks for the organiser sign-in', async () => {
    mockMsal.getAllAccounts.mockReturnValue([])
    renderAdminTournamentPage(ID)

    expect(
      await screen.findByRole('heading', { name: signIn.heading })
    ).toBeInTheDocument()
  })

  it('given a draft, when the page opens, then the form shows its saved details in euro and Irish time', async () => {
    seedAdminTournament(draft({ entryFeeCents: 2550, competitorLimit: 200 }))
    renderAdminTournamentPage(ID)

    expect(await screen.findByLabelText(form.name)).toHaveValue('BjjEire')
    expect(screen.getByLabelText(form.slug)).toHaveValue('bjjeire')
    expect(screen.getByLabelText(form.entryFee)).toHaveValue('25.50')
    expect(screen.getByLabelText(form.opensAt)).toHaveValue('2026-06-01T10:00')
    expect(screen.getByLabelText(form.closesAt)).toHaveValue('2026-06-20T21:00')
    expect(screen.getByLabelText(form.competitorLimit)).toHaveValue('200')
    expect(screen.getByTestId(TournamentAdminTestIds.STATUS)).toHaveTextContent(
      'Draft'
    )
    expect(
      screen.getAllByTestId(TournamentAdminTestIds.DIVISION_ROW)
    ).toHaveLength(1)
  })

  it('given a draft with no divisions, when the page opens, then Publish is disabled and says why', async () => {
    seedAdminTournament(draft({ divisions: [] }))
    renderAdminTournamentPage(ID)

    const button = await screen.findByTestId(TournamentAdminTestIds.PUBLISH)
    expect(button).toBeDisabled()
    expect(button).toHaveAccessibleDescription(publish.needsDivisions)
    expect(screen.getByText(divisions.empty)).toBeInTheDocument()
  })

  it('given the generator, when the organiser ticks options and adds, then one row appears per combination, rows can be removed, and adding again makes no duplicates', async () => {
    seedAdminTournament(draft({ divisions: [] }))
    const { user } = renderAdminTournamentPage(ID)
    await screen.findByLabelText(form.name)

    expect(screen.getByTestId(TournamentAdminTestIds.GENERATE)).toBeDisabled()
    await generate(
      user,
      ['Gi', 'Male', 'Female', 'Adult', 'White', 'Blue'],
      '-70 kg, -76 kg'
    )

    expect(
      screen.getAllByTestId(TournamentAdminTestIds.DIVISION_ROW)
    ).toHaveLength(8)
    expect(
      screen.getByTestId(TournamentAdminTestIds.DIVISION_COUNT)
    ).toHaveTextContent('8 divisions')

    await user.click(
      screen.getByRole('button', {
        name: `${divisions.removeAriaPrefix}: Gi, Male, Adult, White, -70 kg`,
      })
    )
    expect(
      screen.getAllByTestId(TournamentAdminTestIds.DIVISION_ROW)
    ).toHaveLength(7)

    await user.click(screen.getByTestId(TournamentAdminTestIds.GENERATE))
    expect(
      screen.getAllByTestId(TournamentAdminTestIds.DIVISION_ROW)
    ).toHaveLength(8)
    // Still unsaved, so it cannot be published yet.
    expect(screen.getByTestId(TournamentAdminTestIds.PUBLISH)).toBeDisabled()
  })

  it('given a draft, when the organiser edits and saves, then the full division list is sent with saved ids kept, and the save is confirmed', async () => {
    const saved = createDivision({
      id: 'saved-division',
      weightClass: '-76 kg',
    })
    seedAdminTournament(draft({ divisions: [saved], version: 3 }))
    const updated = seedUpdate(ID, command =>
      draft({
        ...command,
        divisions: command.divisions.map((division, index) => ({
          ...division,
          id: division.id ?? `new-${index}`,
        })),
      })
    )
    const { user } = renderAdminTournamentPage(ID)

    const fee = await screen.findByLabelText(form.entryFee)
    await user.clear(fee)
    await user.type(fee, '30')
    await generate(user, ['Gi', 'Male', 'Adult', 'White'], '-82 kg')
    expect(screen.getByTestId(TournamentAdminTestIds.PUBLISH)).toBeDisabled()
    expect(
      screen.getByTestId(TournamentAdminTestIds.PUBLISH)
    ).toHaveAccessibleDescription(publish.unsavedChanges)
    await user.click(screen.getByRole('button', { name: edit.submit }))

    expect(
      await screen.findByTestId(TournamentAdminTestIds.FORM_NOTICE)
    ).toHaveTextContent(edit.saved)
    expect(updated.calls).toHaveLength(1)
    expect(updated.calls[0].entryFeeCents).toBe(3000)
    // The version the edit started from, so a save from a stale tab is refused.
    expect(updated.calls[0].version).toBe(3)
    expect(updated.calls[0].divisions).toEqual([
      saved,
      {
        discipline: 'GI',
        gender: 'MALE',
        ageCategory: 'ADULT',
        belt: 'WHITE',
        weightClass: '-82 kg',
      },
    ])
    expect(updated.authorization).toEqual(['Bearer organiser-token'])
    await waitFor(() =>
      expect(screen.getByTestId(TournamentAdminTestIds.PUBLISH)).toBeEnabled()
    )
  })

  // #5002
  it('given a saved draft with a division, when the organiser publishes, then it is published and the page says everyone can see it', async () => {
    const tournament = draft()
    seedAdminTournament(tournament)
    const published = seedPublish(ID, { ...tournament, status: 'PUBLISHED' })
    const { user } = renderAdminTournamentPage(ID)

    const button = await screen.findByTestId(TournamentAdminTestIds.PUBLISH)
    expect(button).toBeEnabled()
    await user.click(button)

    expect(
      await screen.findByTestId(TournamentAdminTestIds.FORM_NOTICE)
    ).toHaveTextContent(publish.published)
    expect(published.calls).toHaveLength(1)
    expect(published.authorization).toEqual(['Bearer organiser-token'])
    expect(screen.getByTestId(TournamentAdminTestIds.STATUS)).toHaveTextContent(
      'Published'
    )
    expect(
      screen.queryByTestId(TournamentAdminTestIds.PUBLISH)
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', {
        name: uiContent.tournamentAdmin.list.viewLink,
      })
    ).toHaveAttribute('href', '/tournaments/bjjeire')
  })

  // #5005
  it('given a division with sign-ups, when the organiser removes it and saves, then they are told to move or cancel those sign-ups first', async () => {
    const entered = createDivision({ id: 'entered', weightClass: '-82 kg' })
    seedAdminTournament(
      draft({ status: 'PUBLISHED', divisions: [createDivision(), entered] })
    )
    seedUpdateProblem(ID, 409, {
      type: 'urn:bjjeire:division-has-signups',
      detail:
        'A division you removed still has sign-ups. Move or cancel those sign-ups first.',
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { user } = renderAdminTournamentPage(ID)

    const rows = await screen.findAllByTestId(
      TournamentAdminTestIds.DIVISION_ROW
    )
    await user.click(
      within(rows[1]).getByTestId(TournamentAdminTestIds.DIVISION_REMOVE)
    )
    await user.click(screen.getByRole('button', { name: edit.submit }))

    const error = await screen.findByTestId(TournamentAdminTestIds.FORM_ERROR)
    expect(error).toHaveTextContent(
      'A division you removed still has sign-ups. Move or cancel those sign-ups first.'
    )
    expect(error).toHaveAttribute('role', 'alert')
  })

  it('given another save got there first, when the organiser saves, then they are told to reload', async () => {
    seedAdminTournament(draft())
    seedUpdateProblem(ID, 409, {
      type: 'urn:bjjeire:conflict',
      detail: 'The resource was modified by someone else. Reload it and retry.',
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { user } = renderAdminTournamentPage(ID)

    await user.click(await screen.findByRole('button', { name: edit.submit }))

    expect(
      await screen.findByTestId(TournamentAdminTestIds.FORM_ERROR)
    ).toHaveTextContent('Reload it and retry.')
  })

  it('given a cancelled tournament, when the page opens, then it cannot be edited or published', async () => {
    seedAdminTournament(draft({ status: 'CANCELLED' }))
    renderAdminTournamentPage(ID)

    expect(await screen.findByText(edit.readOnly)).toBeInTheDocument()
    expect(screen.getByLabelText(form.name)).toBeDisabled()
    expect(
      screen.queryByRole('button', { name: edit.submit })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId(TournamentAdminTestIds.PUBLISH)
    ).not.toBeInTheDocument()
  })

  it('given an unknown id, when the page opens, then it says there is no such tournament', async () => {
    seedAdminTournamentMissing(ID)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderAdminTournamentPage(ID)

    expect(await screen.findByText(edit.notFound)).toBeInTheDocument()
  })
})
