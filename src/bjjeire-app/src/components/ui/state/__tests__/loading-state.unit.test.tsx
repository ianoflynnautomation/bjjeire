import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LoadingState from '../loading-state'
import { LoadingStateTestIds } from '@/constants/commonDataTestIds'

describe('LoadingState light/dark surface', () => {
  it('given the loading state renders, then it carries both a light-mode and a dark-mode surface (not dark-only)', () => {
    render(<LoadingState message="Loading gyms..." />)

    const surface = screen
      .getAllByTestId(LoadingStateTestIds.ROOT)
      .find(el => el.className.includes('rounded-2xl'))

    expect(surface).toBeDefined()
    expect(surface!.className).toMatch(/(^|\s)bg-white\/70(\s|$)/)
    expect(surface!.className).toContain('dark:bg-slate-800/40')
  })
})
