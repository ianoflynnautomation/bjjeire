import { memo } from 'react'
import type { HTMLAttributes, JSX } from 'react'
import { cn } from '@/lib/cn'

export const Card = memo(function Card({
  className,
  ...props
}: HTMLAttributes<HTMLElement>): JSX.Element {
  return (
    <article
      className={cn(
        'group flex h-full w-full max-w-sm flex-col overflow-hidden rounded-2xl',
        'bg-white/80 backdrop-blur-sm ring-1 ring-black/8 dark:bg-slate-800/50 dark:ring-white/8',
        'shadow-md shadow-black/10 transition-all duration-300 ease-in-out dark:shadow-black/30',
        'hover:-translate-y-1 hover:ring-emerald-500/30 hover:shadow-xl hover:shadow-black/20 dark:hover:shadow-black/40',
        className
      )}
      {...props}
    />
  )
})

export { CardContent } from './card-content'
