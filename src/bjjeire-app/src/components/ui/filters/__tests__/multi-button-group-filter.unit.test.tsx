import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { MultiButtonGroupFilter } from '../multi-button-group-filter'

const options = [
  { value: 'openmat', label: 'Open Mat' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'camp', label: 'Camp' },
]

function renderFilter(
  props: Partial<{
    selectedValues: string[]
    disabled: boolean
  }> = {}
): { onSelectionChange: ReturnType<typeof vi.fn> } {
  const onSelectionChange = vi.fn()
  render(
    <MultiButtonGroupFilter
      label="Event Type"
      allLabel="All"
      options={options}
      selectedValues={props.selectedValues ?? []}
      onSelectionChange={onSelectionChange}
      disabled={props.disabled}
    />
  )
  return { onSelectionChange }
}

describe('MultiButtonGroupFilter', () => {
  describe('toggling selection', () => {
    it('given an unselected option, when it is clicked, then it is added to the selection', async () => {
      const user = userEvent.setup()
      const { onSelectionChange } = renderFilter({
        selectedValues: ['openmat'],
      })

      await user.click(screen.getByRole('button', { name: 'Seminar' }))

      expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith([
        'openmat',
        'seminar',
      ])
    })

    it('given a selected option, when it is clicked, then it is removed from the selection', async () => {
      const user = userEvent.setup()
      const { onSelectionChange } = renderFilter({
        selectedValues: ['openmat', 'seminar'],
      })

      await user.click(screen.getByRole('button', { name: 'Open Mat' }))

      expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(['seminar'])
    })

    it('given an active selection, when the All button is clicked, then the selection is cleared', async () => {
      const user = userEvent.setup()
      const { onSelectionChange } = renderFilter({
        selectedValues: ['openmat', 'camp'],
      })

      await user.click(screen.getByRole('button', { name: 'All' }))

      expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith([])
    })
  })

  describe('aria-pressed state', () => {
    it('given no selection, when the filter renders, then only the All button is pressed', () => {
      renderFilter({ selectedValues: [] })

      expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
      for (const option of options) {
        expect(
          screen.getByRole('button', { name: option.label })
        ).toHaveAttribute('aria-pressed', 'false')
      }
    })

    it('given selected options, when the filter renders, then each selected option is pressed and the All button is not', () => {
      renderFilter({ selectedValues: ['openmat', 'camp'] })

      expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
        'aria-pressed',
        'false'
      )
      expect(screen.getByRole('button', { name: 'Open Mat' })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
      expect(screen.getByRole('button', { name: 'Seminar' })).toHaveAttribute(
        'aria-pressed',
        'false'
      )
      expect(screen.getByRole('button', { name: 'Camp' })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    })
  })

  describe('disabled state', () => {
    it('given disabled filters, when an option is clicked, then every button is disabled and no handler fires', async () => {
      const user = userEvent.setup()
      const { onSelectionChange } = renderFilter({ disabled: true })

      const buttons = screen.getAllByRole('button')
      for (const button of buttons) {
        expect(button).toBeDisabled()
      }

      await user.click(buttons[0])
      expect(onSelectionChange).not.toHaveBeenCalled()
    })
  })
})
