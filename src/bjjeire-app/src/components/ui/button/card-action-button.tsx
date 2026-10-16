import { memo } from 'react'
import type { ReactNode, JSX } from 'react'
import { cn } from '@/lib/cn'
import { cardActionVariants } from '@/lib/card-action-variants'

interface CardActionButtonProps {
  href?: string
  icon: ReactNode
  children: ReactNode
  'aria-label': string
  title: string
  'data-testid'?: string
  className?: string
}

export const CardActionButton = memo(function CardActionButton({
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
})
