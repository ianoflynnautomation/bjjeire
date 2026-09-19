import type { HTMLAttributes, JSX } from 'react'
import { cn } from '@/lib/cn'

export const Card = function Card({
  className,
  ...props
}: HTMLAttributes<HTMLElement>): JSX.Element {
  return (
    <article
      className={cn(
        'group flex h-full w-full flex-col overflow-hidden rounded-xl',
        'bg-surface-solid ring-1 ring-hairline shadow-card',
        'transition-colors duration-200',
        'hover:ring-border-strong',
        'competition:hover:ring-accent-500/40',
        className
      )}
      {...props}
    />
  )
}

export { CardContent } from './card-content'
