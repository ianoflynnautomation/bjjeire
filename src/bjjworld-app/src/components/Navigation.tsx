import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import SupportModal from './SupportModal';
import clsx from 'clsx';

interface NavItem {
  to: string;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/events', label: 'Events' },
  { to: '/gyms', label: 'Gyms' },
  { to: '/about', label: 'About' },
];

const BitcoinIcon = ({ className }: { className?: string }) => (
  <svg
    className={className || 'w-5 h-5'}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z"
      fill="currentColor"
      opacity="0.3"
    />
    <path
      d="M17.0921 10.1344C17.0921 6.80063 14.4006 5.40063 11.4006 5.40063H7.20063V18.6006H11.4006C14.4006 18.6006 17.0921 17.2006 17.0921 13.8669C17.0921 12.2672 16.2006 10.9344 17.0921 10.1344ZM11.4006 7.20063C13.2006 7.20063 14.4006 7.80063 14.4006 9.60063C14.4006 11.4006 13.2006 12.0006 11.4006 12.0006H9.60063V7.20063H11.4006ZM11.4006 16.8006H9.60063V12.0006H11.4006C13.2006 12.0006 14.4006 12.6006 14.4006 14.4006C14.4006 16.2006 13.2006 16.8006 11.4006 16.8006Z"
      fill="#F59E0B"
    />
  </svg>
);

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
);
// --- End of Icons ---

const Navigation = () => {
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeClassName = 'border-b-2 border-emerald-500 text-slate-800 dark:text-white dark:border-emerald-400';
  const inactiveClassName =
    'border-b-2 border-transparent text-emerald-700 hover:border-emerald-300 hover:text-emerald-600 dark:text-emerald-300 dark:hover:border-emerald-400 dark:hover:text-emerald-200';

  const baseTestId = 'main-navigation';

  return (
    <>
      <nav
        className="bg-emerald-50 dark:bg-slate-800 shadow-md sticky top-0 z-40"
        data-testid={baseTestId}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Desktop Nav Links */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link
                  to="/"
                  className="text-2xl font-bold text-slate-800 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400 transition-colors"
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
                className="ml-4 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-md text-sm font-medium hover:from-emerald-700 hover:to-emerald-800 transition-colors flex items-center gap-2 border border-emerald-600 shadow-sm dark:border-emerald-700 dark:from-emerald-500 dark:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                data-testid={`${baseTestId}-support-button`} // Test ID for support button
              >
                <BitcoinIcon className="w-5 h-5" />
                Support Project
              </button>

              {/* Mobile Menu Button */}
              <div className="ml-2 sm:hidden flex items-center">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-emerald-700 hover:text-emerald-600 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 dark:text-emerald-300 dark:hover:text-emerald-200 dark:hover:bg-slate-700 dark:focus:ring-emerald-400"
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
            className="sm:hidden bg-white dark:bg-slate-800 shadow-lg absolute w-full z-30"
            data-testid={`${baseTestId}-mobile-menu-panel`}
          >
            <div className="pt-2 pb-3 space-y-1 px-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors',
                      isActive
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-700 dark:bg-emerald-900/50 dark:border-emerald-400 dark:text-emerald-200'
                        : 'border-transparent text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 dark:text-emerald-300 dark:hover:bg-slate-700 dark:hover:border-emerald-400 dark:hover:text-emerald-200'
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
      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        // Pass a test ID to the modal if it accepts one
        // data-testid="support-modal"
      />
    </>
  );
};

export default Navigation;