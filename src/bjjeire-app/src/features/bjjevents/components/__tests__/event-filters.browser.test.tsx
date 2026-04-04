import { render } from 'vitest-browser-react'
import { userEvent, page } from '@vitest/browser/context'
import { describe, it, expect, vi } from 'vitest'
import EventFilters from '../event-filters/event-filters'
import { ButtonGroupFilterTestIds } from '@/constants/commonDataTestIds'

// These tests verify browser-native behaviors:
// 1. Disabled buttons are skipped by the browser's natural Tab sequence
// 2. Keyboard Space/Enter on a focused toggle button fires the handler
// (jsdom's userEvent.tab() does not always reliably skip disabled elements)
//
// Each test clicks document.body first to activate the page in Playwright headless —
// keyboard events (Tab) are only routed after at least one interaction.

const defaultProps = {
  selectedCity: 'all' as const,
  selectedType: 'all' as const,
  onCityChange: vi.fn(),
  onTypeChange: vi.fn(),
  disabled: false,
}

describe('EventFilters (browser)', () => {
  describe('Tab sequence — enabled', () => {
    it('all event type buttons are in Tab order', async () => {
      const screen = await render(<EventFilters {...defaultProps} />)

      await page.elementLocator(document.body).click()
      await userEvent.tab()
      const typeButtons = screen
        .getByTestId(ButtonGroupFilterTestIds.BUTTON)
        .all()
      for (const button of typeButtons) {
        await userEvent.tab()
        await expect.element(button).toHaveFocus()
      }
    })
  })

  describe('Tab sequence — disabled', () => {
    it('no event type button receives focus via Tab when filters are disabled', async () => {
      const screen = await render(
        <EventFilters {...defaultProps} disabled={true} />
      )

      const typeButtons = screen
        .getByTestId(ButtonGroupFilterTestIds.BUTTON)
        .elements()
      typeButtons.forEach(btn => expect(btn).toBeDisabled())

      await page.elementLocator(document.body).click()
      for (let i = 0; i < typeButtons.length + 5; i++) {
        await userEvent.tab()
        expect(typeButtons).not.toContain(document.activeElement)
      }
    })
  })

  describe('Keyboard activation', () => {
    it('pressing Space on a focused event type button calls onTypeChange', async () => {
      const onTypeChange = vi.fn()
      const screen = await render(
        <EventFilters {...defaultProps} onTypeChange={onTypeChange} />
      )

      await page.elementLocator(document.body).click()
      await userEvent.tab()
      await userEvent.tab()

      const firstTypeButton = screen
        .getByTestId(ButtonGroupFilterTestIds.BUTTON)
        .first()
      await expect.element(firstTypeButton).toHaveFocus()

      await userEvent.keyboard(' ')
      expect(onTypeChange).toHaveBeenCalledTimes(1)
    })

    it('pressing Enter on a focused event type button calls onTypeChange', async () => {
      const onTypeChange = vi.fn()
      await render(
        <EventFilters {...defaultProps} onTypeChange={onTypeChange} />
      )

      await page.elementLocator(document.body).click()
      await userEvent.tab()
      await userEvent.tab()

      await userEvent.keyboard('{Enter}')
      expect(onTypeChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('aria-pressed state', () => {
    it('selected button has aria-pressed=true, others have aria-pressed=false', async () => {
      const screen = await render(
        <EventFilters {...defaultProps} selectedType="all" />
      )

      const typeButtons = screen
        .getByTestId(ButtonGroupFilterTestIds.BUTTON)
        .elements()
      expect(typeButtons[0]).toHaveAttribute('aria-pressed', 'true')
      typeButtons
        .slice(1)
        .forEach(btn => expect(btn).toHaveAttribute('aria-pressed', 'false'))
    })
  })
})
