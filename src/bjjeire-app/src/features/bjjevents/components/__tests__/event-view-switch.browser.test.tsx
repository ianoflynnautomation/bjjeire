import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { contrast, over, parseColour } from '@/testing/contrast'
import { EventViewSwitch } from '../event-view-switch'

/** The focus ring is the first coloured layer of the button's box-shadow. */
function ringColour(button: Element): string {
  const shadow = getComputedStyle(button).boxShadow
  const layer = shadow
    .split(/,(?![^(]*\))/)
    .find(part => !/rgba\(0, 0, 0, 0\)|transparent/.test(part))
  const colour = layer?.match(/(?:rgba?|oklch|oklab|color)\([^)]*\)/)?.[0]
  if (!colour) {
    throw new Error(`no focus ring in "${shadow}"`)
  }
  return colour
}

afterEach(() => {
  document.documentElement.className = ''
})

describe('EventViewSwitch focus indicator (#2016)', () => {
  it.each([
    ['light', ''],
    ['dark', 'dark'],
    ['competition', 'dark competition'],
  ])(
    'given the %s theme, when each button takes keyboard focus, then its ring has at least 3:1 contrast',
    async (_theme, className) => {
      document.documentElement.className = className
      await render(<EventViewSwitch view="list" onChange={vi.fn()} />)

      await page.elementLocator(document.body).click()
      for (const name of ['List', 'Map']) {
        await userEvent.tab()
        const button = page.getByRole('button', { name }).element()
        expect(document.activeElement).toBe(button)
        const background = parseColour(getComputedStyle(button).backgroundColor)
        const ring = over(parseColour(ringColour(button)), background)

        expect(contrast(ring, background)).toBeGreaterThanOrEqual(3)
      }
    }
  )
})
