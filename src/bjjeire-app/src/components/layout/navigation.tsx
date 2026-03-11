import type React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'
import { Bars3Icon } from '@heroicons/react/24/outline'
import SupportModal from '@/components/support/support-modal'
import { cn } from '@/lib/utils'
import { ReactComponent as BitcoinIcon } from '@/assets/bitcoin.svg'
import { paths } from '@/config/paths'
import { NavigationTestIds } from '@/constants/commonDataTestIds'
import { uiContent } from '@/config/ui-content'
import { Button } from '@/components/ui/button/button'

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

  const activeClassName = 'border-b-2 border-emerald-500 text-emerald-400'
  const inactiveClassName =
    'border-b-2 border-transparent text-slate-400 hover:border-emerald-500/50 hover:text-emerald-300'

  return (
    <>
      <nav
        className="sticky top-0 z-40 border-b border-white/[0.06] bg-slate-950/80 shadow-sm shadow-black/20 backdrop-blur-xl"
        data-testid={NavigationTestIds.ROOT}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link
                  to={paths.home.getHref()}
                  className="bg-gradient-to-r from-emerald-400 to-orange-400 bg-clip-text text-2xl font-black text-transparent transition-opacity hover:opacity-85"
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
            <div className="flex items-center">
              <Button
                onClick={() => setIsSupportModalOpen(true)}
                variant="gradient"
                size="lg"
                className="ml-4 gap-3"
                data-testid={NavigationTestIds.SUPPORT_BUTTON}
              >
                <BitcoinIcon className="h-5 w-5" aria-hidden="true" />
                {uiContent.navigation.supportButtonLabel}
              </Button>

              <div className="ml-2 flex items-center sm:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
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
            className="absolute z-30 w-full bg-slate-900/95 shadow-xl ring-1 ring-white/[0.06] backdrop-blur-xl sm:hidden"
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
                        ? 'border-emerald-500 bg-emerald-900/30 text-emerald-300'
                        : 'border-transparent text-slate-400 hover:border-emerald-500/40 hover:bg-white/[0.04] hover:text-emerald-300'
                    )
                  }
                  data-testid={NavigationTestIds.MOBILE_LINK}
                >
                  {item.label}
                </NavLink>
              ))}
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
