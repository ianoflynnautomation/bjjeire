import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createEvent } from '@/testing/factories/event.factory'
import {
  renderEventsPage,
  seedEvents,
} from '@/features/bjjevents/testing/bjj-events-test-helpers'
import { EventsPageTestIds } from '@/constants/eventDataTestIds'

// A stale tab after a deploy asks for a map chunk that no longer exists.
vi.mock('@/features/bjjevents/components/event-map/event-map', () => {
  throw new Error('Failed to fetch dynamically imported module')
})

describe('EventsPage when the map code cannot load (AC-EVT-013)', () => {
  it('given the map chunk fails, when the map opens, then the page survives and the list is one click away', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const reload = vi.fn()
    vi.stubGlobal('location', { reload })
    seedEvents([createEvent({ name: 'Rebel Open Mat' })])
    const { user } = renderEventsPage(['/events?view=map'], { EventsMap: true })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The map could not be loaded'
    )
    expect(screen.getByRole('searchbox')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /retry/i }))
    expect(reload).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'List' }))

    expect(
      await screen.findByTestId(EventsPageTestIds.LIST)
    ).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
