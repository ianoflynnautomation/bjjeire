import { render } from 'vitest-browser-react'
import { userEvent } from '@vitest/browser/context'
import { describe, it, expect } from 'vitest'
import Navigation from '../navigation'
import { NavigationTestIds } from '@/constants/commonDataTestIds'
import { makeFeatureFlagWrapper } from '@/testing/render-utils'

// Both flags enabled so the nav has Events + Gyms + About links to interact with.
const wrapper = makeFeatureFlagWrapper({ BjjEvents: true, Gyms: true })

describe('Navigation (browser)', () => {
  describe('Mobile menu toggle — aria state and panel visibility', () => {
    it('toggle button starts with aria-expanded=false and no panel in DOM', async () => {
      const screen = await render(<Navigation />, { wrapper })
      await expect
        .element(screen.getByTestId(NavigationTestIds.MOBILE_TOGGLE))
        .toHaveAttribute('aria-expanded', 'false')
      await expect
        .element(screen.getByTestId(NavigationTestIds.MOBILE_PANEL))
        .not.toBeInTheDocument()
    })

    it('clicking the toggle sets aria-expanded=true and adds the panel to DOM', async () => {
      const screen = await render(<Navigation />, { wrapper })

      await userEvent.click(screen.getByTestId(NavigationTestIds.MOBILE_TOGGLE))

      await expect
        .element(screen.getByTestId(NavigationTestIds.MOBILE_TOGGLE))
        .toHaveAttribute('aria-expanded', 'true')
      await expect
        .element(screen.getByTestId(NavigationTestIds.MOBILE_PANEL))
        .toBeInTheDocument()
    })

    it('clicking the toggle a second time restores aria-expanded=false and removes the panel', async () => {
      const screen = await render(<Navigation />, { wrapper })

      const toggle = screen.getByTestId(NavigationTestIds.MOBILE_TOGGLE)
      await userEvent.click(toggle) // open
      await userEvent.click(toggle) // close

      await expect
        .element(screen.getByTestId(NavigationTestIds.MOBILE_TOGGLE))
        .toHaveAttribute('aria-expanded', 'false')
      await expect
        .element(screen.getByTestId(NavigationTestIds.MOBILE_PANEL))
        .not.toBeInTheDocument()
    })

    it('clicking a mobile nav link closes the panel', async () => {
      const screen = await render(<Navigation />, { wrapper })

      await userEvent.click(screen.getByTestId(NavigationTestIds.MOBILE_TOGGLE))
      const mobileLinks = screen
        .getByTestId(NavigationTestIds.MOBILE_LINK)
        .elements()
      await userEvent.click(mobileLinks[0])

      await expect
        .element(screen.getByTestId(NavigationTestIds.MOBILE_PANEL))
        .not.toBeInTheDocument()
      await expect
        .element(screen.getByTestId(NavigationTestIds.MOBILE_TOGGLE))
        .toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('Keyboard focus — Tab order', () => {
    it('logo link is the first Tab stop', async () => {
      const screen = await render(<Navigation />, { wrapper })

      await userEvent.tab()
      expect(document.activeElement).toBe(
        screen.getByTestId(NavigationTestIds.LOGO_LINK).element()
      )
    })

    it('mobile panel links are reachable via Tab after opening the menu', async () => {
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

    it('mobile panel links match :focus-visible on keyboard Tab', async () => {
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
})
