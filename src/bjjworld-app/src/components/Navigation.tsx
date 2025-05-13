import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'
import SupportModal from './SupportModal'
import clsx from 'clsx'
import { ReactComponent as BitcoinIcon } from '../assets/bitcoin.svg'

const HamburgerIcon = ({ className }: { className?: string }) => (
  <svg
    className={className || 'w-6 h-6'}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 6h16M4 12h16m-7 6h7"
    ></path>
  </svg>
)
// --- End of Icons ---

interface NavItem {
  to: string
  label: string
}

const navItems: NavItem[] = [
  { to: '/events', label: 'Events' },
  { to: '/gyms', label: 'Gyms' },
  { to: '/about', label: 'About' },
]

const Navigation = () => {
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const activeClassName =
    'border-b-2 border-emerald-500 text-slate-800 dark:text-white dark:border-emerald-400'
  const inactiveClassName =
    'border-b-2 border-transparent text-emerald-700 hover:border-emerald-300 hover:text-emerald-600 dark:text-emerald-300 dark:hover:border-emerald-400 dark:hover:text-emerald-200'

  const baseTestId = 'main-navigation'

  return (
    <>
      <nav
        className="bg-emerald-50 dark:bg-slate-800 shadow-md sticky top-0 z-40"
        data-testid={baseTestId}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            {/* Logo and Desktop Nav Links */}
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link
                  to="/"
                  className="text-2xl font-bold text-slate-800 transition-colors hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
                  data-testid={`${baseTestId}-logo-link`}
                >
                  BJJ Éire
                </Link>
              </div>
              {/* Desktop Nav Links Container */}
              <div
                className="hidden sm:ml-6 sm:flex sm:space-x-8"
                data-testid={`${baseTestId}-desktop-links`}
              >
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      clsx(
                        'inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors',
                        isActive ? activeClassName : inactiveClassName
                      )
                    }
                    data-testid={`${baseTestId}-desktop-link-${item.label.toLowerCase()}`}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Right side: Support Button and Mobile Menu Button */}
            <div className="flex items-center">
              {/* Support Button */}
              <button
                onClick={() => setIsSupportModalOpen(true)}
                // Increased padding, gap, and text size for better balance with a larger icon
                className="ml-4 flex items-center gap-3 rounded-md border border-emerald-600 bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-3 text-base font-medium text-white shadow-sm transition-colors hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:border-emerald-700 dark:from-emerald-500 dark:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-700 dark:focus:ring-offset-slate-800"
                data-testid={`${baseTestId}-support-button`}
              >
                {/* Increased icon size */}
                <BitcoinIcon className="h-6 w-6" aria-hidden="true" />
                {/* Shortened text for better balance */}
                Support
              </button>

              {/* Mobile Menu Button */}
              <div className="ml-2 flex items-center sm:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center rounded-md p-2 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 dark:text-emerald-300 dark:hover:bg-slate-700 dark:hover:text-emerald-200 dark:focus:ring-emerald-400"
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-menu-panel"
                  data-testid={`${baseTestId}-mobile-menu-toggle`}
                >
                  <span className="sr-only">Open main menu</span>
                  <HamburgerIcon />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {isMobileMenuOpen && (
          <div
            id="mobile-menu-panel"
            className="absolute z-30 w-full bg-white shadow-lg dark:bg-slate-800 sm:hidden"
            data-testid={`${baseTestId}-mobile-menu-panel`}
          >
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)} // Close menu on item click
                  className={({ isActive }) =>
                    clsx(
                      'block rounded-md border-l-4 px-3 py-2 text-base font-medium transition-colors', // Added rounded-md for consistency
                      isActive
                        ? 'border-emerald-500 bg-emerald-100 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-200'
                        : 'border-transparent text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 dark:text-emerald-300 dark:hover:border-emerald-400 dark:hover:bg-slate-700 dark:hover:text-emerald-200'
                    )
                  }
                  data-testid={`${baseTestId}-mobile-link-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>
      {/* Support Modal */}
      <SupportModal isOpen={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} />
    </>
  )
}

export default Navigation
