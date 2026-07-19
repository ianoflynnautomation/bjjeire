import { screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { createGym, createPaginatedGyms } from '@/testing/factories/gym.factory'
import {
  renderGymsPage,
  seedGyms,
  seedGymsByCounty,
  seedGymsError,
  seedGymsPaged,
  seedGymsPending,
} from '@/features/gyms/testing/gyms-test-helpers'

describe('GymsPage Integration (API + Query + UI)', () => {
  it('given a pending API request, when the page renders, then a loading indicator is shown', () => {
    seedGymsPending()
    renderGymsPage()

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('given a failing API, when the page renders, then an error alert with a retry button is shown', async () => {
    seedGymsError()
    renderGymsPage()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('given the API returns no gyms, when the page renders, then the empty state is shown', async () => {
    seedGyms([])
    renderGymsPage()

    expect(await screen.findByText('No Gyms Found')).toBeInTheDocument()
  })

  it('given the API returns gyms, when the page renders, then a card is shown for each gym', async () => {
    seedGyms([
      createGym({ name: 'Elite Fighters Academy', county: 'Dublin' }),
      createGym({ name: 'Community BJJ Club', county: 'Cork' }),
    ])
    renderGymsPage()

    expect(
      await screen.findByText('Elite Fighters Academy')
    ).toBeInTheDocument()
    expect(screen.getByText('Community BJJ Club')).toBeInTheDocument()
  })

  it('given a loaded page, when the user selects a county filter, then only that county is fetched and shown', async () => {
    const dublinGym = createGym({
      name: 'Elite Fighters Academy',
      county: 'Dublin',
    })
    const corkGym = createGym({ name: 'Community BJJ Club', county: 'Cork' })

    const { getLastUrl } = seedGymsByCounty({ Dublin: [dublinGym] }, [
      dublinGym,
      corkGym,
    ])

    const { user } = renderGymsPage()

    expect(
      await screen.findByText('Elite Fighters Academy')
    ).toBeInTheDocument()
    expect(screen.getByText('Community BJJ Club')).toBeInTheDocument()
    expect(screen.getByText('Found 2 gyms.')).toBeInTheDocument()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /select county/i }),
      'Dublin'
    )

    expect(
      await screen.findByRole('heading', { name: /bjj gyms in dublin/i })
    ).toBeInTheDocument()
    expect(screen.getByText('Found 1 gym.')).toBeInTheDocument()
    expect(screen.getByText('Elite Fighters Academy')).toBeInTheDocument()
    expect(screen.queryByText('Community BJJ Club')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(getLastUrl()?.searchParams.get('county')).toBe('Dublin')
      expect(getLastUrl()?.searchParams.get('page')).toBe('1')
    })
  })

  it('given multiple result pages, when the user clicks next page, then the next page is fetched and shown', async () => {
    const gymPage1 = createGym({ name: 'Elite Fighters Academy' })
    const gymPage2 = createGym({ name: 'Community BJJ Club' })

    const { getLastUrl } = seedGymsPaged({
      1: createPaginatedGyms([gymPage1], 1, 2),
      2: createPaginatedGyms([gymPage2], 2, 2),
    })

    const { user } = renderGymsPage()

    expect(
      await screen.findByText('Elite Fighters Academy')
    ).toBeInTheDocument()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /next page/i }))

    expect(await screen.findByText('Community BJJ Club')).toBeInTheDocument()
    expect(screen.getByText('2 / 2')).toBeInTheDocument()

    await waitFor(() => {
      expect(getLastUrl()?.searchParams.get('page')).toBe('2')
    })
  })
})
