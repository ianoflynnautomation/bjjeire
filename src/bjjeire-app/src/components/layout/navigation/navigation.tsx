import { useEffect } from 'react'
import type { JSX } from 'react'
import { Link } from 'react-router'
import {
  Bars3Icon,
  SunIcon,
  MoonIcon,
  FireIcon,
} from '@heroicons/react/24/outline'
import SupportModal from '@/components/support/support-modal'
import { BitcoinIcon } from '@/components/ui/icons/bitcoin-icon'
import { GitHubIcon } from '@/components/ui/icons/github-icon'
import { paths } from '@/config/paths'
import { NavigationTestIds } from '@/constants/commonDataTestIds'
import { uiContent } from '@/config/ui-content'
import { Button } from '@/components/ui/button/button'
import { env } from '@/config/env'
import { cn } from '@/lib/cn'
import { useTheme } from '@/hooks/useTheme'
import { useNavigationState } from '@/hooks/useNavigationState'
import { NavIconButton, navIconButtonClass } from './nav-icon-button'
import { DesktopNavLinks } from './desktop-nav-links'
import { MobileMenu } from './mobile-menu'

const Navigation = function Navigation(): JSX.Element {
  const {
    isSupportModalOpen,
    isMobileMenuOpen,
    openSupportModal,
    closeSupportModal,
    toggleMobileMenu,
    closeMobileMenu,
  } = useNavigationState()
  const { theme, cycleTheme } = useTheme()

  useEffect(() => {
    if (!isMobileMenuOpen || isSupportModalOpen) {
      return
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') {
        return
      }
      event.preventDefault()
      closeMobileMenu()
    }
    document.addEventListener('keydown', onKeyDown)

    return (): void => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isMobileMenuOpen, isSupportModalOpen, closeMobileMenu])

  const themeCycle = {
    light: { Icon: SunIcon, nextLabel: uiContent.navigation.switchToDark },
    dark: {
      Icon: MoonIcon,
      nextLabel: uiContent.navigation.switchToCompetition,
    },
    competition: {
      Icon: FireIcon,
      nextLabel: uiContent.navigation.switchToLight,
    },
  }[theme]

  return (
    <>
      <nav
        className="sticky top-0 z-40 border-b border-hairline bg-surface-solid/92 backdrop-blur-md dark:bg-canvas/92"
        data-testid={NavigationTestIds.ROOT}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex shrink-0 items-center">
                <Link
                  to={paths.home.getHref()}
                  className="display-expanded text-xl font-bold sm:text-2xl text-fg transition-colors hover:text-primary-700 dark:hover:text-primary-300"
                  data-testid={NavigationTestIds.LOGO_LINK}
                >
                  {uiContent.brand.displayName}
                </Link>
              </div>
              <DesktopNavLinks />
            </div>
            <div className="flex items-center gap-2">
              <NavIconButton
                onClick={cycleTheme}
                aria-label={themeCycle.nextLabel}
              >
                <themeCycle.Icon className="h-5 w-5" aria-hidden="true" />
              </NavIconButton>
              {env.GITHUB_URL && (
                <a
                  href={env.GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(navIconButtonClass, 'max-md:hidden')}
                  aria-label={uiContent.navigation.githubLinkLabel}
                  data-testid={NavigationTestIds.GITHUB_LINK}
                >
                  <GitHubIcon className="h-5 w-5" />
                </a>
              )}
              <Button
                onClick={openSupportModal}
                variant="accent"
                size="lg"
                className="gap-2.5 sm:ml-2"
                data-testid={NavigationTestIds.SUPPORT_BUTTON}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white p-0.5">
                  <BitcoinIcon className="h-full w-full" aria-hidden="true" />
                </span>
                <span className="sr-only min-[400px]:not-sr-only">
                  {uiContent.navigation.supportButtonLabel}
                </span>
              </Button>
              <div className="flex items-center md:hidden">
                <button
                  onClick={toggleMobileMenu}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-fg-subtle transition-colors hover:bg-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus"
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-menu-panel"
                  data-testid={NavigationTestIds.MOBILE_TOGGLE}
                >
                  <span className="sr-only">
                    {isMobileMenuOpen
                      ? uiContent.navigation.closeMobileMenuLabel
                      : uiContent.navigation.openMobileMenuLabel}
                  </span>
                  <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
        {isMobileMenuOpen && <MobileMenu onLinkClick={closeMobileMenu} />}
      </nav>
      <SupportModal isOpen={isSupportModalOpen} onClose={closeSupportModal} />
    </>
  )
}

export default Navigation
