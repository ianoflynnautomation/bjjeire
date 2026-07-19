import { render } from 'vitest-browser-react'
import { userEvent, page } from 'vitest/browser'
import { describe, it, expect, vi } from 'vitest'
import { EventFilters } from '../event-filters/event-filters'
import { ButtonGroupFilterTestIds } from '@/constants/commonDataTestIds'
import type { BjjEventType } from '@/types/event'

const defaultProps = {
  selectedCity: 'all' as const,
  selectedTypes: [] as BjjEventType[],
  onCityChange: vi.fn(),
  onTypesChange: vi.fn(),
  disabled: false,
}

describe('EventFilters (browser)', () => {
  it('given enabled filters, when tabbing, then each button gains focus', async () => {
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

  it('given disabled filters, when tabbing, then no button gains focus', async () => {
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

  it('given a focused type button, when Space is pressed, then it toggles', async () => {
    const onTypesChange = vi.fn()
    const screen = await render(
      <EventFilters {...defaultProps} onTypesChange={onTypesChange} />
    )

    await page.elementLocator(document.body).click()
    await userEvent.tab()
    await userEvent.tab()

    const firstTypeButton = screen
      .getByTestId(ButtonGroupFilterTestIds.BUTTON)
      .first()
    await expect.element(firstTypeButton).toHaveFocus()

    await userEvent.keyboard(' ')
    expect(onTypesChange).toHaveBeenCalledTimes(1)
  })

  it('given a focused type button, when Enter is pressed, then it toggles', async () => {
    const onTypesChange = vi.fn()
    await render(
      <EventFilters {...defaultProps} onTypesChange={onTypesChange} />
    )

    await page.elementLocator(document.body).click()
    await userEvent.tab()
    await userEvent.tab()

    await userEvent.keyboard('{Enter}')
    expect(onTypesChange).toHaveBeenCalledTimes(1)
  })
})
