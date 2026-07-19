import { screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BjjEventType } from '@/types/event'
import { County } from '@/constants/counties'
import {
  createEvent,
  createPaginatedEvents,
} from '@/testing/factories/event.factory'
import {
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
      { [String(BjjEventType.Camp)]: [camp] },
      [openMat, camp]
    )

    const { user } = renderEventsPage()

    expect(await screen.findByText('Dublin Open Mat')).toBeInTheDocument()
    expect(screen.getByText('Cork Summer Camp')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /camp/i }))

    expect(await screen.findByText('Cork Summer Camp')).toBeInTheDocument()
    expect(screen.queryByText('Dublin Open Mat')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(getLastUrl()?.searchParams.get('types')).toBe(
        String(BjjEventType.Camp)
      )
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
})
