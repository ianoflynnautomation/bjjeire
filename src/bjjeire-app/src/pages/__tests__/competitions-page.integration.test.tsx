import { screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { createCompetition } from '@/testing/factories/competition.factory'
import {
  renderCompetitionsPage,
  seedCompetitions,
  seedCompetitionsError,
  seedCompetitionsPending,
} from '@/features/competitions/testing/competitions-test-helpers'

describe('CompetitionsPage Integration (API + Query + UI)', () => {
  it('given a pending API request, when the page renders, then a loading indicator is shown', () => {
    seedCompetitionsPending()
    renderCompetitionsPage()

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('given a failing API, when the page renders, then a retry button is shown', async () => {
    seedCompetitionsError()
    renderCompetitionsPage()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    )
  })

  it('given the API returns competitions, when the page renders, then a card is shown for each competition', async () => {
    seedCompetitions([
      createCompetition({ name: 'Dublin International Open IBJJF' }),
      createCompetition({ name: 'NAGA Ireland' }),
    ])
    renderCompetitionsPage()

    expect(
      await screen.findByText('Dublin International Open IBJJF')
    ).toBeInTheDocument()
    expect(screen.getByText('NAGA Ireland')).toBeInTheDocument()
  })

  it('given loaded competitions, when the user types a search term, then only matching competitions remain visible', async () => {
    seedCompetitions([
      createCompetition({
        name: 'Dublin International Open IBJJF',
        organisation: 'IBJJF',
      }),
      createCompetition({ name: 'NAGA Ireland', organisation: 'NAGA' }),
    ])
    const { user } = renderCompetitionsPage()

    await screen.findByText('Dublin International Open IBJJF')

    const searchInput = screen.getByRole('searchbox')
    await user.type(searchInput, 'NAGA')

    await waitFor(() =>
      expect(
        screen.queryByText('Dublin International Open IBJJF')
      ).not.toBeInTheDocument()
    )
    expect(screen.getByText('NAGA Ireland')).toBeInTheDocument()
  })

  it('given the API returns no competitions, when the page renders, then the empty state is shown', async () => {
    seedCompetitions([])
    renderCompetitionsPage()

    await waitFor(() =>
      expect(screen.getByText(/no competitions found/i)).toBeInTheDocument()
    )
  })
})
