import type { JSX } from 'react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/cn'
import { NavigationTestIds } from '@/constants/commonDataTestIds'
import { useNavItems } from './use-nav-items'
import { useRoutePrefetch } from './route-prefetch'

const linkBaseClass =
  'relative inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:rounded-full after:bg-primary-500 after:transition-transform after:duration-200 after:ease-out motion-reduce:after:transition-none'
const activeClass = 'text-primary-600 after:scale-x-100 dark:text-primary-400'
const inactiveClass =
  'text-slate-500 after:scale-x-0 hover:text-primary-600 hover:after:scale-x-100 dark:text-slate-400 dark:hover:text-primary-300'

export const DesktopNavLinks = function DesktopNavLinks(): JSX.Element {
  const navItems = useNavItems()
  const prefetch = useRoutePrefetch()
  return (
    <div
      className="hidden sm:ml-6 sm:flex sm:space-x-8"
      data-testid={NavigationTestIds.DESKTOP_LINKS}
    >
      {navItems.map(item => (
        <NavLink
          key={item.id}
          to={item.to}
          viewTransition
          onMouseEnter={() => prefetch(item.id)}
          onFocus={() => prefetch(item.id)}
          className={({ isActive }) =>
            cn(linkBaseClass, isActive ? activeClass : inactiveClass)
          }
          data-testid={NavigationTestIds.DESKTOP_LINK}
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  )
}
