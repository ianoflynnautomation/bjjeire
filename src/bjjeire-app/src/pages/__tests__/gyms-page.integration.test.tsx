import { screen, waitFor } from '@testing-library/react'
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from 'vitest'
import { server } from '@/testing/msw/server'
import { createGym, createPaginatedGyms } from '@/testing/factories/gym.factory'
import {
  renderGymsPage,
  seedGyms,
  seedGymsByCounty,
  seedGymsError,
  seedGymsPaged,
  seedGymsPending,
} from '@/features/gyms/testing/gyms-test-helpers'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())

describe('GymsPage Integration (API + Query + UI)', () => {
  it('shows loading state while data is being fetched', () => {
    seedGymsPending()
    renderGymsPage()

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows error state and retry button when the API fails', async () => {
    seedGymsError()
    renderGymsPage()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('shows empty state when no gyms are returned', async () => {
    seedGyms([])
    renderGymsPage()

    expect(await screen.findByText('No Gyms Found')).toBeInTheDocument()
  })

  it('renders gym cards when data loads successfully', async () => {
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

  it('sends the county param when a county filter is selected', async () => {
    const dublinGym = createGym({
      name: 'Elite Fighters Academy',
      county: 'Dublin',
    })
    const corkGym = createGym({ name: 'Community BJJ Club', county: 'Cork' })

    const { getLastUrl } = seedGymsByCounty(
      { Dublin: [dublinGym] },
      [dublinGym, corkGym]
    )

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

  it('fetches the next page when the user uses pagination controls', async () => {
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
