import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GymViewSwitch } from '../gym-view-switch'

describe('GymViewSwitch (AC-GYM-007, AC-GYM-015)', () => {
  it('given the list view, when it renders, then the list is announced as the current view', () => {
    render(<GymViewSwitch view="list" onChange={vi.fn()} />)

    expect(
      screen.getByRole('group', { name: /view gyms/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: 'Map' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })

  it('given keyboard use, when the map button is activated, then the map view is requested', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<GymViewSwitch view="list" onChange={onChange} />)

    await user.tab()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Map' })).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(onChange).toHaveBeenCalledWith('map')
  })
})
