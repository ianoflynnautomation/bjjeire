import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { uiContent } from '@/config/ui-content'
import { CompetitorProfileTestIds } from '@/constants/competitorDataTestIds'
import {
  createCompetitor,
  createCompetitorHistory,
  createTournamentMedals,
} from '@/testing/factories/competitor.factory'
import { createGym } from '@/testing/factories/gym.factory'
import {
  renderProfilePage,
  seedDeleteAccount,
  seedDirectoryGyms,
  seedOwnHistory,
  seedOwnProfile,
  seedSaveProfile,
} from '@/features/competitor/testing/competitor-test-helpers'

interface MockMsal {
  initialize: ReturnType<typeof vi.fn<() => Promise<void>>>
  getAllAccounts: ReturnType<typeof vi.fn<() => object[]>>
  acquireTokenSilent: ReturnType<
    typeof vi.fn<() => Promise<{ accessToken: string }>>
  >
  loginPopup: ReturnType<typeof vi.fn<() => Promise<object>>>
  logoutPopup: ReturnType<typeof vi.fn<(request?: object) => Promise<void>>>
  clearCache: ReturnType<typeof vi.fn<(request?: object) => Promise<void>>>
}

const { competitorMsal, adminMsal } = vi.hoisted(() => {
  const make = (token: string): MockMsal => ({
    initialize: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    getAllAccounts: vi.fn<() => object[]>(() => []),
    acquireTokenSilent: vi.fn<() => Promise<{ accessToken: string }>>(() =>
      Promise.resolve({ accessToken: token })
    ),
    loginPopup: vi.fn<() => Promise<object>>(() => Promise.resolve({})),
    logoutPopup: vi.fn<(request?: object) => Promise<void>>(() =>
      Promise.resolve()
    ),
    clearCache: vi.fn<(request?: object) => Promise<void>>(() =>
      Promise.resolve()
    ),
  })
  return {
    competitorMsal: make('competitor-token'),
    adminMsal: make('organiser-token'),
  }
})

vi.mock('@/lib/competitor-msal-config', () => ({
  competitorMsalInstance: competitorMsal,
  competitorLoginRequest: { scopes: ['access_as_competitor'] },
}))
vi.mock('@/lib/msal-config', () => ({
  msalInstance: adminMsal,
  loginRequest: { scopes: ['access_as_writer'] },
}))

const { signIn, profile, form, history, account, validation } =
  uiContent.competitor

function signedIn(): void {
  competitorMsal.getAllAccounts.mockReturnValue([{ username: 'aoife' }])
}

