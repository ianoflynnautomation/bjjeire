import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { describe, expect, it, vi } from 'vitest'
import { api } from '@/lib/api-client'
import {
  createEvent,
  createPaginatedEvents,
} from '@/testing/factories/event.factory'
import { makeFeatureFlagWrapper } from '@/testing/render-utils'
import { EventsPageTestIds } from '@/constants/eventDataTestIds'
import EventsPage from '@/pages/EventsPage'

const MAP_REQUEST = /leaflet|tile\.openstreetmap|event-map/i

function mapRequests(): string[] {
  return performance
    .getEntriesByType('resource')
    .map(entry => entry.name)
    .filter(name => MAP_REQUEST.test(name))
}

describe('EventsPage map loading (AC-EVT-017)', () => {
  it('given a visitor stays on the list, when the page has loaded, then no map code or tiles were requested', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(
      createPaginatedEvents([createEvent({ name: 'Rebel Open Mat' })], 1, 1)
    )

    await render(<EventsPage />, {
      wrapper: makeFeatureFlagWrapper({ BjjEvents: true, EventsMap: true }),
    })
    await expect.element(page.getByTestId(EventsPageTestIds.LIST)).toBeVisible()
    await expect
      .element(page.getByRole('button', { name: 'Map' }))
      .toBeVisible()

    expect(mapRequests()).toEqual([])

    // Proves the check can see map code: importing it does show up.
    await import('@/features/bjjevents/components/event-map/event-map')
    expect(mapRequests().length).toBeGreaterThan(0)
  })
})
