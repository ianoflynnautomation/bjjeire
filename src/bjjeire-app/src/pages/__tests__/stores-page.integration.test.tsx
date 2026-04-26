import { screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '@/testing/msw/server'
import {
  createStore,
  createPaginatedStores,
} from '@/testing/factories/store.factory'
import {
  renderStoresPage,
  seedStores,
  seedStoresError,
  seedStoresPending,
  seedStoresPaged,
} from '@/features/stores/testing/stores-test-helpers'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())

describe('StoresPage Integration (API + Query + UI)', () => {
  it('shows loading state while data is being fetched', () => {
    seedStoresPending()
    renderStoresPage()

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows error state and retry button when the API fails', async () => {
    seedStoresError()
    renderStoresPage()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    )
  })

  it('shows empty state when no stores are returned', async () => {
    seedStores([])
    renderStoresPage()

    expect(await screen.findByText('No Stores Found')).toBeInTheDocument()
  })

  it('renders store cards when data loads successfully', async () => {
    seedStores([
      createStore({ name: 'Tatami Fightwear' }),
      createStore({ name: 'Scramble Brand' }),
    ])
    renderStoresPage()

    expect(await screen.findByText('Tatami Fightwear')).toBeInTheDocument()
    expect(screen.getByText('Scramble Brand')).toBeInTheDocument()
  })

  it('filters stores by search term', async () => {
    seedStores([
      createStore({ name: 'Tatami Fightwear', description: 'Premium gis' }),
      createStore({ name: 'Scramble Brand', description: 'Casual apparel' }),
    ])
    const { user } = renderStoresPage()

    await screen.findByText('Tatami Fightwear')

    const searchInput = screen.getByRole('searchbox')
    await user.type(searchInput, 'Scramble')

    await waitFor(() =>
      expect(screen.queryByText('Tatami Fightwear')).not.toBeInTheDocument()
    )
    expect(screen.getByText('Scramble Brand')).toBeInTheDocument()
  })

  it('fetches the next page when the user uses pagination controls', async () => {
    const storePage1 = createStore({ name: 'Tatami Fightwear' })
    const storePage2 = createStore({ name: 'Scramble Brand' })

    const { getLastUrl } = seedStoresPaged({
      1: createPaginatedStores([storePage1], 1, 2),
      2: createPaginatedStores([storePage2], 2, 2),
    })

    const { user } = renderStoresPage()

    expect(await screen.findByText('Tatami Fightwear')).toBeInTheDocument()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /next page/i }))

    expect(await screen.findByText('Scramble Brand')).toBeInTheDocument()
    expect(screen.getByText('2 / 2')).toBeInTheDocument()

    await waitFor(() => {
      expect(getLastUrl()?.searchParams.get('page')).toBe('2')
    })
  })
})
