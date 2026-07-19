import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ButtonGroupFilter from '../button-group-filter'

const options = [
  { value: 'gi', label: 'Gi' },
  { value: 'nogi', label: 'No-Gi' },
  { value: 'openmat', label: 'Open Mat' },
]

function renderFilter(
  props: Partial<{
    selectedValue: string
    disabled: boolean
  }> = {}
): { onValueChange: ReturnType<typeof vi.fn> } {
  const onValueChange = vi.fn()
  render(
    <ButtonGroupFilter
      label="Event Type"
      options={options}
      selectedValue={props.selectedValue ?? 'all'}
      onValueChange={onValueChange}
      disabled={props.disabled}
    />
  )
  return { onValueChange }
}

describe('ButtonGroupFilter', () => {
  it('given a set of options, when the filter renders, then the label and one button per option are shown', () => {
    renderFilter()

    expect(screen.getByText('Event Type')).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(options.length)
    for (const option of options) {
      expect(
        screen.getByRole('button', { name: option.label })
      ).toBeInTheDocument()
    }
  })

  it('given a selected option, when the filter renders, then only that option is pressed', () => {
    renderFilter({ selectedValue: 'nogi' })

    expect(screen.getByRole('button', { name: 'No-Gi' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: 'Gi' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
    expect(screen.getByRole('button', { name: 'Open Mat' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })

  it('given the "all" selection, when the filter renders, then no option is pressed', () => {
    renderFilter({ selectedValue: 'all' })

    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveAttribute('aria-pressed', 'false')
    }
  })

  it('given an option button, when it is clicked, then the change handler receives its value', async () => {
    const user = userEvent.setup()
    const { onValueChange } = renderFilter()

    await user.click(screen.getByRole('button', { name: 'No-Gi' }))

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('nogi')
  })

  it('given a disabled filter, when an option is clicked, then every button is disabled and no handler fires', async () => {
    const user = userEvent.setup()
    const { onValueChange } = renderFilter({ disabled: true })

    const buttons = screen.getAllByRole('button')
    for (const button of buttons) {
      expect(button).toBeDisabled()
    }

    await user.click(buttons[0])
    expect(onValueChange).not.toHaveBeenCalled()
  })
})
