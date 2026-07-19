import { screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Navigation from '../navigation'
import { NavigationTestIds } from '@/constants/commonDataTestIds'
import { renderWithProviders } from '@/testing/render-utils'

// Navigation renders the theme toggle, whose useTheme hook reads localStorage.
vi.stubGlobal('localStorage', {
  getItem: vi.fn().mockReturnValue(null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
})

// Both flags enabled so the nav has Events + Gyms + About links to interact with.
const featureFlags = { BjjEvents: true, Gyms: true }

describe('Navigation', () => {
  describe('Mobile menu toggle', () => {
    it('given a closed menu, when the nav renders, then the toggle is collapsed and no panel is in the DOM', () => {
      renderWithProviders(<Navigation />, { featureFlags })

      expect(
        screen.getByTestId(NavigationTestIds.MOBILE_TOGGLE)
      ).toHaveAttribute('aria-expanded', 'false')
      expect(
        screen.queryByTestId(NavigationTestIds.MOBILE_PANEL)
      ).not.toBeInTheDocument()
    })

    it('given a closed menu, when the toggle is clicked, then the toggle expands and the panel appears', async () => {
      const { user } = renderWithProviders(<Navigation />, { featureFlags })

      await user.click(screen.getByTestId(NavigationTestIds.MOBILE_TOGGLE))

      expect(
        screen.getByTestId(NavigationTestIds.MOBILE_TOGGLE)
      ).toHaveAttribute('aria-expanded', 'true')
      expect(
        screen.getByTestId(NavigationTestIds.MOBILE_PANEL)
      ).toBeInTheDocument()
    })

    it('given an open menu, when the toggle is clicked again, then the menu collapses and the panel is removed', async () => {
      const { user } = renderWithProviders(<Navigation />, { featureFlags })

      const toggle = screen.getByTestId(NavigationTestIds.MOBILE_TOGGLE)
      await user.click(toggle)
      await user.click(toggle)

      expect(toggle).toHaveAttribute('aria-expanded', 'false')
      expect(
        screen.queryByTestId(NavigationTestIds.MOBILE_PANEL)
      ).not.toBeInTheDocument()
    })

    it('given an open menu, when a nav link is clicked, then the panel closes', async () => {
      const { user } = renderWithProviders(<Navigation />, { featureFlags })

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
})
