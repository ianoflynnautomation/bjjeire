import type { JSX } from 'react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/cn'
import { GitHubIcon } from '@/components/ui/icons/github-icon'
import { env } from '@/config/env'
import { NavigationTestIds } from '@/constants/commonDataTestIds'
import { uiContent } from '@/config/ui-content'
import { useNavItems } from './use-nav-items'
import { useRoutePrefetch } from './route-prefetch'

const activeClass =
  'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
const inactiveClass =
  'border-transparent text-slate-500 hover:border-primary-500/40 hover:bg-black/4 hover:text-primary-600 dark:text-slate-400 dark:hover:bg-white/4 dark:hover:text-primary-300'

interface MobileMenuProps {
  onLinkClick: () => void
}

export const MobileMenu = function MobileMenu({
  onLinkClick,
}: MobileMenuProps): JSX.Element {
  const navItems = useNavItems()
  const prefetch = useRoutePrefetch()
  return (
    <div
      id="mobile-menu-panel"
      className="absolute z-30 w-full bg-white/95 shadow-xl ring-1 ring-black/6 backdrop-blur-xl sm:hidden dark:bg-slate-900/95 dark:ring-white/6"
      data-testid={NavigationTestIds.MOBILE_PANEL}
    >
      <div className="space-y-1 px-2 pb-3 pt-2">
        {navItems.map(({ id, to, label }) => (
          <NavLink
            key={id}
            to={to}
            viewTransition
            onClick={onLinkClick}
            onMouseEnter={() => prefetch(id)}
            onFocus={() => prefetch(id)}
            className={({ isActive }) =>
              cn(
                'block rounded-md border-l-4 px-3 py-2 text-base font-medium transition-colors',
                isActive ? activeClass : inactiveClass
              )
            }
            data-testid={NavigationTestIds.MOBILE_LINK}
          >
            {label}
          </NavLink>
        ))}
        {env.GITHUB_URL && (
          <a
            href={env.GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-3 rounded-md border-l-4 px-3 py-2 text-base font-medium',
              inactiveClass
            )}
            aria-label={uiContent.navigation.githubLinkLabel}
            data-testid={NavigationTestIds.GITHUB_LINK}
          >
            <GitHubIcon className="h-5 w-5" />
            {uiContent.navigation.githubLinkLabel}
          </a>
        )}
      </div>
    </div>
  )
}
