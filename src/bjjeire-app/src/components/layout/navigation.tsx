import type React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'
import { Bars3Icon, SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import SupportModal from '@/components/support/support-modal'
import { cn } from '@/lib/utils'
import { BitcoinIcon } from '@/components/ui/icons/bitcoin-icon'
import { GitHubIcon } from '@/components/ui/icons/github-icon'
import { paths } from '@/config/paths'
import { NavigationTestIds } from '@/constants/commonDataTestIds'
import { uiContent } from '@/config/ui-content'
import { Button } from '@/components/ui/button/button'
import { env } from '@/config/env'
import { useTheme } from '@/hooks/useTheme'

const navItems = [
  {
    to: paths.events.getHref(),
    label: paths.events.label,
    id: 'events' as const,
  },
  { to: paths.gyms.getHref(), label: paths.gyms.label, id: 'gyms' as const },
  { to: paths.about.getHref(), label: paths.about.label, id: 'about' as const },
]

const Navigation = (): React.JSX.Element => {
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const activeClassName =
    'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400'
  const inactiveClassName =
    'border-b-2 border-transparent text-slate-500 hover:border-emerald-500/50 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-300'

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
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map(item => (
                  <NavLink
                    key={item.id}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors',
                        isActive ? activeClassName : inactiveClassName
                      )
                    }
                    data-testid={NavigationTestIds.DESKTOP_LINK}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 text-slate-500 transition-colors hover:bg-black/6 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 dark:text-slate-400 dark:hover:bg-white/6 dark:hover:text-slate-100"
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
              </button>
              {env.GITHUB_URL && (
                <a
                  href={env.GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 text-slate-500 transition-colors hover:bg-black/6 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 dark:text-slate-400 dark:hover:bg-white/6 dark:hover:text-slate-100"
                  aria-label={uiContent.navigation.githubLinkLabel}
                  data-testid={NavigationTestIds.GITHUB_LINK}
                >
                  <GitHubIcon className="h-5 w-5" />
                </a>
              )}
              <Button
                onClick={() => setIsSupportModalOpen(true)}
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
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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

        {isMobileMenuOpen && (
          <div
            id="mobile-menu-panel"
            className="absolute z-30 w-full bg-white/95 shadow-xl ring-1 ring-black/6 backdrop-blur-xl sm:hidden dark:bg-slate-900/95 dark:ring-white/6"
            data-testid={NavigationTestIds.MOBILE_PANEL}
          >
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navItems.map(item => (
                <NavLink
                  key={item.id}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-md border-l-4 px-3 py-2 text-base font-medium transition-colors',
                      isActive
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'border-transparent text-slate-500 hover:border-emerald-500/40 hover:bg-black/4 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-white/4 dark:hover:text-emerald-300'
                    )
                  }
                  data-testid={NavigationTestIds.MOBILE_LINK}
                >
                  {item.label}
                </NavLink>
              ))}
              {env.GITHUB_URL && (
                <a
                  href={env.GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-md border-l-4 border-transparent px-3 py-2 text-base font-medium text-slate-500 transition-colors hover:border-emerald-500/40 hover:bg-black/4 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-white/4 dark:hover:text-emerald-300"
                  aria-label={uiContent.navigation.githubLinkLabel}
                  data-testid={NavigationTestIds.GITHUB_LINK}
                >
                  <GitHubIcon className="h-5 w-5" />
                  {uiContent.navigation.githubLinkLabel}
                </a>
              )}
            </div>
          </div>
        )}
      </nav>
      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </>
  )
}

export default Navigation
