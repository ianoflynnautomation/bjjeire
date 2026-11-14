import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { uiContent } from '@/config/ui-content'
import { TournamentAdminTestIds } from '@/constants/tournamentDataTestIds'
import {
  createTournament,
  createTournamentSummary,
} from '@/testing/factories/tournament.factory'
import {
  ADMIN_EDIT_PROBE,
  renderAdminTournamentsPage,
  seedAdminTournaments,
  seedCreate,
} from '@/features/tournament-admin/testing/tournament-admin-test-helpers'

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

const { form, signIn, validation } = uiContent.tournamentAdmin

function signedIn(): void {
  mockMsal.getAllAccounts.mockReturnValue([{ username: 'owner@bjjeire.test' }])
}

beforeEach(() => {
  mockMsal.getAllAccounts.mockReturnValue([])
  mockMsal.loginPopup.mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('AdminTournamentsPage', () => {
  // #5004: the screens ask for the organiser's sign-in and load nothing without it.
  it('given nobody is signed in, when the page opens, then it asks for the organiser sign-in and requests no tournaments', async () => {
    const list = seedAdminTournaments([createTournamentSummary()])
    renderAdminTournamentsPage()

    expect(
      await screen.findByRole('heading', { name: signIn.heading })
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId(TournamentAdminTestIds.FORM)
    ).not.toBeInTheDocument()
    expect(list.calls).toHaveLength(0)
  })

  it('given nobody is signed in, when the organiser signs in, then every tournament is listed with its status, drafts included', async () => {
    const list = seedAdminTournaments([
      createTournamentSummary({
        id: 'draft-id',
        name: 'BjjEire',
        status: 'DRAFT',
      }),
      createTournamentSummary({ name: 'Winter Open', status: 'PUBLISHED' }),
    ])
    mockMsal.loginPopup.mockImplementation(() => {
      signedIn()
      return Promise.resolve({})
    })
    const { user } = renderAdminTournamentsPage()

    await user.click(await screen.findByRole('button', { name: signIn.button }))

    const items = await screen.findAllByTestId(TournamentAdminTestIds.LIST_ITEM)
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('BjjEire')
    expect(
      within(items[0]).getByTestId(TournamentAdminTestIds.LIST_ITEM_STATUS)
    ).toHaveTextContent('Draft')
    expect(
      within(items[0]).getByRole('link', { name: /edit.*bjjeire/i })
    ).toHaveAttribute('href', '/admin/tournaments/draft-id')
    expect(items[1]).toHaveTextContent('Published')
    expect(mockMsal.loginPopup).toHaveBeenCalledWith({
      scopes: ['access_as_writer'],
    })
    expect(list.authorization).toEqual(['Bearer organiser-token'])
  })

  it('given the sign-in window is closed without signing in, when it fails, then the organiser is told and can retry', async () => {
    mockMsal.loginPopup.mockRejectedValue(new Error('user_cancelled'))
    const { user } = renderAdminTournamentsPage()

    await user.click(await screen.findByRole('button', { name: signIn.button }))

    expect(await screen.findByRole('alert')).toHaveTextContent(signIn.failed)
    expect(screen.getByRole('button', { name: signIn.button })).toBeEnabled()
  })

  it('given a signed-in organiser, when they submit an empty form, then each missing field is named and nothing is sent', async () => {
    signedIn()
    seedAdminTournaments([])
    const created = seedCreate(() => createTournament())
    const { user } = renderAdminTournamentsPage()

    await user.click(
      await screen.findByRole('button', {
        name: uiContent.tournamentAdmin.create.submit,
      })
    )

    expect(await screen.findByText(validation.nameRequired)).toBeInTheDocument()
    expect(screen.getByText(validation.slugRequired)).toBeInTheDocument()
    expect(screen.getByText(validation.dateRequired)).toBeInTheDocument()
    expect(screen.getByText(validation.venueNameRequired)).toBeInTheDocument()
    expect(screen.getByText(validation.feeInvalid)).toBeInTheDocument()
    expect(screen.getByText(validation.opensAtRequired)).toBeInTheDocument()
    expect(screen.getByText(validation.closesAtRequired)).toBeInTheDocument()
    expect(screen.getByLabelText(form.name)).toHaveAccessibleDescription(
      validation.nameRequired
    )
    expect(screen.getByLabelText(form.name)).toBeInvalid()
    expect(created.calls).toHaveLength(0)
  })

  // #5001
  it('given a signed-in organiser, when they save a tournament with name, date, venue, fee, window and a division, then it is sent as cents and UTC instants and they land on its edit page', async () => {
    signedIn()
    seedAdminTournaments([])
    const created = seedCreate(command =>
      createTournament({ ...command, id: 'new-id', status: 'DRAFT' })
    )
    const { user } = renderAdminTournamentsPage()

    await user.type(await screen.findByLabelText(form.name), 'BjjEire')
    await user.type(screen.getByLabelText(form.slug), 'bjjeire')
    await user.type(screen.getByLabelText(form.date), '2026-06-27')
    await user.type(screen.getByLabelText(form.venueName), 'National Arena')
    await user.type(screen.getByLabelText(form.venueAddress), '1 Main Street')
    await user.type(screen.getByLabelText(form.entryFee), '25')
    await user.type(screen.getByLabelText(form.opensAt), '2026-06-01T10:00')
    await user.type(screen.getByLabelText(form.closesAt), '2026-06-20T21:00')
    await user.click(screen.getByRole('checkbox', { name: 'Gi' }))
    await user.click(screen.getByRole('checkbox', { name: 'Male' }))
    await user.click(screen.getByRole('checkbox', { name: 'Adult' }))
    await user.click(screen.getByRole('checkbox', { name: 'White' }))
    await user.type(
      screen.getByLabelText(uiContent.tournamentAdmin.divisions.weightClasses),
      '-76 kg'
    )
    await user.click(screen.getByTestId(TournamentAdminTestIds.GENERATE))
    await user.click(
      screen.getByRole('button', {
        name: uiContent.tournamentAdmin.create.submit,
      })
    )

    expect(await screen.findByTestId(ADMIN_EDIT_PROBE)).toBeInTheDocument()
    expect(created.calls).toEqual([
      {
        slug: 'bjjeire',
        name: 'BjjEire',
        description: null,
        date: '2026-06-27',
        venue: { venue: 'National Arena', address: '1 Main Street' },
        entryFeeCents: 2500,
        registrationOpensAt: '2026-06-01T09:00:00.000Z',
        registrationClosesAt: '2026-06-20T20:00:00.000Z',
        competitorLimit: null,
        divisions: [
          {
            discipline: 'GI',
            gender: 'MALE',
            ageCategory: 'ADULT',
            belt: 'WHITE',
            weightClass: '-76 kg',
          },
        ],
      },
    ])
    expect(created.authorization).toEqual(['Bearer organiser-token'])
  })

  it('given the API refuses the slug, when the organiser saves, then the reason is shown and they stay on the form', async () => {
    signedIn()
    seedAdminTournaments([])
    const { server } = await import('@/testing/msw/server')
    const { http, HttpResponse } = await import('msw')
    const { TOURNAMENTS_API } =
      await import('@/features/tournament-admin/testing/tournament-admin-test-helpers')
    server.use(
      http.post(TOURNAMENTS_API, () =>
        HttpResponse.json(
          {
            type: 'urn:bjjeire:conflict',
            detail: 'Another tournament already uses this slug.',
          },
          { status: 409 }
        )
      )
    )
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { user } = renderAdminTournamentsPage()

    await user.type(await screen.findByLabelText(form.name), 'BjjEire')
    await user.type(screen.getByLabelText(form.slug), 'bjjeire')
    await user.type(screen.getByLabelText(form.date), '2026-06-27')
    await user.type(screen.getByLabelText(form.venueName), 'National Arena')
    await user.type(screen.getByLabelText(form.entryFee), '25')
    await user.type(screen.getByLabelText(form.opensAt), '2026-06-01T10:00')
    await user.type(screen.getByLabelText(form.closesAt), '2026-06-20T21:00')
    await user.click(
      screen.getByRole('button', {
        name: uiContent.tournamentAdmin.create.submit,
      })
    )

    await waitFor(() =>
      expect(
        screen.getByTestId(TournamentAdminTestIds.FORM_ERROR)
      ).toHaveTextContent('Another tournament already uses this slug.')
    )
    expect(screen.queryByTestId(ADMIN_EDIT_PROBE)).not.toBeInTheDocument()
  })
})
