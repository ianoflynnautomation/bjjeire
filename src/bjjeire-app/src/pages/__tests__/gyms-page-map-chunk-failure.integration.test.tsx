import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createGym } from '@/testing/factories/gym.factory'
import {
  renderGymsPage,
  seedGyms,
} from '@/features/gyms/testing/gyms-test-helpers'
import { GymsPageTestIds } from '@/constants/gymDataTestIds'

// A stale tab after a deploy asks for a map chunk that no longer exists.
vi.mock('@/features/gyms/components/gym-map/gym-map', () => {
  throw new Error('Failed to fetch dynamically imported module')
})

describe('GymsPage when the map code cannot load (#1012)', () => {
  it('given the map chunk fails, when the map opens, then the page survives and the list is one click away', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const reload = vi.fn()
    vi.stubGlobal('location', { reload })
    seedGyms([createGym({ name: 'Rebel BJJ' })])
    const { user } = renderGymsPage(['/gyms?view=map'], { GymsMap: true })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The map could not be loaded'
    )
    expect(screen.getByRole('searchbox')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /retry/i }))
    expect(reload).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'List' }))

    expect(await screen.findByTestId(GymsPageTestIds.LIST)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
