import { screen, waitFor, within } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { server } from '@/testing/msw/server'
import {
  EventMapTestIds,
  EventsPageTestIds,
} from '@/constants/eventDataTestIds'
import type { BjjEventDto } from '@/types/event'
import { describe, it, expect } from 'vitest'
import { BjjEventType } from '@/types/event'
import { County } from '@/constants/counties'
import { uiContent } from '@/config/ui-content'
import {
  createEvent,
  createPaginatedEvents,
} from '@/testing/factories/event.factory'
import {
  EVENTS_API,
  renderEventsPage,
  seedEvents,
  seedEventsByParam,
  seedEventsError,
  seedEventsPaged,
  seedEventsPending,
} from '@/features/bjjevents/testing/bjj-events-test-helpers'

describe('EventsPage Integration (API + Query + UI)', () => {
  it('given a pending API request, when the page renders, then a loading indicator is shown', () => {
    seedEventsPending()
    renderEventsPage()

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('given a failing API, when the page renders, then an error alert with a retry button is shown', async () => {
    seedEventsError()
    renderEventsPage()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('given the API returns no events, when the page renders, then the empty state is shown', async () => {
    seedEvents([])
    renderEventsPage()

    expect(await screen.findByText('No Events Found')).toBeInTheDocument()
  })

  it('given the API returns events, when the page renders, then a card is shown for each event', async () => {
    seedEvents([
      createEvent({ name: 'Dublin Open Mat 2026', county: County.Dublin }),
      createEvent({ name: 'Cork Seminar', county: County.Cork }),
    ])
    renderEventsPage()

    expect(await screen.findByText('Dublin Open Mat 2026')).toBeInTheDocument()
    expect(screen.getByText('Cork Seminar')).toBeInTheDocument()
  })

  it('given loaded events, when the user types a search term, then only matching events remain visible', async () => {
    seedEvents([
      createEvent({ name: 'Dublin Open Mat 2026', county: County.Dublin }),
      createEvent({ name: 'Cork Seminar', county: County.Cork }),
    ])
    const { user } = renderEventsPage()

    await screen.findByText('Dublin Open Mat 2026')

    await user.type(screen.getByRole('searchbox'), 'Cork')

    await waitFor(() =>
      expect(screen.queryByText('Dublin Open Mat 2026')).not.toBeInTheDocument()
    )
    expect(screen.getByText('Cork Seminar')).toBeInTheDocument()
  })

  it('given a loaded page, when the user selects a county filter, then only that county is fetched and shown', async () => {
    const dublinEvent = createEvent({
      name: 'Dublin Open Mat 2026',
      county: County.Dublin,
    })
    const corkEvent = createEvent({ name: 'Cork Seminar', county: County.Cork })

    const { getLastUrl } = seedEventsByParam(
      'county',
      { Dublin: [dublinEvent] },
      [dublinEvent, corkEvent]
    )

    const { user } = renderEventsPage()

    expect(await screen.findByText('Dublin Open Mat 2026')).toBeInTheDocument()
    expect(screen.getByText('Cork Seminar')).toBeInTheDocument()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /select county/i }),
      'Dublin'
    )

    expect(
      await screen.findByRole('heading', { name: /bjj events in dublin/i })
    ).toBeInTheDocument()
    expect(screen.getByText('Dublin Open Mat 2026')).toBeInTheDocument()
    expect(screen.queryByText('Cork Seminar')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(getLastUrl()?.searchParams.get('county')).toBe('Dublin')
      expect(getLastUrl()?.searchParams.get('page')).toBe('1')
    })
  })

  it('given a loaded page, when the user selects an event type filter, then only that type is fetched and shown', async () => {
    const openMat = createEvent({
      name: 'Dublin Open Mat',
      types: [BjjEventType.OpenMat],
    })
    const camp = createEvent({
      name: 'Cork Summer Camp',
      types: [BjjEventType.Camp],
    })

    const { getLastUrl } = seedEventsByParam(
      'types',
      { [BjjEventType.Camp]: [camp] },
      [openMat, camp]
    )

    const { user } = renderEventsPage()

    expect(await screen.findByText('Dublin Open Mat')).toBeInTheDocument()
    expect(screen.getByText('Cork Summer Camp')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /camp/i }))

    expect(await screen.findByText('Cork Summer Camp')).toBeInTheDocument()
    expect(screen.queryByText('Dublin Open Mat')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(getLastUrl()?.searchParams.get('types')).toBe(BjjEventType.Camp)
      expect(getLastUrl()?.searchParams.get('page')).toBe('1')
    })
  })

  it('given multiple result pages, when the user clicks next page, then the next page is fetched and shown', async () => {
    const eventPage1 = createEvent({ name: 'Dublin Open Mat 2026' })
    const eventPage2 = createEvent({ name: 'Cork Seminar' })

    const { getLastUrl } = seedEventsPaged({
      1: createPaginatedEvents([eventPage1], 1, 2),
      2: createPaginatedEvents([eventPage2], 2, 2),
    })

    const { user } = renderEventsPage()

    expect(await screen.findByText('Dublin Open Mat 2026')).toBeInTheDocument()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /next page/i }))

    expect(await screen.findByText('Cork Seminar')).toBeInTheDocument()
    expect(screen.getByText('2 / 2')).toBeInTheDocument()

    await waitFor(() => {
      expect(getLastUrl()?.searchParams.get('page')).toBe('2')
    })
  })

  describe('URL state', () => {
    it('given a link with a county and event types, when the page opens, then those filters are applied', async () => {
      const { getLastUrl } = seedEventsByParam('county', {}, [])
      renderEventsPage(['/events?county=Cork&types=Seminar&types=Camp'])

      expect(
        await screen.findByRole('combobox', { name: /select county/i })
      ).toHaveValue('Cork')
      await waitFor(() => {
        expect(getLastUrl()?.searchParams.get('county')).toBe('Cork')
        expect(getLastUrl()?.searchParams.getAll('types')).toEqual([
          BjjEventType.Seminar,
          BjjEventType.Camp,
        ])
      })
    })

    it('given a link with unknown filter values, when the page opens, then they are ignored', async () => {
      const { getLastUrl } = seedEventsByParam('county', {}, [])
      renderEventsPage(['/events?county=Atlantis&types=Nope'])

      await waitFor(() => {
        expect(getLastUrl()?.searchParams.has('county')).toBe(false)
        expect(getLastUrl()?.searchParams.has('types')).toBe(false)
      })
    })
  })

  describe('map view', () => {
    const MAP_ON = { EventsMap: true }
    const routerSearch = (): string | null =>
      screen.getByTestId('router-probe-search').textContent
    const pins = (): Promise<HTMLElement[]> =>
      screen.findAllByTestId(EventMapTestIds.PIN)

    // Each event at its own spot: the factory's shared default location would put them all under one pin.
    let spot = 0
    const eventAtOwnSpot = (
      overrides: Partial<BjjEventDto> = {}
    ): BjjEventDto => {
      spot += 1
      return createEvent({
        location: {
          address: `${spot} Map Street`,
          venue: `Venue ${spot}`,
          coordinates: {
            type: 'Point',
            coordinates: [-6.26 - spot * 0.01, 53.33],
          },
        },
        ...overrides,
      })
    }
    const manyEvents = (count: number): BjjEventDto[] =>
      Array.from({ length: count }, (_, i) =>
        eventAtOwnSpot({ name: `Event ${i + 1}` })
      )

    describe('#2007 switching view', () => {
      it.each(['/events', '/events?view=satellite'])(
        'given %s, when the page opens, then the list is shown and marked current',
        async route => {
          seedEvents([eventAtOwnSpot({ name: 'Rebel Open Mat' })])
          renderEventsPage([route], MAP_ON)

          expect(
            await screen.findByTestId(EventsPageTestIds.LIST)
          ).toBeInTheDocument()
          expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute(
            'aria-pressed',
            'true'
          )
          expect(screen.queryByTestId(EventMapTestIds.ROOT)).toBeNull()
        }
      )

      it('given the list with filters on page 2, when switching to the map, then the URL has view=map, keeps county, types and search, and drops the page', async () => {
        seedEvents([
          eventAtOwnSpot({
            name: 'Rebel Camp',
            county: County.Cork,
            types: [BjjEventType.Camp],
          }),
        ])
        const { user } = renderEventsPage(
          ['/events?county=Cork&types=Camp&q=Rebel&page=2'],
          MAP_ON
        )
        await screen.findByTestId(EventsPageTestIds.LIST)

        await user.click(screen.getByRole('button', { name: 'Map' }))

        expect(await pins()).toHaveLength(1)
        expect(routerSearch()).toBe('?county=Cork&types=Camp&q=Rebel&view=map')
        expect(screen.getByRole('button', { name: 'Map' })).toHaveAttribute(
          'aria-pressed',
          'true'
        )
      })

      it('given a link to the map with a county and type, when it opens, then the map and filters from the link are shown', async () => {
        const { getLastUrl } = seedEventsByParam('county', {
          Cork: [
            eventAtOwnSpot({
              name: 'Rebel Camp',
              county: County.Cork,
              types: [BjjEventType.Camp],
            }),
          ],
        })
        renderEventsPage(['/events?view=map&county=Cork&types=Camp'], MAP_ON)

        expect(await pins()).toHaveLength(1)
        expect(
          screen.getByRole('combobox', { name: /select county/i })
        ).toHaveValue('Cork')
        expect(getLastUrl()?.searchParams.get('county')).toBe('Cork')
        expect(getLastUrl()?.searchParams.getAll('types')).toEqual([
          BjjEventType.Camp,
        ])
      })

      it('given the visitor switched to the map, when they go back, then the list returns', async () => {
        seedEvents([eventAtOwnSpot({ name: 'Rebel Open Mat' })])
        const { user } = renderEventsPage(['/events?county=Cork'], MAP_ON)
        await screen.findByTestId(EventsPageTestIds.LIST)
        await user.click(screen.getByRole('button', { name: 'Map' }))
        await pins()

        await user.click(screen.getByRole('button', { name: 'Router back' }))

        expect(
          await screen.findByTestId(EventsPageTestIds.LIST)
        ).toBeInTheDocument()
        expect(routerSearch()).toBe('?county=Cork')
      })

      it('given the map, when switching to the list, then the same search and filters still apply', async () => {
        seedEvents([
          eventAtOwnSpot({ name: 'Rebel Camp', county: County.Cork }),
          eventAtOwnSpot({ name: 'Leeside Seminar', county: County.Cork }),
        ])
        const { user } = renderEventsPage(
          ['/events?view=map&county=Cork&q=Rebel'],
          MAP_ON
        )
        await pins()

        await user.click(screen.getByRole('button', { name: 'List' }))

        const list = await screen.findByTestId(EventsPageTestIds.LIST)
        expect(within(list).getByText('Rebel Camp')).toBeInTheDocument()
        expect(
          within(list).queryByText('Leeside Seminar')
        ).not.toBeInTheDocument()
        expect(routerSearch()).toBe('?county=Cork&q=Rebel')
      })
    })

    describe('#2008 filters without paging', () => {
      it('given more events than one list page, when the map opens, then all have pins, one maximum-size page is fetched and no paging is shown', async () => {
        const { getLastUrl } = seedEventsPaged({
          1: createPaginatedEvents(manyEvents(25), 1, 1),
        })
        renderEventsPage(['/events?view=map&page=3'], MAP_ON)

        expect(await pins()).toHaveLength(25)
        expect(getLastUrl()?.searchParams.get('pageSize')).toBe('100')
        expect(getLastUrl()?.searchParams.get('page')).toBe('1')
        expect(screen.getByText('Found 25 events.')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /next page/i })).toBeNull()
        expect(
          screen.queryByTestId(EventMapTestIds.NOTICE_TRUNCATED)
        ).toBeNull()
      })

      it('given more matching events than the maximum page size, when the map opens, then a notice suggests filtering and no paging is shown', async () => {
        const response = createPaginatedEvents(manyEvents(100), 1, 2)
        response.pagination.totalItems = 130
        seedEventsPaged({ 1: response })
        renderEventsPage(['/events?view=map'], MAP_ON)

        expect(await pins()).toHaveLength(100)
        expect(
          await screen.findByTestId(EventMapTestIds.NOTICE_TRUNCATED)
        ).toHaveTextContent('Choose a county or type')
        expect(screen.getByText('Found 130 events.')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /next page/i })).toBeNull()
      })

      it('given events in several counties, when a county is chosen on the map, then only its events have pins and the header follows', async () => {
        const cork = eventAtOwnSpot({
          name: 'Rebel Camp',
          county: County.Cork,
          location: {
            venue: 'Rebel Hall',
            address: 'Cork',
            coordinates: { type: 'Point', coordinates: [-8.47, 51.9] },
          },
        })
        const dublin = eventAtOwnSpot({
          name: 'Liffey Open Mat',
          county: County.Dublin,
        })
        seedEventsByParam('county', { Cork: [cork] }, [cork, dublin])
        const { user } = renderEventsPage(['/events?view=map'], MAP_ON)
        expect(await pins()).toHaveLength(2)

        await user.selectOptions(
          screen.getByRole('combobox', { name: /select county/i }),
          'Cork'
        )

        await waitFor(() =>
          expect(screen.getAllByTestId(EventMapTestIds.PIN)).toHaveLength(1)
        )
        expect(screen.getByRole('button', { name: 'Rebel Hall' })).toBeVisible()
        expect(screen.getByText('Found 1 event.')).toBeInTheDocument()
        expect(routerSearch()).toBe('?view=map&county=Cork')
      })

      it('given events of several types, when a type is chosen on the map, then only events of that type have pins', async () => {
        const camp = eventAtOwnSpot({
          name: 'Summer Camp',
          types: [BjjEventType.Camp],
        })
        const openMat = eventAtOwnSpot({
          name: 'Friday Open Mat',
          types: [BjjEventType.OpenMat],
        })
        const { getLastUrl } = seedEventsByParam(
          'types',
          { [BjjEventType.Camp]: [camp] },
          [camp, openMat]
        )
        const { user } = renderEventsPage(['/events?view=map'], MAP_ON)
        expect(await pins()).toHaveLength(2)

        await user.click(screen.getByRole('button', { name: /^camp$/i }))

        await waitFor(() =>
          expect(screen.getAllByTestId(EventMapTestIds.PIN)).toHaveLength(1)
        )
        expect(getLastUrl()?.searchParams.get('types')).toBe(BjjEventType.Camp)
        expect(getLastUrl()?.searchParams.get('pageSize')).toBe('100')
      })

      it('given an event name, when searching on the map, then only that event has a pin and the header counts it', async () => {
        seedEvents([
          eventAtOwnSpot({ name: 'Rebel Camp' }),
          eventAtOwnSpot({ name: 'Liffey Open Mat' }),
        ])
        const { user } = renderEventsPage(['/events?view=map'], MAP_ON)
        expect(await pins()).toHaveLength(2)

        await user.type(screen.getByRole('searchbox'), 'Rebel')

        await waitFor(() =>
          expect(screen.getAllByTestId(EventMapTestIds.PIN)).toHaveLength(1)
        )
        expect(screen.getByText('Found 1 event.')).toBeInTheDocument()
      })

      it('given the map on a slow API, when switching to the list, then the list never shows more than one page of cards', async () => {
        const events = manyEvents(62)
        server.use(
          http.get(EVENTS_API, async ({ request }) => {
            const size = new URL(request.url).searchParams.get('pageSize')
            if (size === '100') {
              return HttpResponse.json(createPaginatedEvents(events, 1, 1))
            }
            await delay(100)
            const response = createPaginatedEvents(events.slice(0, 20), 1, 4)
            response.pagination.totalItems = 62
            return HttpResponse.json(response)
          })
        )
        const { user } = renderEventsPage(['/events?view=map'], MAP_ON)
        await pins()

        const counts: number[] = []
        const observer = new MutationObserver(() => {
          counts.push(
            screen.queryAllByTestId(EventsPageTestIds.LIST_ITEM).length
          )
        })
        observer.observe(document.body, { childList: true, subtree: true })
        await user.click(screen.getByRole('button', { name: 'List' }))
        await screen.findByRole('button', { name: /next page/i })
        observer.disconnect()

        expect(Math.max(...counts)).toBe(20)
      })
    })

    describe('#2009 events without usable coordinates', () => {
      it('given an event with no coordinates, when the map opens, then it has no pin, a notice counts it and the list still shows it', async () => {
        seedEvents([
          eventAtOwnSpot({ name: 'Rebel Camp' }),
          createEvent({
            name: 'Nowhere Open Mat',
            location: { address: 'Unknown' } as BjjEventDto['location'],
          }),
        ])
        const { user } = renderEventsPage(['/events?view=map'], MAP_ON)

        expect(await pins()).toHaveLength(1)
        expect(
          screen.getByTestId(EventMapTestIds.NOTICE_UNMAPPED)
        ).toHaveTextContent('1 event is not shown on the map')

        await user.click(screen.getByRole('button', { name: 'List' }))

        expect(await screen.findByText('Nowhere Open Mat')).toBeInTheDocument()
      })
    })

    describe('#2010 events at one venue', () => {
      it('given two events at one venue, when the map opens, then they share one pin and the header still counts both', async () => {
        const location = {
          venue: 'Leinster Grappling HQ',
          address: '1 Leinster St',
          coordinates: {
            type: 'Point' as const,
            coordinates: [-6.2889, 53.3382] as [number, number],
          },
        }
        seedEvents([
          createEvent({ name: 'Leinster Community Open Mat', location }),
          createEvent({ name: 'Winter Solstice Open Mat', location }),
        ])
        renderEventsPage(['/events?view=map'], MAP_ON)

        expect(await pins()).toHaveLength(1)
        expect(
          screen.getByRole('button', {
            name: 'Leinster Grappling HQ, 2 events',
          })
        ).toBeInTheDocument()
        expect(screen.getByText('Found 2 events.')).toBeInTheDocument()
      })
    })

    describe('#2013 loading, empty and error states', () => {
      it('given a pending request, when the map opens, then the loading state is shown', () => {
        seedEventsPending()
        renderEventsPage(['/events?view=map'], MAP_ON)

        expect(screen.getByRole('status')).toBeInTheDocument()
      })

      it('given no events, when the map opens, then the list empty state is shown', async () => {
        seedEvents([])
        renderEventsPage(['/events?view=map'], MAP_ON)

        expect(await screen.findByText('No Events Found')).toBeInTheDocument()
        expect(screen.queryByTestId(EventMapTestIds.ROOT)).toBeNull()
      })

      it('given no matching event, when searching on the map, then the list search empty state is shown', async () => {
        seedEvents([eventAtOwnSpot({ name: 'Rebel Camp' })])
        const { user } = renderEventsPage(['/events?view=map'], MAP_ON)
        await pins()

        await user.type(screen.getByRole('searchbox'), 'zzz')

        expect(
          await screen.findByText(uiContent.events.search.noResultsTitle)
        ).toBeInTheDocument()
      })

      it('given a failed request, when retrying on the map, then the error clears and pins appear', async () => {
        seedEventsError()
        const { user } = renderEventsPage(['/events?view=map'], MAP_ON)
        expect(await screen.findByRole('alert')).toBeInTheDocument()

        seedEvents([eventAtOwnSpot({ name: 'Rebel Camp' })])
        await user.click(screen.getByRole('button', { name: /retry/i }))

        expect(await pins()).toHaveLength(1)
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })

    describe('#2015 flag fails safe to the list', () => {
      it('given the flag is off, when a map link opens, then the list is shown on /events with no switch and a normal page size', async () => {
        const { getLastUrl } = seedEventsPaged({
          1: createPaginatedEvents(
            [eventAtOwnSpot({ name: 'Rebel Camp' })],
            1,
            1
          ),
        })
        renderEventsPage(['/events?view=map'], { EventsMap: false })

        expect(
          await screen.findByTestId(EventsPageTestIds.LIST)
        ).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Map' })).toBeNull()
        expect(screen.queryByTestId(EventMapTestIds.ROOT)).toBeNull()
        expect(getLastUrl()?.searchParams.get('pageSize')).not.toBe('100')
        expect(routerSearch()).toBe('?view=map')
      })

      it('given only the gym map is on, when the events page opens, then it offers no map', async () => {
        seedEvents([eventAtOwnSpot({ name: 'Rebel Camp' })])
        renderEventsPage(['/events?view=map'], {
          GymsMap: true,
          EventsMap: false,
        })

        expect(await screen.findByText('Rebel Camp')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Map' })).toBeNull()
      })

      it('given the flag response has no EventsMap key, when the events page opens, then it behaves as off', async () => {
        seedEvents([eventAtOwnSpot({ name: 'Rebel Camp' })])
        renderEventsPage()

        expect(await screen.findByText('Rebel Camp')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Map' })).toBeNull()
      })
    })
  })
})
