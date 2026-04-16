import { screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '@/testing/msw/server'
import { createCompetition } from '@/testing/factories/competition.factory'
import {
  renderCompetitionsPage,
  seedCompetitions,
  seedCompetitionsError,
  seedCompetitionsPending,
} from '@/features/competitions/testing/competitions-test-helpers'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())

describe('CompetitionsPage Integration (API + Query + UI)', () => {
  it('shows loading state while data is being fetched', () => {
    seedCompetitionsPending()
    renderCompetitionsPage()

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows error state and retry button when the API fails', async () => {
    seedCompetitionsError()
    renderCompetitionsPage()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    )
  })

  it('renders competition cards when data is returned', async () => {
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

  it('filters competitions by search term', async () => {
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

  it('shows empty state when no competitions are returned', async () => {
    seedCompetitions([])
    renderCompetitionsPage()

    await waitFor(() =>
      expect(screen.getByText(/no competitions found/i)).toBeInTheDocument()
    )
  })
})
