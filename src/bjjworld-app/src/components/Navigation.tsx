import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import SupportModal from './SupportModal';

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
  >
    <path
      d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z"
      fill="white"
    />
    <path
      d="M17.0921 10.1344C17.0921 6.80063 14.4006 5.40063 11.4006 5.40063H7.20063V18.6006H11.4006C14.4006 18.6006 17.0921 17.2006 17.0921 13.8669C17.0921 12.2672 16.2006 10.9344 17.0921 10.1344ZM11.4006 7.20063C13.2006 7.20063 14.4006 7.80063 14.4006 9.60063C14.4006 11.4006 13.2006 12.0006 11.4006 12.0006H9.60063V7.20063H11.4006ZM11.4006 16.8006H9.60063V12.0006H11.4006C13.2006 12.0006 14.4006 12.6006 14.4006 14.4006C14.4006 16.2006 13.2006 16.8006 11.4006 16.8006Z"
      fill="#F59E0B" // Warm Orange (#F57C00)
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
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 6h16M4 12h16m-7 6h7"
    ></path>
  </svg>
);

const Navigation = () => {
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeClassName = 'border-b-2 border-emerald-500 text-slate-800';
  const inactiveClassName =
    'border-b-2 border-transparent text-emerald-700 hover:border-emerald-300 hover:text-emerald-600';

  return (
    <>
      <nav className="bg-emerald-50 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Desktop Nav Links */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link
                  to="/"
                  className="text-2xl font-bold text-slate-800 hover:text-emerald-600 transition-colors"
                >
                  BJJ Éire
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `${isActive ? activeClassName : inactiveClassName} inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Right side: Support Button and Mobile Menu Button */}
            <div className="flex items-center">
              <button
                onClick={() => setIsSupportModalOpen(true)}
                className="ml-4 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-md text-sm font-medium hover:from-emerald-700 hover:to-emerald-800 transition-colors flex items-center gap-2 border border-emerald-600 shadow-sm"
              >
                <BitcoinIcon className="w-5 h-5" />
                Support Project
              </button>

              {/* Mobile Menu Button */}
              <div className="ml-2 sm:hidden flex items-center">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-emerald-700 hover:text-emerald-600 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
                  aria-expanded={isMobileMenuOpen}
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
          <div className="sm:hidden bg-white shadow-lg absolute w-full z-30">
            <div className="pt-2 pb-3 space-y-1 px-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `${isActive ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'border-transparent text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 hover:text-emerald-600'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>
      <SupportModal isOpen={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} />
    </>
  );
};

export default Navigation;