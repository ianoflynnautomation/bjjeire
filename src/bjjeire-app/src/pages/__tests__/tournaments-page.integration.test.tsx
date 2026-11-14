import { screen, waitFor, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TournamentCardTestIds } from '@/constants/tournamentDataTestIds'
import { createTournamentSummary } from '@/testing/factories/tournament.factory'
import {
  renderTournamentsPage,
  seedTournaments,
  seedTournamentsError,
  seedTournamentsPending,
} from '@/features/tournaments/testing/tournaments-test-helpers'

describe('TournamentsPage Integration (API + Query + UI)', () => {
  it('given a pending API request, when the page renders, then a loading indicator is shown', () => {
    seedTournamentsPending()
    renderTournamentsPage()

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('given a failing API, when the page renders, then a retry button is shown', async () => {
    seedTournamentsError()
    renderTournamentsPage()

    expect(
      await screen.findByRole('button', { name: /retry/i })
    ).toBeInTheDocument()
  })

  it('given the API returns no tournaments, when the page renders, then the empty state is shown', async () => {
    seedTournaments([])
    renderTournamentsPage()

    expect(await screen.findByText('No Tournaments Yet')).toBeInTheDocument()
  })

  it('given the page opens, when it renders, then Tournaments is the main heading and the tab is named', async () => {
    seedTournaments([])
    renderTournamentsPage()

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Tournaments' })
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(document.title).toBe('BJJ Tournaments | BJJ Éire')
    )
  })

  // #5002
  it('given published tournaments, when the page renders, then each shows its name, day, venue, fee and a link to its page', async () => {
    seedTournaments([
      createTournamentSummary({
        slug: 'bjjeire',
        name: 'BjjEire',
        date: '2026-06-27',
        entryFeeCents: 2500,
        divisionCount: 12,
        registrationState: 'OPEN',
      }),
      createTournamentSummary({ name: 'Winter Open', divisionCount: 1 }),
    ])
    renderTournamentsPage()

    const card = (await screen.findByText('BjjEire')).closest('article')
    if (card === null) {
      throw new Error('The BjjEire card is not rendered as an article.')
    }
    const inCard = within(card)
    expect(inCard.getByTestId(TournamentCardTestIds.DATE)).toHaveTextContent(
      '27 June 2026'
    )
    expect(inCard.getByTestId(TournamentCardTestIds.VENUE)).toHaveTextContent(
      'National Arena'
    )
    expect(inCard.getByTestId(TournamentCardTestIds.FEE)).toHaveTextContent(
      '€25.00'
    )
    expect(
      inCard.getByTestId(TournamentCardTestIds.DIVISION_COUNT)
    ).toHaveTextContent('12 divisions')
    expect(inCard.getByTestId(TournamentCardTestIds.STATE)).toHaveTextContent(
      'Open'
    )
    expect(
      inCard.getByRole('link', { name: /view tournament.*bjjeire/i })
    ).toHaveAttribute('href', '/tournaments/bjjeire')

    expect(screen.getByText('Winter Open')).toBeInTheDocument()
    expect(screen.getByText('1 division')).toBeInTheDocument()
    expect(screen.getByText('Found 2 tournaments.')).toBeInTheDocument()
  })

  it('given loaded tournaments, when the visitor searches by name, then only matches remain', async () => {
    seedTournaments([
      createTournamentSummary({ name: 'BjjEire' }),
      createTournamentSummary({ name: 'Winter Open' }),
    ])
    const { user } = renderTournamentsPage()
    await screen.findByText('BjjEire')

    await user.type(screen.getByRole('searchbox'), 'winter')

    await waitFor(() =>
      expect(screen.queryByText('BjjEire')).not.toBeInTheDocument()
    )
    expect(screen.getByText('Winter Open')).toBeInTheDocument()
  })
})
