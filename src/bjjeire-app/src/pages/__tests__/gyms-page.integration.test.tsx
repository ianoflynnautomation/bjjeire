import { screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ClassCategory } from '@/types/gyms'
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

  it('given loaded gyms, when the user types a search term, then only matching gyms remain visible', async () => {
    seedGyms([
      createGym({ name: 'Elite Fighters Academy', county: 'Dublin' }),
      createGym({ name: 'Community BJJ Club', county: 'Cork' }),
    ])
    const { user } = renderGymsPage()

    await screen.findByText('Elite Fighters Academy')

    await user.type(screen.getByRole('searchbox'), 'Community')

    await waitFor(() =>
      expect(
        screen.queryByText('Elite Fighters Academy')
      ).not.toBeInTheDocument()
    )
    expect(screen.getByText('Community BJJ Club')).toBeInTheDocument()
  })

  it('given an active search, when the visitor clears it, then gyms from the full listing are displayed again', async () => {
    seedGyms([
      createGym({ name: 'Elite Fighters Academy', county: 'Dublin' }),
      createGym({ name: 'Community BJJ Club', county: 'Cork' }),
    ])
    const { user } = renderGymsPage()

    await screen.findByText('Elite Fighters Academy')
    await user.type(screen.getByRole('searchbox'), 'Community')
    await waitFor(() =>
      expect(
        screen.queryByText('Elite Fighters Academy')
      ).not.toBeInTheDocument()
    )

    await user.click(screen.getByRole('button', { name: /clear search/i }))

    expect(
      await screen.findByText('Elite Fighters Academy')
    ).toBeInTheDocument()
    expect(screen.getByText('Community BJJ Club')).toBeInTheDocument()
  })

  it('given the API failed once, when the visitor retries, then the gym list is displayed', async () => {
    seedGymsError()
    const { user } = renderGymsPage()

    expect(await screen.findByRole('alert')).toBeInTheDocument()

    seedGyms([createGym({ name: 'Elite Fighters Academy' })])
    await user.click(screen.getByRole('button', { name: /retry/i }))

    expect(
      await screen.findByText('Elite Fighters Academy')
    ).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
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

  it('given a name with an accent, when the visitor searches without it, then the gym matches', async () => {
    seedGyms([
      createGym({ name: 'Brú Grappling Studio', county: 'Dublin' }),
      createGym({ name: 'Community BJJ Club', county: 'Cork' }),
    ])
    const { user } = renderGymsPage()
    await screen.findByText('Brú Grappling Studio')

    await user.type(screen.getByRole('searchbox'), 'Bru')

    await waitFor(() =>
      expect(screen.queryByText('Community BJJ Club')).not.toBeInTheDocument()
    )
    expect(screen.getByText('Brú Grappling Studio')).toBeInTheDocument()
  })

  describe('search scope', () => {
    const seedSearchableGyms = (): void => {
      seedGyms([
        createGym({
          name: 'Elite Fighters Academy',
          county: 'Dublin',
          description: 'Home of Rebel wrestling',
          offeredClasses: [ClassCategory.MuayThai],
        }),
        createGym({ name: 'Community BJJ Club', county: 'Cork' }),
      ])
    }

    it.each(['Rebel', 'MuayThai'])(
      'given a term only in hidden gym details, when the visitor searches "%s", then no gyms match',
      async term => {
        seedSearchableGyms()
        const { user } = renderGymsPage()
        await screen.findByText('Elite Fighters Academy')

        await user.type(screen.getByRole('searchbox'), term)

        await waitFor(() =>
          expect(
            screen.getByText('No gyms match your search')
          ).toBeInTheDocument()
        )
      }
    )

    it('given a county name, when the visitor searches it, then gyms from that county match', async () => {
      seedSearchableGyms()
      const { user } = renderGymsPage()
      await screen.findByText('Elite Fighters Academy')

      await user.type(screen.getByRole('searchbox'), 'Cork')

      await waitFor(() =>
        expect(
          screen.queryByText('Elite Fighters Academy')
        ).not.toBeInTheDocument()
      )
      expect(screen.getByText('Community BJJ Club')).toBeInTheDocument()
    })
  })

  describe('URL state', () => {
    const seedTwoPages = (): { getLastUrl: () => URL | null } =>
      seedGymsPaged({
        1: createPaginatedGyms(
          [createGym({ name: 'Elite Fighters Academy' })],
          1,
          2
        ),
        2: createPaginatedGyms(
          [createGym({ name: 'Community BJJ Club' })],
          2,
          2
        ),
      })
    const routerSearch = (): string | null =>
      screen.getByTestId('router-probe-search').textContent

    it('given a link to page 2, when the page opens, then page 2 is shown', async () => {
      seedTwoPages()
      renderGymsPage(['/gyms?page=2'])

      expect(await screen.findByText('Community BJJ Club')).toBeInTheDocument()
      expect(screen.getByText('2 / 2')).toBeInTheDocument()
    })

    it('given the next page is chosen, when the visitor goes back, then the first page returns', async () => {
      seedTwoPages()
      const { user } = renderGymsPage()
      await screen.findByText('Elite Fighters Academy')

      await user.click(screen.getByRole('button', { name: /next page/i }))
      await screen.findByText('Community BJJ Club')
      expect(routerSearch()).toBe('?page=2')

      await user.click(screen.getByRole('button', { name: 'Router back' }))

      expect(
        await screen.findByText('Elite Fighters Academy')
      ).toBeInTheDocument()
      expect(routerSearch()).toBe('')
    })

    it('given a page past the last, when the page opens, then the last page is shown', async () => {
      seedGymsPaged({
        1: createPaginatedGyms(
          [createGym({ name: 'Elite Fighters Academy' })],
          1,
          2
        ),
        2: createPaginatedGyms(
          [createGym({ name: 'Community BJJ Club' })],
          2,
          2
        ),
        99: createPaginatedGyms([], 99, 2),
      })
      renderGymsPage(['/gyms?page=99'])

      expect(await screen.findByText('Community BJJ Club')).toBeInTheDocument()
      expect(routerSearch()).toBe('?page=2')
    })

    it.each(['abc', '0', '-1', '1.5'])(
      'given an invalid page "%s", when the page opens, then the first page is shown',
      async page => {
        const { getLastUrl } = seedTwoPages()
        renderGymsPage([`/gyms?page=${page}`])

        expect(
          await screen.findByText('Elite Fighters Academy')
        ).toBeInTheDocument()
        expect(getLastUrl()?.searchParams.get('page')).toBe('1')
      }
    )

    it('given a link to a county, when the page opens, then that county is shown', async () => {
      const { getLastUrl } = seedGymsByCounty({
        Cork: [createGym({ name: 'Community BJJ Club', county: 'Cork' })],
      })
      renderGymsPage(['/gyms?county=Cork'])

      expect(
        await screen.findByRole('heading', { name: /bjj gyms in cork/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('combobox', { name: /select county/i })
      ).toHaveValue('Cork')
      expect(getLastUrl()?.searchParams.get('county')).toBe('Cork')
    })

    it('given an unknown county, when the page opens, then all counties are shown', async () => {
      const { getLastUrl } = seedGymsByCounty({}, [
        createGym({ name: 'Elite Fighters Academy' }),
      ])
      renderGymsPage(['/gyms?county=Atlantis'])

      expect(
        await screen.findByText('Elite Fighters Academy')
      ).toBeInTheDocument()
      expect(getLastUrl()?.searchParams.has('county')).toBe(false)
    })

    it('given a later page, when a county is chosen, then the URL has the county and no page', async () => {
      seedTwoPages()
      const { user } = renderGymsPage(['/gyms?page=2'])
      await screen.findByText('Community BJJ Club')

      await user.selectOptions(
        screen.getByRole('combobox', { name: /select county/i }),
        'Dublin'
      )

      await waitFor(() => expect(routerSearch()).toBe('?county=Dublin'))
    })

    it('given a later page, when the visitor searches and clears, then the first page is shown', async () => {
      seedTwoPages()
      const { user } = renderGymsPage(['/gyms?page=2'])
      await screen.findByText('Community BJJ Club')

      await user.type(screen.getByRole('searchbox'), 'Elite')
      await waitFor(() => expect(routerSearch()).toBe('?q=Elite'))

      await user.click(screen.getByRole('button', { name: /clear search/i }))

      await waitFor(() => expect(routerSearch()).toBe(''))
      expect(
        await screen.findByText('Elite Fighters Academy')
      ).toBeInTheDocument()
    })

    it('given typed search text, when the visitor goes back, then each keystroke is not a separate step', async () => {
      seedTwoPages()
      const { user } = renderGymsPage(['/gyms?page=2'])
      await screen.findByText('Community BJJ Club')

      await user.click(screen.getByRole('button', { name: /previous page/i }))
      await screen.findByText('Elite Fighters Academy')
      await user.type(screen.getByRole('searchbox'), 'Com')
      await waitFor(() => expect(routerSearch()).toBe('?q=Com'))

      await user.click(screen.getByRole('button', { name: 'Router back' }))

      await waitFor(() => expect(routerSearch()).toBe('?page=2'))
    })
  })
})
