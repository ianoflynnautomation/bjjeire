import type { ReactNode, JSX } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const cardActionVariants = cva(
  'inline-flex min-h-11 w-full items-center justify-center gap-x-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors duration-150',
  {
    variants: {
      variant: {
        primary:
          'bg-primary-700 text-ink-50 hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas dark:bg-primary-500 dark:hover:bg-primary-600',
        unavailable: 'cursor-not-allowed bg-muted text-fg-subtle opacity-70',
      },
    },
    defaultVariants: { variant: 'primary' },
  }
)

interface CardActionButtonProps {
  href?: string
  icon: ReactNode
  children: ReactNode
  'aria-label': string
  title: string
  'data-testid'?: string
  className?: string
}

export function CardActionButton({
  href,
  icon,
  children,
  'aria-label': ariaLabel,
  title,
  'data-testid': dataTestId,
  className,
}: CardActionButtonProps): JSX.Element {
  const classes = cn(
    cardActionVariants({ variant: href ? 'primary' : 'unavailable' }),
    className
  )

  if (!href) {
    return (
      <button
        disabled
        aria-disabled="true"
        aria-label={ariaLabel}
        title={title}
        data-testid={dataTestId}
        className={classes}
      >
        {icon}
        {children}
      </button>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      title={title}
      data-testid={dataTestId}
      className={classes}
    >
      {icon}
      {children}
    </a>
  )
}
