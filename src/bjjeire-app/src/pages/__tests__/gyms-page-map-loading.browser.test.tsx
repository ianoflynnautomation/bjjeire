import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { describe, expect, it, vi } from 'vitest'
import { api } from '@/lib/api-client'
import { createGym, createPaginatedGyms } from '@/testing/factories/gym.factory'
import { makeFeatureFlagWrapper } from '@/testing/render-utils'
import { GymsPageTestIds } from '@/constants/gymDataTestIds'
import GymsPage from '@/pages/GymsPage'

const MAP_REQUEST = /leaflet|tile\.openstreetmap|gym-map/i

function mapRequests(): string[] {
  return performance
    .getEntriesByType('resource')
    .map(entry => entry.name)
    .filter(name => MAP_REQUEST.test(name))
}

describe('GymsPage map loading (#1016)', () => {
  it('given a visitor stays on the list, when the page has loaded, then no map code or tiles were requested', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(
      createPaginatedGyms([createGym({ name: 'Rebel BJJ' })], 1, 1)
    )

    await render(<GymsPage />, {
      wrapper: makeFeatureFlagWrapper({ Gyms: true, GymsMap: true }),
    })
    await expect.element(page.getByTestId(GymsPageTestIds.LIST)).toBeVisible()
    await expect
      .element(page.getByRole('button', { name: 'Map' }))
      .toBeVisible()

    expect(mapRequests()).toEqual([])

    // Proves the check can see map code: importing it does show up.
    await import('@/features/gyms/components/gym-map/gym-map')
    expect(mapRequests().length).toBeGreaterThan(0)
  })
})
