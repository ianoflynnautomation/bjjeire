import { render } from 'vitest-browser-react'
import { userEvent, page } from 'vitest/browser'
import { describe, it, expect } from 'vitest'
import Navigation from '../navigation'
import { NavigationTestIds } from '@/constants/commonDataTestIds'
import { makeFeatureFlagWrapper } from '@/testing/render-utils'

const wrapper = makeFeatureFlagWrapper({ BjjEvents: true, Gyms: true })

describe('Navigation (browser)', () => {
  it('given page load, when Tab is pressed, then the logo link is focused', async () => {
    const screen = await render(<Navigation />, { wrapper })

    await page.elementLocator(document.body).click()
    await userEvent.tab()
    expect(document.activeElement).toBe(
      screen.getByTestId(NavigationTestIds.LOGO_LINK).element()
    )
  })

  it('given an open mobile menu, when tabbing, then every panel link gains focus', async () => {
    const screen = await render(<Navigation />, { wrapper })

    await userEvent.click(screen.getByTestId(NavigationTestIds.MOBILE_TOGGLE))

    const mobileLinks = screen
      .getByTestId(NavigationTestIds.MOBILE_LINK)
      .elements()
    const focusedElements: Element[] = []

    for (let i = 0; i < mobileLinks.length + 5; i++) {
      await userEvent.tab()
      if (document.activeElement) {
        focusedElements.push(document.activeElement)
      }
    }

    for (const link of mobileLinks) {
      expect(focusedElements).toContain(link)
    }
  })

  it('given an open mobile menu, when a link is Tab-focused, then :focus-visible matches', async () => {
    const screen = await render(<Navigation />, { wrapper })

    await userEvent.click(screen.getByTestId(NavigationTestIds.MOBILE_TOGGLE))

    const mobileLinks = screen
      .getByTestId(NavigationTestIds.MOBILE_LINK)
      .elements()
    let landed = false
    for (let i = 0; i < mobileLinks.length + 5; i++) {
      await userEvent.tab()
      if (mobileLinks.includes(document.activeElement as HTMLElement)) {
        landed = true
        expect(
          (document.activeElement as HTMLElement).matches(':focus-visible')
        ).toBe(true)
        break
      }
    }
    expect(landed).toBe(true)
  })
})
