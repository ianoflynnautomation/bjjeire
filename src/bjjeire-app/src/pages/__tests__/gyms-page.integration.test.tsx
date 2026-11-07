import { screen, waitFor, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ClassCategory } from '@/types/gyms'
import { createGym, createPaginatedGyms } from '@/testing/factories/gym.factory'
import { delay, http, HttpResponse } from 'msw'
import { server } from '@/testing/msw/server'
import {
  GYMS_API,
  renderGymsPage,
  seedGyms,
  seedGymsByCounty,
  seedGymsError,
  seedGymsPaged,
  seedGymsPending,
} from '@/features/gyms/testing/gyms-test-helpers'
import { GymMapTestIds, GymsPageTestIds } from '@/constants/gymDataTestIds'
import type { GymDto } from '@/types/gyms'

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

  describe('map view', () => {
    const MAP_ON = { GymsMap: true }
    const routerSearch = (): string | null =>
      screen.getByTestId('router-probe-search').textContent
    const pins = (): Promise<HTMLElement[]> =>
      screen.findAllByTestId(GymMapTestIds.PIN)

    describe('AC-GYM-007 switching view', () => {
      it.each(['/gyms', '/gyms?view=satellite'])(
        'given %s, when the page opens, then the list is shown and marked current',
        async route => {
          seedGyms([createGym({ name: 'Elite Fighters Academy' })])
          renderGymsPage([route], MAP_ON)

          expect(
            await screen.findByTestId(GymsPageTestIds.LIST)
          ).toBeInTheDocument()
          expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute(
            'aria-pressed',
            'true'
          )
          expect(screen.queryByTestId(GymMapTestIds.ROOT)).toBeNull()
        }
      )

      it('given the list with filters on page 2, when switching to the map, then the URL has view=map, keeps the filters and drops the page', async () => {
        seedGyms([createGym({ name: 'Rebel BJJ', county: 'Cork' })])
        const { user } = renderGymsPage(
          ['/gyms?county=Cork&q=Rebel&page=2'],
          MAP_ON
        )
        await screen.findByTestId(GymsPageTestIds.LIST)

        await user.click(screen.getByRole('button', { name: 'Map' }))

        expect(await pins()).toHaveLength(1)
        expect(routerSearch()).toBe('?county=Cork&q=Rebel&view=map')
        expect(screen.getByRole('button', { name: 'Map' })).toHaveAttribute(
          'aria-pressed',
          'true'
        )
      })

      it('given a link to the map with a county, when it opens, then the map and filter from the link are shown', async () => {
        const { getLastUrl } = seedGymsByCounty({
          Cork: [createGym({ name: 'Rebel BJJ', county: 'Cork' })],
        })
        renderGymsPage(['/gyms?view=map&county=Cork'], MAP_ON)

        expect(await pins()).toHaveLength(1)
        expect(
          screen.getByRole('combobox', { name: /select county/i })
        ).toHaveValue('Cork')
        expect(getLastUrl()?.searchParams.get('county')).toBe('Cork')
      })

      it('given the visitor switched to the map, when they go back, then the list returns', async () => {
        seedGyms([createGym({ name: 'Elite Fighters Academy' })])
        const { user } = renderGymsPage(['/gyms?county=Cork'], MAP_ON)
        await screen.findByTestId(GymsPageTestIds.LIST)
        await user.click(screen.getByRole('button', { name: 'Map' }))
        await pins()

        await user.click(screen.getByRole('button', { name: 'Router back' }))

        expect(
          await screen.findByTestId(GymsPageTestIds.LIST)
        ).toBeInTheDocument()
        expect(routerSearch()).toBe('?county=Cork')
      })

      it('given the map, when switching to the list, then the same search and county still apply', async () => {
        seedGyms([
          createGym({ name: 'Rebel BJJ', county: 'Cork' }),
          createGym({ name: 'Elite Fighters Academy', county: 'Cork' }),
        ])
        const { user } = renderGymsPage(
          ['/gyms?view=map&county=Cork&q=Rebel'],
          MAP_ON
        )
        await pins()

        await user.click(screen.getByRole('button', { name: 'List' }))

        const list = await screen.findByTestId(GymsPageTestIds.LIST)
        expect(within(list).getByText('Rebel BJJ')).toBeInTheDocument()
        expect(
          within(list).queryByText('Elite Fighters Academy')
        ).not.toBeInTheDocument()
        expect(routerSearch()).toBe('?county=Cork&q=Rebel')
      })
    })

    describe('AC-GYM-008 filters without paging', () => {
      const manyGyms = (count: number): GymDto[] =>
        Array.from({ length: count }, (_, i) =>
          createGym({ name: `Gym ${i + 1}` })
        )

      it('given more gyms than one list page, when the map opens, then all have pins, one maximum-size page is fetched and no paging is shown', async () => {
        const gyms = manyGyms(25)
        const { getLastUrl } = seedGymsPaged({
          1: createPaginatedGyms(gyms, 1, 1),
        })
        renderGymsPage(['/gyms?view=map&page=3'], MAP_ON)

        expect(await pins()).toHaveLength(25)
        expect(getLastUrl()?.searchParams.get('pageSize')).toBe('100')
        expect(getLastUrl()?.searchParams.get('page')).toBe('1')
        expect(screen.getByText('Found 25 gyms.')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /next page/i })).toBeNull()
        expect(screen.queryByTestId(GymMapTestIds.NOTICE_TRUNCATED)).toBeNull()
      })

      it('given a list page shorter than the total, when switching to the map, then the not-all-shown notice never appears', async () => {
        const gyms = manyGyms(25)
        server.use(
          http.get(GYMS_API, ({ request }) => {
            const size = new URL(request.url).searchParams.get('pageSize')
            const response = createPaginatedGyms(
              size === '100' ? gyms : gyms.slice(0, 20),
              1,
              size === '100' ? 1 : 2
            )
            response.pagination.totalItems = 25
            return HttpResponse.json(response)
          })
        )
        // Load the map chunk first, so the switch does not suspend past the first commit.
        const first = renderGymsPage(['/gyms?view=map'], MAP_ON)
        await pins()
        first.unmount()

        const { user } = renderGymsPage(['/gyms'], MAP_ON)
        await screen.findByTestId(GymsPageTestIds.LIST)
        const seen: boolean[] = []
        const observer = new MutationObserver(() => {
          seen.push(
            screen.queryByTestId(GymMapTestIds.NOTICE_TRUNCATED) !== null
          )
        })
        observer.observe(document.body, { childList: true, subtree: true })

        await user.click(screen.getByRole('button', { name: 'Map' }))
        await waitFor(() =>
          expect(screen.getAllByTestId(GymMapTestIds.PIN)).toHaveLength(25)
        )
        observer.disconnect()

        expect(seen).not.toContain(true)
      })

      it('given the map on a slow API, when switching to the list, then the list never shows more than one page of cards', async () => {
        const gyms = manyGyms(62)
        server.use(
          http.get(GYMS_API, async ({ request }) => {
            const size = new URL(request.url).searchParams.get('pageSize')
            if (size === '100') {
              return HttpResponse.json(createPaginatedGyms(gyms, 1, 1))
            }
            await delay(100)
            const response = createPaginatedGyms(gyms.slice(0, 20), 1, 4)
            response.pagination.totalItems = 62
            return HttpResponse.json(response)
          })
        )
        const { user } = renderGymsPage(['/gyms?view=map'], MAP_ON)
        await pins()

        const counts: number[] = []
        const observer = new MutationObserver(() => {
          counts.push(screen.queryAllByTestId(GymsPageTestIds.LIST_ITEM).length)
        })
        observer.observe(document.body, { childList: true, subtree: true })
        await user.click(screen.getByRole('button', { name: 'List' }))
        await screen.findByRole('button', { name: /next page/i })
        observer.disconnect()

        expect(Math.max(...counts)).toBe(20)
      })

      it('given truncated results, when a county refetch is slow, then the notice stays steady', async () => {
        const gyms = manyGyms(100)
        server.use(
          http.get(GYMS_API, async ({ request }) => {
            if (new URL(request.url).searchParams.has('county')) {
              await delay(100)
            }
            const response = createPaginatedGyms(gyms, 1, 2)
            response.pagination.totalItems = 150
            return HttpResponse.json(response)
          })
        )
        const { user } = renderGymsPage(['/gyms?view=map'], MAP_ON)
        await screen.findByTestId(GymMapTestIds.NOTICE_TRUNCATED)

        const seen: boolean[] = []
        const observer = new MutationObserver(() => {
          seen.push(
            screen.queryByTestId(GymMapTestIds.NOTICE_TRUNCATED) !== null
          )
        })
        observer.observe(document.body, { childList: true, subtree: true })
        await user.selectOptions(
          screen.getByRole('combobox', { name: /select county/i }),
          'Cork'
        )
        await screen.findByRole('heading', { name: /bjj gyms in cork/i })
        await waitFor(() =>
          expect(
            screen.getByRole('combobox', { name: /select county/i })
          ).toBeEnabled()
        )
        observer.disconnect()

        expect(seen).not.toContain(false)
      })

      it('given more matching gyms than the maximum page size, when the map opens, then a notice suggests filtering and no paging is shown', async () => {
        const gyms = manyGyms(100)
        const response = createPaginatedGyms(gyms, 1, 2)
        response.pagination.totalItems = 130
        seedGymsPaged({ 1: response })
        renderGymsPage(['/gyms?view=map'], MAP_ON)

        expect(await pins()).toHaveLength(100)
        expect(
          await screen.findByTestId(GymMapTestIds.NOTICE_TRUNCATED)
        ).toHaveTextContent('Choose a county or search')
        expect(screen.getByText('Found 130 gyms.')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /next page/i })).toBeNull()
      })

      it('given gyms in several counties, when a county is chosen on the map, then only its gyms have pins and the header follows', async () => {
        const cork = createGym({ name: 'Rebel BJJ', county: 'Cork' })
        const dublin = createGym({ name: 'Elite Fighters', county: 'Dublin' })
        seedGymsByCounty({ Cork: [cork] }, [cork, dublin])
        const { user } = renderGymsPage(['/gyms?view=map'], MAP_ON)
        expect(await pins()).toHaveLength(2)

        await user.selectOptions(
          screen.getByRole('combobox', { name: /select county/i }),
          'Cork'
        )

        await waitFor(() =>
          expect(screen.getAllByTestId(GymMapTestIds.PIN)).toHaveLength(1)
        )
        expect(screen.getByRole('button', { name: 'Rebel BJJ' })).toBeVisible()
        expect(screen.getByText('Found 1 gym.')).toBeInTheDocument()
        expect(routerSearch()).toBe('?view=map&county=Cork')
      })

      it('given a gym name, when searching on the map, then only that gym has a pin and the header counts it', async () => {
        seedGyms([
          createGym({ name: 'Rebel BJJ', county: 'Cork' }),
          createGym({ name: 'Elite Fighters', county: 'Dublin' }),
        ])
        const { user } = renderGymsPage(['/gyms?view=map'], MAP_ON)
        expect(await pins()).toHaveLength(2)

        await user.type(screen.getByRole('searchbox'), 'Rebel')

        await waitFor(() =>
          expect(screen.getAllByTestId(GymMapTestIds.PIN)).toHaveLength(1)
        )
        expect(screen.getByText('Found 1 gym.')).toBeInTheDocument()
      })
    })

    describe('AC-GYM-009 gyms without usable coordinates', () => {
      it('given a gym with no coordinates, when the map opens, then it has no pin, a notice counts it and the list still shows it', async () => {
        seedGyms([
          createGym({ name: 'Rebel BJJ' }),
          createGym({
            name: 'Nowhere BJJ',
            location: { address: 'Unknown' } as GymDto['location'],
          }),
        ])
        const { user } = renderGymsPage(['/gyms?view=map'], MAP_ON)

        expect(await pins()).toHaveLength(1)
        expect(
          screen.getByTestId(GymMapTestIds.NOTICE_UNMAPPED)
        ).toHaveTextContent('1 gym is not shown on the map')

        await user.click(screen.getByRole('button', { name: 'List' }))

        expect(await screen.findByText('Nowhere BJJ')).toBeInTheDocument()
      })
    })

    describe('AC-GYM-012 loading, empty and error states', () => {
      it('given a pending request, when the map opens, then the loading state is shown', () => {
        seedGymsPending()
        renderGymsPage(['/gyms?view=map'], MAP_ON)

        expect(screen.getByRole('status')).toBeInTheDocument()
      })

      it('given no gyms, when the map opens, then the list empty state is shown', async () => {
        seedGyms([])
        renderGymsPage(['/gyms?view=map'], MAP_ON)

        expect(await screen.findByText('No Gyms Found')).toBeInTheDocument()
        expect(screen.queryByTestId(GymMapTestIds.ROOT)).toBeNull()
      })

      it('given no matching gym, when searching on the map, then the list search empty state is shown', async () => {
        seedGyms([createGym({ name: 'Rebel BJJ' })])
        const { user } = renderGymsPage(['/gyms?view=map'], MAP_ON)
        await pins()

        await user.type(screen.getByRole('searchbox'), 'zzz')

        expect(
          await screen.findByText('No gyms match your search')
        ).toBeInTheDocument()
      })

      it('given a failed request, when retrying on the map, then the error clears and pins appear', async () => {
        seedGymsError()
        const { user } = renderGymsPage(['/gyms?view=map'], MAP_ON)
        expect(await screen.findByRole('alert')).toBeInTheDocument()

        seedGyms([createGym({ name: 'Rebel BJJ' })])
        await user.click(screen.getByRole('button', { name: /retry/i }))

        expect(await pins()).toHaveLength(1)
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })

    describe('AC-GYM-014 flag fails safe to the list', () => {
      it('given the flag is off, when a map link opens, then the list is shown on /gyms with no switch and a normal page size', async () => {
        const { getLastUrl } = seedGymsPaged({
          1: createPaginatedGyms([createGym({ name: 'Rebel BJJ' })], 1, 1),
        })
        renderGymsPage(['/gyms?view=map'], { GymsMap: false })

        expect(
          await screen.findByTestId(GymsPageTestIds.LIST)
        ).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Map' })).toBeNull()
        expect(screen.queryByRole('button', { name: 'List' })).toBeNull()
        expect(screen.queryByTestId(GymMapTestIds.ROOT)).toBeNull()
        expect(getLastUrl()?.searchParams.get('pageSize')).not.toBe('100')
        expect(routerSearch()).toBe('?view=map')
      })

      it('given only the events map is on, when the gym page opens, then it offers no map (AC-EVT-015)', async () => {
        seedGyms([createGym({ name: 'Rebel BJJ' })])
        renderGymsPage(['/gyms?view=map'], { GymsMap: false, EventsMap: true })

        expect(await screen.findByText('Rebel BJJ')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Map' })).toBeNull()
      })

      it('given the flag response has no GymsMap key, when the gym page opens, then it behaves as off', async () => {
        seedGyms([createGym({ name: 'Rebel BJJ' })])
        renderGymsPage()

        expect(await screen.findByText('Rebel BJJ')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Map' })).toBeNull()
      })
    })
  })
})
