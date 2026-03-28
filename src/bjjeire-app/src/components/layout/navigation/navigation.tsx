import { memo } from 'react'
import { Link } from 'react-router-dom'
import { Bars3Icon, SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import SupportModal from '@/components/support/support-modal'
import { BitcoinIcon } from '@/components/ui/icons/bitcoin-icon'
import { GitHubIcon } from '@/components/ui/icons/github-icon'
import { paths } from '@/config/paths'
import { NavigationTestIds } from '@/constants/commonDataTestIds'
import { uiContent } from '@/config/ui-content'
import { Button } from '@/components/ui/button/button'
import { env } from '@/config/env'
import { useTheme } from '@/hooks/useTheme'
import { useNavigationState } from '@/hooks/useNavigationState'
import { NavIconButton, navIconButtonClass } from './nav-icon-button'
import { DesktopNavLinks } from './desktop-nav-links'
import { MobileMenu } from './mobile-menu'

const Navigation = memo(function Navigation() {
  const {
    isSupportModalOpen,
    isMobileMenuOpen,
    openSupportModal,
    closeSupportModal,
    toggleMobileMenu,
    closeMobileMenu,
  } = useNavigationState()
  const { theme, toggleTheme } = useTheme()

  return (
    <>
      <nav
        className="sticky top-0 z-40 border-b border-black/6 bg-white/80 shadow-sm shadow-black/10 backdrop-blur-xl dark:border-white/6 dark:bg-slate-950/80 dark:shadow-black/20"
        data-testid={NavigationTestIds.ROOT}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex shrink-0 items-center">
                <Link
                  to={paths.home.getHref()}
                  className="bg-linear-to-r from-emerald-400 to-orange-400 bg-clip-text text-2xl font-black text-transparent transition-opacity hover:opacity-85"
                  data-testid={NavigationTestIds.LOGO_LINK}
                >
                  {uiContent.brand.displayName}
                </Link>
              </div>
              <DesktopNavLinks />
            </div>
            <div className="flex items-center gap-2">
              <NavIconButton
                onClick={toggleTheme}
                aria-label={
                  theme === 'dark'
                    ? 'Switch to light mode'
                    : 'Switch to dark mode'
                }
              >
                {theme === 'dark' ? (
                  <SunIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <MoonIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </NavIconButton>
              {env.GITHUB_URL && (
                <a
                  href={env.GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={navIconButtonClass}
                  aria-label={uiContent.navigation.githubLinkLabel}
                  data-testid={NavigationTestIds.GITHUB_LINK}
                >
                  <GitHubIcon className="h-5 w-5" />
                </a>
              )}
              <Button
                onClick={openSupportModal}
                variant="gradient"
                size="lg"
                className="ml-2 gap-3"
                data-testid={NavigationTestIds.SUPPORT_BUTTON}
              >
                <BitcoinIcon className="h-5 w-5" aria-hidden="true" />
                {uiContent.navigation.supportButtonLabel}
              </Button>
              <div className="ml-2 flex items-center sm:hidden">
                <button
                  onClick={toggleMobileMenu}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 text-slate-500 transition-colors hover:bg-black/6 hover:text-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 dark:text-slate-400 dark:hover:bg-white/6 dark:hover:text-emerald-400"
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-menu-panel"
                  data-testid={NavigationTestIds.MOBILE_TOGGLE}
                >
                  <span className="sr-only">
                    {uiContent.navigation.openMobileMenuLabel}
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
})

export default Navigation
