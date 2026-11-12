import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement, ReactNode } from 'react'
import { api } from '@/lib/api-client'
import { createGym, createPaginatedGyms } from '@/testing/factories/gym.factory'
import { createTestQueryClient } from '@/testing/render-utils'
import { FeatureFlagProvider, resolveFlags } from '@/features/feature-flags'
import { GymMapTestIds } from '@/constants/gymDataTestIds'
import type { GymDto } from '@/types/gyms'
import GymsPage from '@/pages/GymsPage'

// Tests never touch live OpenStreetMap.
vi.mock('@/features/gyms/components/gym-map/gym-map-config', () => ({
  OSM_TILE_URL:
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7#{z}/{x}/{y}',
}))

function gymAt(name: string, county: string, lng: number, lat: number): GymDto {
  return createGym({
    name,
    county,
    location: {
      address: `${name} Street`,
      venue: 'Main Hall',
      coordinates: { type: 'Point', coordinates: [lng, lat] },
    },
  })
}

const dublin = gymAt('Dublin BJJ', 'Dublin', -6.26, 53.33)
const swords = gymAt('Swords BJJ', 'Dublin', -6.22, 53.46)
const cork = gymAt('Cork BJJ', 'Cork', -8.47, 51.9)

function wrapperAt(route: string) {
  const queryClient = createTestQueryClient()
  const flags = resolveFlags([{ Gyms: true, GymsMap: true }])
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
    const gyms = [dublin, swords, cork].filter(
      gym => !county || gym.county === county
    )
    return Promise.resolve(createPaginatedGyms(gyms, 1, 1))
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

describe('GymsPage map follows the page filters (browser)', () => {
  it('#1011: given all of Ireland, when a county and then a search narrow the results, then the map moves to them and returns when cleared', async () => {
    seedApi()
    await render(<GymsPage />, { wrapper: wrapperAt('/gyms?view=map') })
    await expect
      .element(page.getByRole('button', { name: 'Cork BJJ' }))
      .toBeVisible()
    await expect.poll(tileZoom).toBeLessThan(9)
    const ireland = tileZoom()

    await selectCounty('Dublin')
    await expect
      .element(page.getByRole('button', { name: 'Cork BJJ' }))
      .not.toBeInTheDocument()
    await expect.poll(tileZoom).toBeGreaterThan(ireland)
    const county = tileZoom()

    await userEvent.fill(page.getByRole('searchbox'), 'Swords')
    await expect
      .element(page.getByRole('button', { name: 'Dublin BJJ' }))
      .not.toBeInTheDocument()
    await expect.poll(tileZoom).toBe(15)
    expect(county).toBeLessThan(15)

    await userEvent.clear(page.getByRole('searchbox'))
    await selectCounty('all')
    await expect
      .element(page.getByRole('button', { name: 'Cork BJJ' }))
      .toBeVisible()
    await expect.poll(tileZoom).toBe(ireland)
  })

  it('#1015: given phone width, when the whole page shows the map, then nothing scrolls sideways and the map leaves room to scroll past', async () => {
    seedApi()
    await page.viewport(375, 667)
    await render(<GymsPage />, { wrapper: wrapperAt('/gyms?view=map') })
    await expect
      .element(page.getByRole('button', { name: 'Cork BJJ' }))
      .toBeVisible()

    const root = document.documentElement
    expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
    const map = page
      .getByTestId(GymMapTestIds.ROOT)
      .element()
      .querySelector('.leaflet-container')
    expect(map?.getBoundingClientRect().height).toBeLessThan(window.innerHeight)
  })
})
