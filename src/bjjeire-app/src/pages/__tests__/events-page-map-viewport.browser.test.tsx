import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement, ReactNode } from 'react'
import { api } from '@/lib/api-client'
import {
  createEvent,
  createPaginatedEvents,
} from '@/testing/factories/event.factory'
import { createTestQueryClient } from '@/testing/render-utils'
import { FeatureFlagProvider, resolveFlags } from '@/features/feature-flags'
import { EventMapTestIds } from '@/constants/eventDataTestIds'
import type { BjjEventDto } from '@/types/event'
import { County } from '@/constants/counties'
import EventsPage from '@/pages/EventsPage'

// Tests never touch live OpenStreetMap.
vi.mock('@/features/bjjevents/components/event-map/event-map-config', () => ({
  OSM_TILE_URL:
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7#{z}/{x}/{y}',
}))

// The venue doubles as the pin's name, so each event here has its own venue.
function eventAt(
  name: string,
  county: County,
  lng: number,
  lat: number
): BjjEventDto {
  return createEvent({
    name,
    county,
    location: {
      address: `${name} Street`,
      venue: name,
      coordinates: { type: 'Point', coordinates: [lng, lat] },
    },
  })
}

const dublin = eventAt('Liffey Open Mat', County.Dublin, -6.26, 53.33)
const swords = eventAt('Swords Seminar', County.Dublin, -6.22, 53.46)
const cork = eventAt('Rebel Camp', County.Cork, -8.47, 51.9)

function wrapperAt(route: string) {
  const queryClient = createTestQueryClient()
  const flags = resolveFlags([{ BjjEvents: true, EventsMap: true }])
  return function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return (
      <QueryClientProvider client={queryClient}>
        <FeatureFlagProvider flags={flags}>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </FeatureFlagProvider>
      </QueryClientProvider>
    )
  }
}

function seedApi(): void {
  vi.spyOn(api, 'get').mockImplementation(((
    _url: string,
    config?: { params?: { county?: string } }
  ) => {
    const county = config?.params?.county
    const events = [dublin, swords, cork].filter(
      event => !county || (event.county as string) === county
    )
    return Promise.resolve(createPaginatedEvents(events, 1, 1))
  }) as typeof api.get)
}

function tileZoom(): number {
  const src = document.querySelector('img.leaflet-tile')?.getAttribute('src')
  return Number(src?.split('#')[1]?.split('/')[0])
}

function selectCounty(county: string): Promise<void> {
  return userEvent.selectOptions(
    page.getByRole('combobox', { name: /select county/i }),
    county
  )
}

afterEach(async () => {
  vi.restoreAllMocks()
  await page.viewport(1280, 800)
})

describe('EventsPage map follows the page filters (browser)', () => {
  it('#2012: given all of Ireland, when a county and then a search narrow the results, then the map moves to them and returns when cleared', async () => {
    seedApi()
    await render(<EventsPage />, { wrapper: wrapperAt('/events?view=map') })
    await expect
      .element(page.getByRole('button', { name: 'Rebel Camp' }))
      .toBeVisible()
    await expect.poll(tileZoom).toBeLessThan(9)
    const ireland = tileZoom()

    await selectCounty('Dublin')
    await expect
      .element(page.getByRole('button', { name: 'Rebel Camp' }))
      .not.toBeInTheDocument()
    await expect.poll(tileZoom).toBeGreaterThan(ireland)
    const county = tileZoom()

    await userEvent.fill(page.getByRole('searchbox'), 'Swords')
    await expect
      .element(page.getByRole('button', { name: 'Liffey Open Mat' }))
      .not.toBeInTheDocument()
    await expect.poll(tileZoom).toBe(15)
    expect(county).toBeLessThan(15)

    await userEvent.clear(page.getByRole('searchbox'))
    await selectCounty('all')
    await expect
      .element(page.getByRole('button', { name: 'Rebel Camp' }))
      .toBeVisible()
    await expect.poll(tileZoom).toBe(ireland)
  })

  it('#2016: given phone width, when the whole page shows the map, then nothing scrolls sideways and the map leaves room to scroll past', async () => {
    seedApi()
    await page.viewport(375, 667)
    await render(<EventsPage />, { wrapper: wrapperAt('/events?view=map') })
    await expect
      .element(page.getByRole('button', { name: 'Rebel Camp' }))
      .toBeVisible()

    const root = document.documentElement
    expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
    const map = page
      .getByTestId(EventMapTestIds.ROOT)
      .element()
      .querySelector('.leaflet-container')
    expect(map?.getBoundingClientRect().height).toBeLessThan(window.innerHeight)
  })
})
