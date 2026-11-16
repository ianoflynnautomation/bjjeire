import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { uiContent } from '@/config/ui-content'
import { BjjEireCompetitionAdminTestIds } from '@/constants/bjjEireCompetitionDataTestIds'
import {
  createDivision,
  createBjjEireCompetition,
} from '@/testing/factories/bjjeire-competition.factory'
import {
  renderAdminBjjEireCompetitionPage,
  seedAdminBjjEireCompetition,
  seedAdminBjjEireCompetitionMissing,
  seedPublish,
  seedUpdate,
  seedUpdateProblem,
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

const { divisions, edit, publish, form, signIn } =
  uiContent.bjjEireCompetitionAdmin
const ID = 'bjjeire-competition-under-edit'

function draft(
  overrides: Partial<BjjEireCompetitionDto> = {}
): BjjEireCompetitionDto {
  return createBjjEireCompetition({
    id: ID,
    slug: 'bjjeire',
    name: 'BjjEire',
    status: 'DRAFT',
    registrationState: 'CLOSED',
    ...overrides,
  })
}

async function generate(
  user: ReturnType<typeof renderAdminBjjEireCompetitionPage>['user'],
  ticks: string[],
  weightClasses: string
): Promise<void> {
  for (const name of ticks) {
    await user.click(screen.getByRole('checkbox', { name }))
  }
  await user.type(screen.getByLabelText(divisions.weightClasses), weightClasses)
  await user.click(screen.getByTestId(BjjEireCompetitionAdminTestIds.GENERATE))
}

beforeEach(() => {
  mockMsal.getAllAccounts.mockReturnValue([{ username: 'owner@bjjeire.test' }])
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('AdminBjjEireCompetitionPage', () => {
  it('given nobody is signed in, when the page opens, then it asks for the organiser sign-in', async () => {
    mockMsal.getAllAccounts.mockReturnValue([])
    renderAdminBjjEireCompetitionPage(ID)

    expect(
      await screen.findByRole('heading', { name: signIn.heading })
    ).toBeInTheDocument()
  })

  it('given a draft, when the page opens, then the form shows its saved details in euro and Irish time', async () => {
    seedAdminBjjEireCompetition(
      draft({ entryFeeCents: 2550, competitorLimit: 200 })
    )
    renderAdminBjjEireCompetitionPage(ID)

    expect(await screen.findByLabelText(form.name)).toHaveValue('BjjEire')
    expect(screen.getByLabelText(form.slug)).toHaveValue('bjjeire')
    expect(screen.getByLabelText(form.entryFee)).toHaveValue('25.50')
    expect(screen.getByLabelText(form.opensAt)).toHaveValue('2026-06-01T10:00')
    expect(screen.getByLabelText(form.closesAt)).toHaveValue('2026-06-20T21:00')
    expect(screen.getByLabelText(form.competitorLimit)).toHaveValue('200')
    expect(
      screen.getByTestId(BjjEireCompetitionAdminTestIds.STATUS)
    ).toHaveTextContent('Draft')
    expect(
      screen.getAllByTestId(BjjEireCompetitionAdminTestIds.DIVISION_ROW)
    ).toHaveLength(1)
  })

  it('given a draft with no divisions, when the page opens, then Publish is disabled and says why', async () => {
    seedAdminBjjEireCompetition(draft({ divisions: [] }))
    renderAdminBjjEireCompetitionPage(ID)

    const button = await screen.findByTestId(
      BjjEireCompetitionAdminTestIds.PUBLISH
    )
    expect(button).toBeDisabled()
    expect(button).toHaveAccessibleDescription(publish.needsDivisions)
    expect(screen.getByText(divisions.empty)).toBeInTheDocument()
  })

  it('given the generator, when the organiser ticks options and adds, then one row appears per combination, rows can be removed, and adding again makes no duplicates', async () => {
    seedAdminBjjEireCompetition(draft({ divisions: [] }))
    const { user } = renderAdminBjjEireCompetitionPage(ID)
    await screen.findByLabelText(form.name)

    expect(
      screen.getByTestId(BjjEireCompetitionAdminTestIds.GENERATE)
    ).toBeDisabled()
    await generate(
      user,
      ['Gi', 'Male', 'Female', 'Adult', 'White', 'Blue'],
      '-70 kg, -76 kg'
    )

    expect(
      screen.getAllByTestId(BjjEireCompetitionAdminTestIds.DIVISION_ROW)
    ).toHaveLength(8)
    expect(
      screen.getByTestId(BjjEireCompetitionAdminTestIds.DIVISION_COUNT)
    ).toHaveTextContent('8 divisions')

    await user.click(
      screen.getByRole('button', {
        name: `${divisions.removeAriaPrefix}: Gi, Male, Adult, White, -70 kg`,
      })
    )
    expect(
      screen.getAllByTestId(BjjEireCompetitionAdminTestIds.DIVISION_ROW)
    ).toHaveLength(7)

    await user.click(
      screen.getByTestId(BjjEireCompetitionAdminTestIds.GENERATE)
    )
    expect(
      screen.getAllByTestId(BjjEireCompetitionAdminTestIds.DIVISION_ROW)
    ).toHaveLength(8)
    // Still unsaved, so it cannot be published yet.
    expect(
      screen.getByTestId(BjjEireCompetitionAdminTestIds.PUBLISH)
    ).toBeDisabled()
  })

  it('given a draft, when the organiser edits and saves, then the full division list is sent with saved ids kept, and the save is confirmed', async () => {
    const saved = createDivision({
      id: 'saved-division',
      weightClass: '-76 kg',
    })
    seedAdminBjjEireCompetition(draft({ divisions: [saved], version: 3 }))
    const updated = seedUpdate(ID, command =>
      draft({
        ...command,
        divisions: command.divisions.map((division, index) => ({
          ...division,
          id: division.id ?? `new-${index}`,
        })),
      })
    )
    const { user } = renderAdminBjjEireCompetitionPage(ID)

    const fee = await screen.findByLabelText(form.entryFee)
    await user.clear(fee)
    await user.type(fee, '30')
    await generate(user, ['Gi', 'Male', 'Adult', 'White'], '-82 kg')
    expect(
      screen.getByTestId(BjjEireCompetitionAdminTestIds.PUBLISH)
    ).toBeDisabled()
    expect(
      screen.getByTestId(BjjEireCompetitionAdminTestIds.PUBLISH)
    ).toHaveAccessibleDescription(publish.unsavedChanges)
    await user.click(screen.getByRole('button', { name: edit.submit }))

    expect(
      await screen.findByTestId(BjjEireCompetitionAdminTestIds.FORM_NOTICE)
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
      expect(
        screen.getByTestId(BjjEireCompetitionAdminTestIds.PUBLISH)
      ).toBeEnabled()
    )
  })

  // #5002
  it('given a saved draft with a division, when the organiser publishes, then it is published and the page says everyone can see it', async () => {
    const bjjEireCompetition = draft()
    seedAdminBjjEireCompetition(bjjEireCompetition)
    const published = seedPublish(ID, {
      ...bjjEireCompetition,
      status: 'PUBLISHED',
    })
    const { user } = renderAdminBjjEireCompetitionPage(ID)

    const button = await screen.findByTestId(
      BjjEireCompetitionAdminTestIds.PUBLISH
    )
    expect(button).toBeEnabled()
    await user.click(button)

    expect(
      await screen.findByTestId(BjjEireCompetitionAdminTestIds.FORM_NOTICE)
    ).toHaveTextContent(publish.published)
    expect(published.calls).toHaveLength(1)
    expect(published.authorization).toEqual(['Bearer organiser-token'])
    expect(
      screen.getByTestId(BjjEireCompetitionAdminTestIds.STATUS)
    ).toHaveTextContent('Published')
    expect(
      screen.queryByTestId(BjjEireCompetitionAdminTestIds.PUBLISH)
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', {
        name: uiContent.bjjEireCompetitionAdmin.list.viewLink,
      })
    ).toHaveAttribute('href', '/competitions/bjjeire')
  })

  // #5005
  it('given a division with sign-ups, when the organiser removes it and saves, then they are told to move or cancel those sign-ups first', async () => {
    const entered = createDivision({ id: 'entered', weightClass: '-82 kg' })
    seedAdminBjjEireCompetition(
      draft({ status: 'PUBLISHED', divisions: [createDivision(), entered] })
    )
    seedUpdateProblem(ID, 409, {
      type: 'urn:bjjeire:division-has-signups',
      detail:
        'A division you removed still has sign-ups. Move or cancel those sign-ups first.',
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { user } = renderAdminBjjEireCompetitionPage(ID)

    const rows = await screen.findAllByTestId(
      BjjEireCompetitionAdminTestIds.DIVISION_ROW
    )
    await user.click(
      within(rows[1]).getByTestId(
        BjjEireCompetitionAdminTestIds.DIVISION_REMOVE
      )
    )
    await user.click(screen.getByRole('button', { name: edit.submit }))

    const error = await screen.findByTestId(
      BjjEireCompetitionAdminTestIds.FORM_ERROR
    )
    expect(error).toHaveTextContent(
      'A division you removed still has sign-ups. Move or cancel those sign-ups first.'
    )
    expect(error).toHaveAttribute('role', 'alert')
  })

  it('given another save got there first, when the organiser saves, then they are told to reload', async () => {
    seedAdminBjjEireCompetition(draft())
    seedUpdateProblem(ID, 409, {
      type: 'urn:bjjeire:conflict',
      detail: 'The resource was modified by someone else. Reload it and retry.',
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { user } = renderAdminBjjEireCompetitionPage(ID)

    await user.click(await screen.findByRole('button', { name: edit.submit }))

    expect(
      await screen.findByTestId(BjjEireCompetitionAdminTestIds.FORM_ERROR)
    ).toHaveTextContent('Reload it and retry.')
  })

  it('given a cancelled competition, when the page opens, then it cannot be edited or published', async () => {
    seedAdminBjjEireCompetition(draft({ status: 'CANCELLED' }))
    renderAdminBjjEireCompetitionPage(ID)

    expect(await screen.findByText(edit.readOnly)).toBeInTheDocument()
    expect(screen.getByLabelText(form.name)).toBeDisabled()
    expect(
      screen.queryByRole('button', { name: edit.submit })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId(BjjEireCompetitionAdminTestIds.PUBLISH)
    ).not.toBeInTheDocument()
  })

  it('given an unknown id, when the page opens, then it says there is no such competition', async () => {
    seedAdminBjjEireCompetitionMissing(ID)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderAdminBjjEireCompetitionPage(ID)

    expect(await screen.findByText(edit.notFound)).toBeInTheDocument()
  })
})
