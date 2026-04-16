import { screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '@/testing/msw/server'
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

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())

describe('EventsPage Integration (API + Query + UI)', () => {
  it('shows loading state while data is being fetched', () => {
    seedEventsPending()
    renderEventsPage()

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows error state and retry button when the API fails', async () => {
    seedEventsError()
    renderEventsPage()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('shows empty state when no events are returned', async () => {
    seedEvents([])
    renderEventsPage()

    expect(await screen.findByText('No Events Found')).toBeInTheDocument()
  })

  it('renders event cards when data loads successfully', async () => {
    seedEvents([
      createEvent({ name: 'Dublin Open Mat 2026', county: County.Dublin }),
      createEvent({ name: 'Cork Seminar', county: County.Cork }),
    ])
    renderEventsPage()

    expect(await screen.findByText('Dublin Open Mat 2026')).toBeInTheDocument()
    expect(screen.getByText('Cork Seminar')).toBeInTheDocument()
  })

  it('sends the county param when a county filter is selected', async () => {
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

  it('sends the type param when an event type filter is selected', async () => {
    const openMat = createEvent({
      name: 'Dublin Open Mat',
      type: BjjEventType.OpenMat,
    })
    const camp = createEvent({
      name: 'Cork Summer Camp',
      type: BjjEventType.Camp,
    })

    const { getLastUrl } = seedEventsByParam(
      'type',
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
      expect(getLastUrl()?.searchParams.get('type')).toBe(
        String(BjjEventType.Camp)
      )
      expect(getLastUrl()?.searchParams.get('page')).toBe('1')
    })
  })

  it('fetches the next page when the user uses pagination controls', async () => {
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
