import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import Navigation from '../navigation'
import { NavigationTestIds } from '@/constants/commonDataTestIds'

// These tests verify browser-native behaviors that jsdom cannot reliably model:
// 1. aria-expanded state is kept in sync with real DOM panel presence
// 2. Clicking a mobile link closes the panel (real click → React state → real DOM update)
// 3. Logo link is keyboard-reachable (real Tab; jsdom tab order is approximate)
// 4. Focus lands on interactive elements in the expected order

function renderNav(): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <Navigation />
    </MemoryRouter>
  )
}

describe('Navigation (browser)', () => {
  describe('Mobile menu toggle — aria state and panel visibility', () => {
    it('toggle button starts with aria-expanded=false and no panel in DOM', () => {
      renderNav()
      const toggle = screen.getByTestId(NavigationTestIds.MOBILE_TOGGLE)
      expect(toggle).toHaveAttribute('aria-expanded', 'false')
      expect(
        screen.queryByTestId(NavigationTestIds.MOBILE_PANEL)
      ).not.toBeInTheDocument()
    })

    it('clicking the toggle sets aria-expanded=true and adds the panel to DOM', async () => {
      const user = userEvent.setup()
      renderNav()

      const toggle = screen.getByTestId(NavigationTestIds.MOBILE_TOGGLE)
      await user.click(toggle)

      expect(toggle).toHaveAttribute('aria-expanded', 'true')
      expect(
        screen.getByTestId(NavigationTestIds.MOBILE_PANEL)
      ).toBeInTheDocument()
    })

    it('clicking the toggle a second time restores aria-expanded=false and removes the panel', async () => {
      const user = userEvent.setup()
      renderNav()

      const toggle = screen.getByTestId(NavigationTestIds.MOBILE_TOGGLE)
      await user.click(toggle) // open
      await user.click(toggle) // close

      expect(toggle).toHaveAttribute('aria-expanded', 'false')
      expect(
        screen.queryByTestId(NavigationTestIds.MOBILE_PANEL)
      ).not.toBeInTheDocument()
    })

    it('clicking a mobile nav link closes the panel', async () => {
      const user = userEvent.setup()
      renderNav()

      await user.click(screen.getByTestId(NavigationTestIds.MOBILE_TOGGLE))
      const mobileLinks = screen.getAllByTestId(NavigationTestIds.MOBILE_LINK)
      await user.click(mobileLinks[0])

      expect(
        screen.queryByTestId(NavigationTestIds.MOBILE_PANEL)
      ).not.toBeInTheDocument()
      expect(
        screen.getByTestId(NavigationTestIds.MOBILE_TOGGLE)
      ).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('Keyboard focus — Tab order', () => {
    it('logo link is the first Tab stop', async () => {
      const user = userEvent.setup()
      renderNav()

      await user.tab()
      expect(document.activeElement).toBe(
        screen.getByTestId(NavigationTestIds.LOGO_LINK)
      )
    })

    it('mobile panel links are reachable via Tab after opening the menu', async () => {
      const user = userEvent.setup()
      renderNav()

      const toggle = screen.getByTestId(NavigationTestIds.MOBILE_TOGGLE)
      await user.click(toggle)

      const mobileLinks = screen.getAllByTestId(NavigationTestIds.MOBILE_LINK)
      const focusedElements: Element[] = []

      for (let i = 0; i < mobileLinks.length + 5; i++) {
        await user.tab()
        if (document.activeElement) {
          focusedElements.push(document.activeElement)
        }
      }

      for (const link of mobileLinks) {
        expect(focusedElements).toContain(link)
      }
    })

    it('mobile panel links match :focus-visible on keyboard Tab', async () => {
      const user = userEvent.setup()
      renderNav()

      await user.click(screen.getByTestId(NavigationTestIds.MOBILE_TOGGLE))

      // Tab until we land on a mobile link
      const mobileLinks = screen.getAllByTestId(NavigationTestIds.MOBILE_LINK)
      let landed = false
      for (let i = 0; i < mobileLinks.length + 5; i++) {
        await user.tab()
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
