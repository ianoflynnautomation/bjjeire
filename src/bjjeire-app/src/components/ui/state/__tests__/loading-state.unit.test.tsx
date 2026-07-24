import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LoadingState from '../loading-state'
import { LoadingStateTestIds } from '@/constants/commonDataTestIds'

describe('LoadingState surface', () => {
  it('given the loading state renders, then it uses the theme-aware surface token (not hard-coded slate)', () => {
    render(<LoadingState message="Loading gyms..." />)

    const surface = screen
      .getAllByTestId(LoadingStateTestIds.ROOT)
      .find(el => el.className.includes('rounded-2xl'))

    expect(surface).toBeDefined()
    expect(surface?.className).toMatch(/(^|\s)bg-surface(\s|$)/)
    expect(surface?.className).toMatch(/(^|\s)ring-hairline(\s|$)/)
  })
})
