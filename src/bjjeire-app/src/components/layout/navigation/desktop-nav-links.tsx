import { memo } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { NavigationTestIds } from '@/constants/commonDataTestIds'
import { navItems } from './nav-items'

const activeClass =
  'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400'
const inactiveClass =
  'border-b-2 border-transparent text-slate-500 hover:border-emerald-500/50 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-300'

export const DesktopNavLinks = memo(function DesktopNavLinks() {
  return (
    <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
      {navItems.map(item => (
        <NavLink
          key={item.id}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors',
              isActive ? activeClass : inactiveClass
            )
          }
          data-testid={NavigationTestIds.DESKTOP_LINK}
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  )
})
