import { memo } from 'react'
import type { ReactNode } from 'react'

export const navIconButtonClass =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 text-slate-500 transition-colors hover:bg-black/6 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 dark:text-slate-400 dark:hover:bg-white/6 dark:hover:text-slate-100'

interface NavIconButtonProps {
  onClick: () => void
  'aria-label': string
  'data-testid'?: string
  children: ReactNode
}

export const NavIconButton = memo(function NavIconButton({
  onClick,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
  children,
}: NavIconButtonProps) {
  return (
    <button
      onClick={onClick}
      className={navIconButtonClass}
      aria-label={ariaLabel}
      data-testid={dataTestId}
    >
      {children}
    </button>
  )
})
