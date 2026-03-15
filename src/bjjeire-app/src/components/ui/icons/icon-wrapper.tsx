import React from 'react'
import { cn } from '@/lib/utils'

interface IconWrapperProps {
  children: React.ReactNode
  className?: string
  'aria-hidden'?: boolean
}

export function IconWrapper({
  children,
  className = 'h-5 w-5 text-emerald-400',
  'aria-hidden': ariaHidden = true,
}: IconWrapperProps): React.JSX.Element {
  return (
    <span className={cn('mt-0.5 shrink-0', className)} aria-hidden={ariaHidden}>
      {children}
    </span>
  )
}

export default IconWrapper
