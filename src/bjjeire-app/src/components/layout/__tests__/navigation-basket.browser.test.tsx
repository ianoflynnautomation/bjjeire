import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { afterEach, describe, expect, it } from 'vitest'
import Navigation from '../navigation'
import { NavigationTestIds } from '@/constants/commonDataTestIds'
import { BasketTestIds } from '@/constants/merchDataTestIds'
import { makeFeatureFlagWrapper } from '@/testing/render-utils'

// Every flag that adds an item to the bar, as on a stack with the shop open.
const wrapper = makeFeatureFlagWrapper({
  BjjEvents: true,
  Gyms: true,
  Competitions: true,
  Stores: true,
  BjjEireCompetitions: true,
  Merch: true,
})

describe('Navigation with the basket (browser, #6005)', () => {
  afterEach(async () => {
    await page.viewport(1280, 800)
  })

  it.each([320, 360, 390, 414, 768, 1024])(
    'given merch is on, when the page is %ipx wide, then the bar fits without scrolling sideways',
    async width => {
      await page.viewport(width, 800)
      await render(<Navigation />, { wrapper })

      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width)
    }
  )

  it('given a phone, when the visitor opens the menu, then it leads to the basket', async () => {
    await page.viewport(390, 800)
    const screen = await render(<Navigation />, { wrapper })

    await userEvent.click(screen.getByTestId(NavigationTestIds.MOBILE_TOGGLE))

    await expect
      .element(screen.getByTestId(BasketTestIds.MENU_LINK))
      .toBeVisible()
  })
})
