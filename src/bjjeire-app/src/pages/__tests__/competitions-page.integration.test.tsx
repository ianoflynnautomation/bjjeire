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

  it('given the page opens, when it renders, then the competition title is the main heading', async () => {
    seedCompetitions([])
    renderCompetitionsPage()

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'BJJ Competitions',
      })
    ).toBeInTheDocument()
  })

  it('given several competitions, when the page renders, then the count names competitions', async () => {
    seedCompetitions([
      createCompetition({ name: 'Grappling Open' }),
      createCompetition({ name: 'NAGA Ireland' }),
    ])
    renderCompetitionsPage()

    expect(await screen.findByText('Found 2 competitions.')).toBeInTheDocument()
  })

  it.each(['Letterkenny', 'Donegal BJJ', 'Portugal', 'submission-only'])(
    'given "%s" appears only outside a competition name, when the user searches it, then no competitions match',
    async term => {
      seedCompetitions([
        createCompetition({
          name: 'Winter Classic',
          description: 'Held in Letterkenny.',
          organisation: 'Donegal BJJ',
          country: 'Portugal',
          tags: ['submission-only'],
        }),
      ])
      const { user } = renderCompetitionsPage()
      await screen.findByText('Winter Classic')

      await user.type(screen.getByRole('searchbox'), term)

      await waitFor(() =>
        expect(screen.getByText('No Results Found')).toBeInTheDocument()
      )
    }
  )

  it('given a search with no match, when the message shows, then it does not mention filters', async () => {
    seedCompetitions([createCompetition({ name: 'Grappling Open' })])
    const { user } = renderCompetitionsPage()
    await screen.findByText('Grappling Open')

    await user.type(screen.getByRole('searchbox'), 'zzz')

    await waitFor(() =>
      expect(screen.getByText('No Results Found')).toBeInTheDocument()
    )
    expect(screen.queryByText(/filters/i)).not.toBeInTheDocument()
  })
})
