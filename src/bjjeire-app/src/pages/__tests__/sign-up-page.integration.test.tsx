import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { uiContent } from '@/config/ui-content'
import { paths } from '@/config/paths'
import { SignUpPageTestIds } from '@/constants/registrationDataTestIds'
import { CompetitorSignInTestIds } from '@/constants/competitorDataTestIds'
import {
  createDivision,
  createTournament,
} from '@/testing/factories/tournament.factory'
import { createRegistrationCheckout } from '@/testing/factories/registration.factory'
import { seedTournament } from '@/features/tournaments/testing/tournaments-test-helpers'
import {
  renderSignUpPage,
  seedCreateRegistration,
  seedEligibleDivisions,
  seedEligibleDivisionsProblem,
  seedResumeCheckout,
} from '@/features/registrations/testing/registration-test-helpers'
import type { TournamentDto } from '@/types/tournaments'

const { competitorMsal } = vi.hoisted(() => ({
  competitorMsal: {
    initialize: vi.fn(() => Promise.resolve()),
    getAllAccounts: vi.fn<() => object[]>(() => []),
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

const { signUp, problems } = uiContent.registrations
const assign = vi.fn<(url: string) => void>()

function bjjeire(overrides: Partial<TournamentDto> = {}): TournamentDto {
  return createTournament({
    id: 'tournament-bjjeire',
    slug: 'bjjeire',
    name: 'BjjEire',
    entryFeeCents: 2500,
    registrationState: 'OPEN',
    ...overrides,
  })
}

beforeEach(() => {
  competitorMsal.getAllAccounts.mockReturnValue([{ username: 'aoife' }])
  vi.stubGlobal('location', { href: window.location.href, assign })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('SignUpPage', () => {
  // #5013: signing in happens over this page, so the visitor returns to the sign-up afterwards.
  it('given a visitor who is not signed in, when they open the sign-up, then they are asked to sign in on the same page and see the divisions once they have', async () => {
    competitorMsal.getAllAccounts.mockReturnValue([])
    const tournament = bjjeire()
    seedTournament(tournament)
    const eligible = seedEligibleDivisions(tournament.id, [
      createDivision({ weightClass: '-76 kg' }),
    ])
    const { user } = renderSignUpPage('bjjeire')

    expect(
      await screen.findByTestId(CompetitorSignInTestIds.ROOT)
    ).toBeInTheDocument()
    expect(eligible.calls).toHaveLength(0)

    competitorMsal.loginPopup.mockImplementation(() => {
      competitorMsal.getAllAccounts.mockReturnValue([{ username: 'aoife' }])
      return Promise.resolve({})
    })
    await user.click(screen.getByTestId(CompetitorSignInTestIds.BUTTON))

    expect(
      await screen.findAllByTestId(SignUpPageTestIds.DIVISION_OPTION)
    ).toHaveLength(1)
    expect(eligible.authorization).toEqual(['Bearer competitor-token'])
  })

  // #5014
  it('given a competitor with a complete profile, when the sign-up opens, then only the divisions the API calls eligible are offered, with the fee', async () => {
    const tournament = bjjeire({
      divisions: [
        createDivision({ weightClass: '-70 kg' }),
        createDivision({ weightClass: '-76 kg' }),
        createDivision({ weightClass: '-82 kg', belt: 'BLUE' }),
      ],
    })
    seedTournament(tournament)
    seedEligibleDivisions(tournament.id, [
      tournament.divisions[0],
      tournament.divisions[1],
    ])
    renderSignUpPage('bjjeire')

    const options = await screen.findAllByTestId(
      SignUpPageTestIds.DIVISION_OPTION
    )
    expect(options).toHaveLength(2)
    expect(options[0]).toHaveTextContent('-70 kg')
    expect(options[1]).toHaveTextContent('-76 kg')
    expect(screen.queryByText(/-82 kg/)).not.toBeInTheDocument()
    expect(screen.getByTestId(SignUpPageTestIds.FEE)).toHaveTextContent(
      '€25.00'
    )
  })

  // #5015, FR-012: both consents before paying; the fee never comes from the browser.
  it('given a chosen division, when both consents are ticked and the competitor continues, then the sign-up starts and they leave for Stripe Checkout', async () => {
    const tournament = bjjeire()
    seedTournament(tournament)
    const division = tournament.divisions[0]
    seedEligibleDivisions(tournament.id, [division])
    const created = seedCreateRegistration(
      createRegistrationCheckout({
        checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_42',
      })
    )
    const { user } = renderSignUpPage('bjjeire')

    await user.click(
      await screen.findByRole('radio', { name: new RegExp(division.weightClass) })
    )
    await user.click(screen.getByTestId(SignUpPageTestIds.SUBMIT))
    expect(
      await screen.findByTestId(SignUpPageTestIds.FORM_ERROR)
    ).toHaveTextContent(signUp.consentsRequired)
    expect(created.calls).toHaveLength(0)

    await user.click(screen.getByRole('checkbox', { name: signUp.acceptPublicListing }))
    await user.click(screen.getByRole('checkbox', { name: signUp.acceptTerms }))
    await user.click(screen.getByTestId(SignUpPageTestIds.SUBMIT))

    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith(
        'https://checkout.stripe.com/c/pay/cs_test_42'
      )
    )
    expect(created.calls).toEqual([
      {
        tournamentId: tournament.id,
        divisionId: division.id,
        acceptPublicListing: true,
        acceptTerms: true,
      },
    ])
    expect(created.authorization).toEqual(['Bearer competitor-token'])
  })

  it('given no division chosen, when the competitor continues, then they are asked to choose one', async () => {
    const tournament = bjjeire()
    seedTournament(tournament)
    seedEligibleDivisions(tournament.id, tournament.divisions)
    const created = seedCreateRegistration(createRegistrationCheckout())
    const { user } = renderSignUpPage('bjjeire')

    await screen.findAllByTestId(SignUpPageTestIds.DIVISION_OPTION)
    await user.click(screen.getByTestId(SignUpPageTestIds.SUBMIT))

    expect(
      await screen.findByTestId(SignUpPageTestIds.FORM_ERROR)
    ).toHaveTextContent(signUp.divisionRequired)
    expect(created.calls).toHaveLength(0)
  })

  // #5020, #5017, #5042
  it.each([
    'urn:bjjeire:tournament-full',
    'urn:bjjeire:already-registered',
    'urn:bjjeire:too-many-unpaid',
  ] as const)(
    'given the API refuses with %s, when the competitor continues, then they are told why and stay on the page',
    async type => {
      const tournament = bjjeire()
      seedTournament(tournament)
      seedEligibleDivisions(tournament.id, tournament.divisions)
      seedCreateRegistration({ problem: type })
      const { user } = renderSignUpPage('bjjeire')

      await user.click(await screen.findByRole('radio'))
      await user.click(screen.getByRole('checkbox', { name: signUp.acceptPublicListing }))
      await user.click(screen.getByRole('checkbox', { name: signUp.acceptTerms }))
      await user.click(screen.getByTestId(SignUpPageTestIds.SUBMIT))

      expect(
        await screen.findByTestId(SignUpPageTestIds.FORM_ERROR)
      ).toHaveTextContent(problems[type])
      expect(assign).not.toHaveBeenCalled()
    }
  )

  // #5019
  it('given a competitor under 18 on the tournament day, when the sign-up opens, then it explains they cannot enter and offers no division', async () => {
    const tournament = bjjeire()
    seedTournament(tournament)
    seedEligibleDivisionsProblem(tournament.id, 'urn:bjjeire:under-18')
    renderSignUpPage('bjjeire')

    expect(
      await screen.findByTestId(SignUpPageTestIds.UNDER_18)
    ).toHaveTextContent(signUp.underEighteen)
    expect(
      screen.queryByTestId(SignUpPageTestIds.SUBMIT)
    ).not.toBeInTheDocument()
  })

  // #5013: profile completion first.
  it('given an incomplete profile, when the sign-up opens, then it sends the competitor to complete the profile', async () => {
    const tournament = bjjeire()
    seedTournament(tournament)
    seedEligibleDivisionsProblem(tournament.id, 'urn:bjjeire:profile-incomplete')
    renderSignUpPage('bjjeire')

    const notice = await screen.findByTestId(
      SignUpPageTestIds.PROFILE_INCOMPLETE
    )
    expect(notice).toHaveTextContent(signUp.profileIncomplete)
    expect(
      within(notice).getByRole('link', { name: signUp.profileLink })
    ).toHaveAttribute('href', paths.accountProfile.getHref())
  })

  it('given no division matches the competitor, when the sign-up opens, then it says so', async () => {
    const tournament = bjjeire()
    seedTournament(tournament)
    seedEligibleDivisions(tournament.id, [])
    renderSignUpPage('bjjeire')

    expect(
      await screen.findByTestId(SignUpPageTestIds.NO_DIVISIONS)
    ).toHaveTextContent(signUp.noDivisions)
  })

  // #5003
  it('given registration is not open, when the sign-up page opens, then no division is offered', async () => {
    const tournament = bjjeire({ registrationState: 'CLOSED' })
    seedTournament(tournament)
    const eligible = seedEligibleDivisions(tournament.id, tournament.divisions)
    renderSignUpPage('bjjeire')

    expect(
      await screen.findByTestId(SignUpPageTestIds.NOT_OPEN)
    ).toHaveTextContent(signUp.notOpen)
    expect(eligible.calls).toHaveLength(0)
  })

  // #5016
  it('given the competitor came back from Checkout without paying, when the page opens, then it says nothing was charged and lets them return to the same payment', async () => {
    const tournament = bjjeire()
    seedTournament(tournament)
    seedEligibleDivisions(tournament.id, tournament.divisions)
    const resumed = seedResumeCheckout(
      'registration-9',
      createRegistrationCheckout({
        registrationId: 'registration-9',
        checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_9',
      })
    )
    const { user } = renderSignUpPage('bjjeire', 'registration-9')

    expect(
      await screen.findByTestId(SignUpPageTestIds.ABANDONED)
    ).toHaveTextContent(signUp.abandoned)
    await user.click(screen.getByTestId(SignUpPageTestIds.RESUME))

    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith(
        'https://checkout.stripe.com/c/pay/cs_test_9'
      )
    )
    expect(resumed.calls).toHaveLength(1)
  })

  // #5016
  it('given the held place has lapsed, when the competitor tries to return to payment, then they are told to start again', async () => {
    const tournament = bjjeire()
    seedTournament(tournament)
    seedEligibleDivisions(tournament.id, tournament.divisions)
    seedResumeCheckout('registration-9', { problem: 'urn:bjjeire:hold-expired' })
    const { user } = renderSignUpPage('bjjeire', 'registration-9')

    await user.click(await screen.findByTestId(SignUpPageTestIds.RESUME))

    expect(
      await screen.findByTestId(SignUpPageTestIds.ABANDONED)
    ).toHaveTextContent(problems['urn:bjjeire:hold-expired'])
    expect(assign).not.toHaveBeenCalled()
  })

  it('given the API answers with an address that is not Stripe Checkout, when the sign-up starts, then the competitor is not sent there', async () => {
    const tournament = bjjeire()
    seedTournament(tournament)
    seedEligibleDivisions(tournament.id, tournament.divisions)
    seedCreateRegistration(
      createRegistrationCheckout({ checkoutUrl: 'https://evil.test/pay' })
    )
    const { user } = renderSignUpPage('bjjeire')

    await user.click(await screen.findByRole('radio'))
    await user.click(screen.getByRole('checkbox', { name: signUp.acceptPublicListing }))
    await user.click(screen.getByRole('checkbox', { name: signUp.acceptTerms }))
    await user.click(screen.getByTestId(SignUpPageTestIds.SUBMIT))

    expect(
      await screen.findByTestId(SignUpPageTestIds.FORM_ERROR)
    ).toHaveTextContent(problems.fallback)
    expect(assign).not.toHaveBeenCalled()
  })

  // #5020
  it('given the tournament is full, when the sign-up page opens, then the competitor is told it is full and offered no division', async () => {
    const tournament = bjjeire({ registrationState: 'FULL' })
    seedTournament(tournament)
    const eligible = seedEligibleDivisions(tournament.id, tournament.divisions)
    renderSignUpPage('bjjeire')

    expect(
      await screen.findByTestId(SignUpPageTestIds.NOT_OPEN)
    ).toHaveTextContent(problems['urn:bjjeire:tournament-full'])
    expect(eligible.calls).toHaveLength(0)
  })
})
