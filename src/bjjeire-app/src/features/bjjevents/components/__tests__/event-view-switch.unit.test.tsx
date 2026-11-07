import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EventViewSwitch } from '../event-view-switch'

describe('EventViewSwitch (AC-EVT-007, AC-EVT-016)', () => {
  it('given the list view, when it renders, then the list is announced as the current view', () => {
    render(<EventViewSwitch view="list" onChange={vi.fn()} />)

    expect(
      screen.getByRole('group', { name: /view events/i })
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
    render(<EventViewSwitch view="list" onChange={onChange} />)

    await user.tab()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Map' })).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(onChange).toHaveBeenCalledWith('map')
  })
})
