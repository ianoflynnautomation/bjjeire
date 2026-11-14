import { screen, waitFor, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TournamentPageTestIds } from '@/constants/tournamentDataTestIds'
import {
  createDivision,
  createTournament,
} from '@/testing/factories/tournament.factory'
import {
  renderTournamentPage,
  seedTournament,
  seedTournamentStatus,
} from '@/features/tournaments/testing/tournaments-test-helpers'
import type { TournamentDto } from '@/types/tournaments'

function bjjeire(overrides: Partial<TournamentDto> = {}): TournamentDto {
  return createTournament({
    slug: 'bjjeire',
    name: 'BjjEire',
    description: 'The first in-house tournament.',
    date: '2026-06-27',
    venue: { venue: 'National Arena', address: '1 Main Street, Dublin' },
    entryFeeCents: 2500,
    registrationOpensAt: '2026-06-01T09:00:00Z',
    registrationClosesAt: '2026-06-20T20:00:00Z',
    ...overrides,
  })
}

function expectNoSignUpControl(): void {
  expect(
    screen.queryByRole('link', { name: /sign up|register|enter/i })
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: /sign up|register|enter/i })
  ).not.toBeInTheDocument()
}

describe('TournamentPage Integration (API + Query + UI)', () => {
  // #5002
  it('given a published tournament, when a visitor opens its page, then they see its details, fee, registration window and divisions', async () => {
    seedTournament(
      bjjeire({
        divisions: [
          createDivision({ belt: 'WHITE', weightClass: '-76 kg' }),
          createDivision({ belt: 'BLUE', weightClass: '-82.3 kg' }),
          createDivision({
            discipline: 'NO_GI',
            gender: 'FEMALE',
            ageCategory: 'MASTER_1',
            belt: 'PURPLE',
            weightClass: '-64 kg',
          }),
        ],
      })
    )
    renderTournamentPage('bjjeire')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'BjjEire' })
    ).toBeInTheDocument()
    expect(screen.getByTestId(TournamentPageTestIds.DATE)).toHaveTextContent(
      '27 June 2026'
    )
    expect(screen.getByTestId(TournamentPageTestIds.VENUE)).toHaveTextContent(
      'National Arena'
    )
    expect(screen.getByTestId(TournamentPageTestIds.VENUE)).toHaveTextContent(
      '1 Main Street, Dublin'
    )
    expect(screen.getByTestId(TournamentPageTestIds.FEE)).toHaveTextContent(
      '€25.00'
    )
    // Shown as the clock reads in Ireland, whatever the visitor's time zone.
    expect(screen.getByTestId(TournamentPageTestIds.WINDOW)).toHaveTextContent(
      '1 June 2026, 10:00 to 20 June 2026, 21:00'
    )
    expect(screen.getByTestId(TournamentPageTestIds.WINDOW)).toHaveTextContent(
      'Irish time'
    )
    expect(
      screen.getByText('The first in-house tournament.')
    ).toBeInTheDocument()

    const groups = screen.getAllByTestId(TournamentPageTestIds.DIVISION_GROUP)
    expect(groups).toHaveLength(2)
    const giMale = within(groups[0])
    expect(
      giMale.getByRole('heading', { name: 'Gi · Male' })
    ).toBeInTheDocument()
    const rows = giMale.getAllByTestId(TournamentPageTestIds.DIVISION_ROW)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('Adult')
    expect(rows[0]).toHaveTextContent('White')
    expect(rows[0]).toHaveTextContent('-76 kg')
    expect(rows[1]).toHaveTextContent('Blue')
    expect(
      within(groups[1]).getByRole('heading', { name: 'No-Gi · Female' })
    ).toBeInTheDocument()
    expect(groups[1]).toHaveTextContent('Master 1')
    await waitFor(() => expect(document.title).toBe('BjjEire | BJJ Éire'))
  })

  // #5003
  it('given registration has not opened, when a visitor opens the page, then it states when registration opens and offers no sign-up', async () => {
    seedTournament(bjjeire({ registrationState: 'NOT_OPEN' }))
    renderTournamentPage('bjjeire')

    expect(
      await screen.findByTestId(TournamentPageTestIds.REGISTRATION_MESSAGE)
    ).toHaveTextContent('Registration opens on 1 June 2026, 10:00.')
    expectNoSignUpControl()
  })

  // #5003
  it('given registration has closed, when a visitor opens the page, then it states that registration is closed and offers no sign-up', async () => {
    seedTournament(bjjeire({ registrationState: 'CLOSED' }))
    renderTournamentPage('bjjeire')

    expect(
      await screen.findByTestId(TournamentPageTestIds.REGISTRATION_MESSAGE)
    ).toHaveTextContent('Registration is closed.')
    expectNoSignUpControl()
  })

  it('given a tournament with a competitor limit, when the page renders, then the places taken are shown', async () => {
    seedTournament(
      bjjeire({
        competitorLimit: 200,
        placesTaken: 200,
        registrationState: 'FULL',
      })
    )
    renderTournamentPage('bjjeire')

    expect(
      await screen.findByTestId(TournamentPageTestIds.PLACES)
    ).toHaveTextContent('200 of 200 taken')
    expect(
      screen.getByTestId(TournamentPageTestIds.REGISTRATION_MESSAGE)
    ).toHaveTextContent('This tournament is full.')
  })

  it('given a tournament with no limit, when the page renders, then no places line is shown', async () => {
    seedTournament(bjjeire())
    renderTournamentPage('bjjeire')

    await screen.findByRole('heading', { level: 1, name: 'BjjEire' })
    expect(
      screen.queryByTestId(TournamentPageTestIds.PLACES)
    ).not.toBeInTheDocument()
  })

  it('given a cancelled tournament, when the page renders, then it says so', async () => {
    seedTournament(
      bjjeire({ status: 'CANCELLED', registrationState: 'CLOSED' })
    )
    renderTournamentPage('bjjeire')

    expect(
      await screen.findByTestId(TournamentPageTestIds.REGISTRATION_MESSAGE)
    ).toHaveTextContent('This tournament has been cancelled.')
  })

  // #5001: a draft answers 404, so a visitor sees the same as for an unknown address.
  it('given no public tournament has the slug, when a visitor opens the page, then they are told it was not found and linked to the list', async () => {
    seedTournamentStatus('hidden-draft', 404)
    renderTournamentPage('hidden-draft')

    expect(
      await screen.findByRole('heading', { name: 'Tournament Not Found' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'See all tournaments' })
    ).toHaveAttribute('href', '/tournaments')
  })

  it('given the API fails, when a visitor opens the page, then a retry is offered', async () => {
    seedTournamentStatus('bjjeire', 500)
    renderTournamentPage('bjjeire')

    expect(
      await screen.findByRole('button', { name: /retry/i })
    ).toBeInTheDocument()
  })

  it('given a tournament with no divisions listed, when the page renders, then it says they are not announced', async () => {
    seedTournament(bjjeire({ divisions: [] }))
    renderTournamentPage('bjjeire')

    expect(
      await screen.findByText('Divisions have not been announced yet.')
    ).toBeInTheDocument()
  })
})
