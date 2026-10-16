import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import NoDataState from '../no-data-state'
import { uiContent } from '@/config/ui-content'

describe('NoDataState', () => {
  it('given the empty state, when it renders, then the title is a heading inside a status region', () => {
    render(<NoDataState />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: uiContent.shared.emptyTitle,
      })
    ).toBeInTheDocument()
  })

  it('given an action, when it renders, then the action is a button', () => {
    render(<NoDataState actionText="Clear filters" onActionClick={vi.fn()} />)

    expect(
      screen.getByRole('button', { name: 'Clear filters' })
    ).toBeInTheDocument()
  })
})
