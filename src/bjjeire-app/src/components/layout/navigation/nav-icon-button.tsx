import type { JSX, ReactNode } from 'react'

export const navIconButtonClass =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-fg-subtle transition-colors hover:bg-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus'

interface NavIconButtonProps {
  onClick: () => void
  'aria-label': string
  'data-testid'?: string
  children: ReactNode
}

export const NavIconButton = function NavIconButton({
  onClick,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
  children,
}: NavIconButtonProps): JSX.Element {
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
}
