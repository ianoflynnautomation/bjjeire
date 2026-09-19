import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ListSearchInput } from '../list-search-input'

const content = {
  label: 'Search gyms',
  placeholder: 'Search gyms...',
  clearLabel: 'Clear search',
}

describe('ListSearchInput', () => {
  it('given an empty value, when the input renders, then the clear button is hidden', () => {
    render(
      <ListSearchInput
        inputId="gym-search"
        content={content}
        value=""
        onChange={vi.fn()}
        onClear={vi.fn()}
      />
    )

    expect(screen.getByRole('searchbox', { name: content.label })).toHaveValue(
      ''
    )
    expect(
      screen.queryByRole('button', { name: content.clearLabel })
    ).not.toBeInTheDocument()
  })

  it('given a value, when the clear button is clicked, then onClear is called', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    render(
      <ListSearchInput
        inputId="gym-search"
        content={content}
        value="Dublin"
        onChange={vi.fn()}
        onClear={onClear}
      />
    )

    await user.click(screen.getByRole('button', { name: content.clearLabel }))

    expect(onClear).toHaveBeenCalledOnce()
  })

  it('given a focused input, when Escape is pressed, then onClear is called', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    render(
      <ListSearchInput
        inputId="gym-search"
        content={content}
        value="Dublin"
        onChange={vi.fn()}
        onClear={onClear}
      />
    )

    screen.getByRole('searchbox', { name: content.label }).focus()
    await user.keyboard('{Escape}')

    expect(onClear).toHaveBeenCalledOnce()
  })
})
