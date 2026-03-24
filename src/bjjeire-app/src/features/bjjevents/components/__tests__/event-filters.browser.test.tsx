import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import EventFilters from '../event-filters/event-filters'
import { ButtonGroupFilterTestIds } from '@/constants/commonDataTestIds'

// These tests verify browser-native behaviors:
// 1. Disabled buttons are skipped by the browser's natural Tab sequence
// 2. Keyboard Space/Enter on a focused toggle button fires the handler
// (jsdom's userEvent.tab() does not always reliably skip disabled elements)

const defaultProps = {
  selectedCity: 'all' as const,
  selectedType: 'all' as const,
  onCityChange: vi.fn(),
  onTypeChange: vi.fn(),
  disabled: false,
}

describe('EventFilters (browser)', () => {
  describe('Tab sequence — enabled', () => {
    it('all event type buttons are reachable via Tab', async () => {
      const user = userEvent.setup()
      render(<EventFilters {...defaultProps} />)

      const typeButtons = screen.getAllByTestId(ButtonGroupFilterTestIds.BUTTON)
      const focusedElements: Element[] = []

      // Tab enough times to pass the county select + all type buttons
      for (let i = 0; i < typeButtons.length + 2; i++) {
        await user.tab()
        if (document.activeElement && document.activeElement !== document.body) {
          focusedElements.push(document.activeElement)
        }
      }

      // Every event type button must have been focused at some point
      for (const button of typeButtons) {
        expect(focusedElements).toContain(button)
      }
    })
  })

  describe('Tab sequence — disabled', () => {
    it('no event type button receives focus via Tab when filters are disabled', async () => {
      const user = userEvent.setup()
      render(<EventFilters {...defaultProps} disabled={true} />)

      const typeButtons = screen.getAllByTestId(ButtonGroupFilterTestIds.BUTTON)
      typeButtons.forEach(btn => expect(btn).toBeDisabled())

      // Tab many times — the browser natively skips all disabled elements
      for (let i = 0; i < typeButtons.length + 5; i++) {
        await user.tab()
        expect(typeButtons).not.toContain(document.activeElement)
      }
    })
  })

  describe('Keyboard activation', () => {
    it('pressing Space on a focused event type button calls onTypeChange', async () => {
      const onTypeChange = vi.fn()
      const user = userEvent.setup()
      render(<EventFilters {...defaultProps} onTypeChange={onTypeChange} />)

      // Tab past the county select, then to the first type button ("All Types")
      await user.tab() // county select
      await user.tab() // "All Types" button

      const firstTypeButton = screen.getAllByTestId(
        ButtonGroupFilterTestIds.BUTTON
      )[0]
      expect(document.activeElement).toBe(firstTypeButton)

      await user.keyboard(' ') // Space activates a button in real browsers
      expect(onTypeChange).toHaveBeenCalledTimes(1)
    })

    it('pressing Enter on a focused event type button calls onTypeChange', async () => {
      const onTypeChange = vi.fn()
      const user = userEvent.setup()
      render(<EventFilters {...defaultProps} onTypeChange={onTypeChange} />)

      await user.tab() // county select
      await user.tab() // first type button

      await user.keyboard('{Enter}')
      expect(onTypeChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('aria-pressed state', () => {
    it('selected button has aria-pressed=true, others have aria-pressed=false', () => {
      render(<EventFilters {...defaultProps} selectedType="all" />)

      const typeButtons = screen.getAllByTestId(ButtonGroupFilterTestIds.BUTTON)
      // First button is "All Types" which matches selectedType="all"
      expect(typeButtons[0]).toHaveAttribute('aria-pressed', 'true')
      typeButtons.slice(1).forEach(btn =>
        expect(btn).toHaveAttribute('aria-pressed', 'false')
      )
    })
  })
})
