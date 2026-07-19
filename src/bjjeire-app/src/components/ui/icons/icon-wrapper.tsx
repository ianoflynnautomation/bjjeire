import type { ReactNode, JSX } from 'react'
import { cn } from '@/lib/cn'

interface IconWrapperProps {
  children: ReactNode
  className?: string
  'aria-hidden'?: boolean
}

export function IconWrapper({
  children,
  className = 'h-5 w-5 text-emerald-500 dark:text-emerald-400',
  'aria-hidden': ariaHidden = true,
}: IconWrapperProps): JSX.Element {
  return (
    <span className={cn('mt-0.5 shrink-0', className)} aria-hidden={ariaHidden}>
      {children}
    </span>
  )
}
