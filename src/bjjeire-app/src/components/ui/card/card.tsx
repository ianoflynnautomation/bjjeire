import React from 'react'
import { cn } from '@/lib/utils'

export function Card({
  className,
  ...props
}: Readonly<React.HTMLAttributes<HTMLElement>>): React.JSX.Element {
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
}

export function CardContent({
  className,
  ...props
}: Readonly<React.HTMLAttributes<HTMLDivElement>>): React.JSX.Element {
  return (
    <div
      className={cn('flex flex-1 flex-col p-2 sm:p-3', className)}
      {...props}
    />
  )
}
