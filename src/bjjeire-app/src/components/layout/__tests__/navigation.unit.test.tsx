import { screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Navigation from '../navigation'
import { NavigationTestIds } from '@/constants/commonDataTestIds'
import { CompetitorNavTestIds } from '@/constants/competitorDataTestIds'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
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
  describe('Competitor account entry point', () => {
    // #5038: no account entry point while the feature is off.
    it('given the tournaments flag is off, when the nav renders, then there is no account link', () => {
      renderWithProviders(<Navigation />, { featureFlags })

      expect(
        screen.queryByTestId(CompetitorNavTestIds.ACCOUNT_LINK)
      ).not.toBeInTheDocument()
    })

    it('given the tournaments flag is on, when the nav renders, then the account link leads to the profile page', () => {
      renderWithProviders(<Navigation />, {
        featureFlags: { ...featureFlags, Tournaments: true },
      })

      const link = screen.getByTestId(CompetitorNavTestIds.ACCOUNT_LINK)
      expect(link).toHaveAttribute('href', paths.accountProfile.getHref())
      expect(link).toHaveAccessibleName(uiContent.competitor.accountLink)
    })
  })

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

    it('given an open menu, when Escape is pressed, then the panel closes', async () => {
      const { user } = renderWithProviders(<Navigation />, { featureFlags })

      await user.click(screen.getByTestId(NavigationTestIds.MOBILE_TOGGLE))
      expect(
        screen.getByRole('button', {
          name: uiContent.navigation.closeMobileMenuLabel,
        })
      ).toHaveAttribute('aria-expanded', 'true')

      await user.keyboard('{Escape}')

      expect(
        screen.queryByTestId(NavigationTestIds.MOBILE_PANEL)
      ).not.toBeInTheDocument()
      expect(
        screen.getByRole('button', {
          name: uiContent.navigation.openMobileMenuLabel,
        })
      ).toHaveAttribute('aria-expanded', 'false')
    })
  })
})
