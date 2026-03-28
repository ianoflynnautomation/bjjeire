import { memo } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { GitHubIcon } from '@/components/ui/icons/github-icon'
import { env } from '@/config/env'
import { NavigationTestIds } from '@/constants/commonDataTestIds'
import { uiContent } from '@/config/ui-content'
import { navItems } from './nav-items'

const activeClass =
  'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
const inactiveClass =
  'border-transparent text-slate-500 hover:border-emerald-500/40 hover:bg-black/4 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-white/4 dark:hover:text-emerald-300'

interface MobileMenuProps {
  onLinkClick: () => void
}

export const MobileMenu = memo(function MobileMenu({
  onLinkClick,
}: MobileMenuProps) {
  return (
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
            onClick={onLinkClick}
            className={({ isActive }) =>
              cn(
                'block rounded-md border-l-4 px-3 py-2 text-base font-medium transition-colors',
                isActive ? activeClass : inactiveClass
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
})
