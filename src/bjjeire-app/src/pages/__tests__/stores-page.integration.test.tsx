import { screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
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

describe('StoresPage Integration (API + Query + UI)', () => {
  it('given a pending API request, when the page renders, then a loading indicator is shown', () => {
    seedStoresPending()
    renderStoresPage()

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('given a failing API, when the page renders, then a retry button is shown', async () => {
    seedStoresError()
    renderStoresPage()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    )
  })

  it('given the API returns no stores, when the page renders, then the empty state is shown', async () => {
    seedStores([])
    renderStoresPage()

    expect(await screen.findByText('No Stores Found')).toBeInTheDocument()
  })

  it('given the API returns stores, when the page renders, then a card is shown for each store', async () => {
    seedStores([
      createStore({ name: 'Tatami Fightwear' }),
      createStore({ name: 'Scramble Brand' }),
    ])
    renderStoresPage()

    expect(await screen.findByText('Tatami Fightwear')).toBeInTheDocument()
    expect(screen.getByText('Scramble Brand')).toBeInTheDocument()
  })

  it('given loaded stores, when the user types a search term, then only matching stores remain visible', async () => {
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

  it('given a word only in a store description, when the user searches it, then no stores match', async () => {
    seedStores([
      createStore({ name: 'Tatami Fightwear', description: 'Premium gis' }),
    ])
    const { user } = renderStoresPage()

    await screen.findByText('Tatami Fightwear')

    await user.type(screen.getByRole('searchbox'), 'Premium')

    await waitFor(() =>
      expect(screen.getByText('No Results Found')).toBeInTheDocument()
    )
  })

  it('given multiple result pages, when the user clicks next page, then the next page is fetched and shown', async () => {
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

  it('given the page opens, when it renders, then the store title is the main heading', async () => {
    seedStores([createStore({ name: 'Tatami Fightwear' })])
    renderStoresPage()

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'BJJ Clothing Stores',
      })
    ).toBeInTheDocument()
  })

  it('given a search with no match, when the message shows, then it does not mention filters', async () => {
    seedStores([createStore({ name: 'Tatami Fightwear' })])
    const { user } = renderStoresPage()
    await screen.findByText('Tatami Fightwear')

    await user.type(screen.getByRole('searchbox'), 'zzz')

    await waitFor(() =>
      expect(screen.getByText('No Results Found')).toBeInTheDocument()
    )
    expect(screen.queryByText(/filters/i)).not.toBeInTheDocument()
  })

  it('given a name with an accent, when the visitor searches without it, then the store matches', async () => {
    seedStores([
      createStore({ name: 'Brú Fightwear' }),
      createStore({ name: 'Tatami Fightwear' }),
    ])
    const { user } = renderStoresPage()
    await screen.findByText('Brú Fightwear')

    await user.type(screen.getByRole('searchbox'), 'Bru')

    await waitFor(() =>
      expect(screen.queryByText('Tatami Fightwear')).not.toBeInTheDocument()
    )
    expect(screen.getByText('Brú Fightwear')).toBeInTheDocument()
  })
})