beforeEach(() => {
  competitorMsal.getAllAccounts.mockReturnValue([])
  seedOwnHistory(createCompetitorHistory())
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('ProfilePage', () => {
  // #5006, #5013: signing in or registering happens on this page, and the visitor stays where they asked to go.
  it('given a visitor who is not signed in, when the page opens, then it offers sign-in or registration and loads no profile', async () => {
    const own = seedOwnProfile(createCompetitor())
    renderProfilePage()

    expect(
      await screen.findByRole('heading', { name: signIn.heading })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: signIn.button })
    ).toBeInTheDocument()
    expect(own.calls).toHaveLength(0)
  })

  it('given a visitor who is not signed in, when they sign in, then the competitor tenant is used and their profile loads on the same page', async () => {
    const own = seedOwnProfile(createCompetitor())
    const { user } = renderProfilePage()

    competitorMsal.loginPopup.mockImplementation(() => {
      signedIn()
      return Promise.resolve({})
    })
    await user.click(await screen.findByRole('button', { name: signIn.button }))

    expect(
      await screen.findByRole('heading', { name: profile.heading })
    ).toBeInTheDocument()
    expect(competitorMsal.loginPopup).toHaveBeenCalledTimes(1)
    expect(adminMsal.loginPopup).not.toHaveBeenCalled()
    expect(own.authorization).toEqual(['Bearer competitor-token'])
  })

  // #5007
  it('given a competitor with no profile yet, when they fill in and save the form, then the profile is sent and shown back as saved', async () => {
    signedIn()
    seedOwnProfile(null)
    const save = seedSaveProfile(command =>
      createCompetitor({
        firstName: command.firstName,
        lastName: command.lastName,
        academy: { gymId: null, name: 'My Garage' },
        affiliation: null,
      })
    )
    const { user } = renderProfilePage()

    expect(
      await screen.findByRole('heading', { name: profile.createHeading })
    ).toBeInTheDocument()
    // The API answers 200 with an unsaved profile, never 404, and already knows the sign-in email.
    expect(
      screen.getByTestId(CompetitorProfileTestIds.EMAIL)
    ).toHaveTextContent('new@example.test')
    expect(
      screen.queryByTestId(CompetitorProfileTestIds.INCOMPLETE)
    ).not.toBeInTheDocument()
    await user.type(screen.getByLabelText(form.firstName), 'Aoife')
    await user.type(screen.getByLabelText(form.lastName), 'Byrne')
    await user.selectOptions(screen.getByLabelText(form.nationality), 'IE')
    await user.type(screen.getByLabelText(form.dateOfBirth), '1990-04-12')
    await user.selectOptions(screen.getByLabelText(form.gender), 'FEMALE')
    await user.selectOptions(screen.getByLabelText(form.belt), 'BLUE')
    await user.click(screen.getByLabelText(form.academyTyped))
    await user.type(screen.getByLabelText(form.academyName), 'My Garage')
    await user.click(screen.getByRole('button', { name: profile.submit }))

    expect(
      await screen.findByTestId(CompetitorProfileTestIds.FORM_NOTICE)
    ).toHaveTextContent(profile.saved)
    expect(save.calls).toEqual([
      expect.objectContaining({
        firstName: 'Aoife',
        lastName: 'Byrne',
        nationality: 'IE',
        dateOfBirth: '1990-04-12',
        gender: 'FEMALE',
        belt: 'BLUE',
        academy: { name: 'My Garage' },
        affiliation: null,
      }),
    ])
    expect(save.authorization).toEqual(['Bearer competitor-token'])
    expect(screen.getByLabelText(form.firstName)).toHaveValue('Aoife')
  })

  it('given an empty form, when the competitor saves, then the missing details are named and nothing is sent', async () => {
    signedIn()
    seedOwnProfile(null)
    const save = seedSaveProfile(() => createCompetitor())
    const { user } = renderProfilePage()

    await user.click(
      await screen.findByRole('button', { name: profile.submit })
    )

    expect(screen.getByText(validation.firstNameRequired)).toBeInTheDocument()
    expect(screen.getByText(validation.beltRequired)).toBeInTheDocument()
    expect(save.calls).toHaveLength(0)
  })

  // #5008
  it('given the gym directory, when the competitor searches and picks a gym, then that gym is sent as their academy', async () => {
    signedIn()
    seedOwnProfile(createCompetitor({ academy: null }))
    seedDirectoryGyms([
      createGym({ id: 'gym-1', name: 'Dublin Grappling' }),
      createGym({ id: 'gym-2', name: 'Cork BJJ' }),
    ])
    const save = seedSaveProfile(() => createCompetitor())
    const { user } = renderProfilePage()

    await user.click(await screen.findByLabelText(form.academyDirectory))
    await user.type(screen.getByLabelText(form.academySearch), 'dublin')
    const options = await screen.findAllByTestId(
      CompetitorProfileTestIds.ACADEMY_OPTION
    )
    expect(options).toHaveLength(1)
    await user.click(options[0])
    expect(
      screen.getByTestId(CompetitorProfileTestIds.ACADEMY_SELECTED)
    ).toHaveTextContent('Dublin Grappling')
    await user.click(screen.getByRole('button', { name: profile.submit }))

    await waitFor(() => expect(save.calls).toHaveLength(1))
    expect(save.calls[0].academy).toEqual({ gymId: 'gym-1' })
  })

  // #5008
  it('given a saved academy, when the competitor chooses no academy and clears the affiliation, then neither is sent', async () => {
    signedIn()
    seedOwnProfile(createCompetitor())
    const save = seedSaveProfile(() => createCompetitor())
    const { user } = renderProfilePage()

    await user.click(await screen.findByLabelText(form.academyNone))
    await user.clear(screen.getByLabelText(form.affiliation))
    await user.click(screen.getByRole('button', { name: profile.submit }))

    await waitFor(() => expect(save.calls).toHaveLength(1))
    expect(save.calls[0]).toMatchObject({ academy: null, affiliation: null })
  })

  it('given a profile without nationality, gender or belt, when it opens, then the competitor is told it is not complete enough to sign up', async () => {
    signedIn()
    seedOwnProfile(
      createCompetitor({
        nationality: null,
        belt: null,
        profileComplete: false,
      })
    )
    renderProfilePage()

    expect(
      await screen.findByTestId(CompetitorProfileTestIds.INCOMPLETE)
    ).toHaveTextContent(profile.incomplete)
  })

  // #5039
  it('given medals won, when the profile opens, then the totals and each tournament with its medals are shown', async () => {
    signedIn()
    seedOwnProfile(createCompetitor())
    seedOwnHistory(
      createCompetitorHistory({
        gold: 1,
        silver: 2,
        bronze: 0,
        tournaments: [
          createTournamentMedals({ name: 'BjjEire', gold: 1, silver: 1 }),
          createTournamentMedals({
            tournamentId: 'second',
            slug: 'bjjeire-spring',
            name: 'BjjEire Spring',
            gold: 0,
            silver: 1,
          }),
        ],
      })
    )
    renderProfilePage()

    expect(
      await screen.findByTestId(CompetitorProfileTestIds.HISTORY_GOLD)
    ).toHaveTextContent('1')
    expect(
      screen.getByTestId(CompetitorProfileTestIds.HISTORY_SILVER)
    ).toHaveTextContent('2')
    expect(
      screen.getByTestId(CompetitorProfileTestIds.HISTORY_BRONZE)
    ).toHaveTextContent('0')
    const rows = screen.getAllByTestId(CompetitorProfileTestIds.HISTORY_ROW)
    expect(rows).toHaveLength(2)
    expect(
      within(rows[1]).getByRole('link', { name: 'BjjEire Spring' })
    ).toHaveAttribute('href', '/tournaments/bjjeire-spring')
  })

  // #5039
  it('given no tournaments entered, when the profile opens, then the medals section says so', async () => {
    signedIn()
    seedOwnProfile(createCompetitor())
    renderProfilePage()

    expect(
      await screen.findByTestId(CompetitorProfileTestIds.HISTORY_EMPTY)
    ).toHaveTextContent(history.empty)
  })

  // #5012
  it('given a signed-in competitor, when they confirm account deletion, then the account is deleted and this site forgets them without a popup', async () => {
    signedIn()
    // The popup would open after an await, not from the click, so a browser may block it.
    competitorMsal.clearCache.mockImplementation(() => {
      competitorMsal.getAllAccounts.mockReturnValue([])
      return Promise.resolve()
    })
    seedOwnProfile(createCompetitor())
    const remove = seedDeleteAccount()
    const { user } = renderProfilePage()

    await user.click(
      await screen.findByRole('button', { name: account.delete })
    )
    expect(remove.calls).toHaveLength(0)
    await user.click(
      screen.getByRole('button', { name: account.deleteConfirm })
    )

    await waitFor(() => expect(remove.calls).toHaveLength(1))
    expect(remove.authorization).toEqual(['Bearer competitor-token'])
    await waitFor(() =>
      expect(competitorMsal.clearCache).toHaveBeenCalledWith({
        account: { username: 'aoife' },
      })
    )
    expect(competitorMsal.logoutPopup).not.toHaveBeenCalled()
    expect(
      await screen.findByRole('heading', { name: signIn.heading })
    ).toBeInTheDocument()
  })

  it('given an active sign-up, when the competitor tries to delete their account, then they are told to cancel it first and stay signed in', async () => {
    signedIn()
    seedOwnProfile(createCompetitor())
    seedDeleteAccount(409)
    const { user } = renderProfilePage()

    await user.click(
      await screen.findByRole('button', { name: account.delete })
    )
    await user.click(
      screen.getByRole('button', { name: account.deleteConfirm })
    )

    expect(
      await screen.findByTestId(CompetitorProfileTestIds.DELETE_ERROR)
    ).toHaveTextContent(account.hasActiveRegistration)
    expect(competitorMsal.logoutPopup).not.toHaveBeenCalled()
  })

  it('given a signed-in competitor, when they sign out, then the sign-in is offered again', async () => {
    signedIn()
    seedOwnProfile(createCompetitor())
    const { user } = renderProfilePage()

    competitorMsal.logoutPopup.mockImplementation(() => {
      competitorMsal.getAllAccounts.mockReturnValue([])
      return Promise.resolve()
    })
    await user.click(
      await screen.findByRole('button', { name: account.signOut })
    )

    expect(
      await screen.findByRole('heading', { name: signIn.heading })
    ).toBeInTheDocument()
  })
})
