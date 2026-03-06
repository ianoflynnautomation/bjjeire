import React from 'react'
import { cn } from '@/lib/utils'

interface IconWrapperProps {
  children: React.ReactNode
  className?: string
  'aria-hidden'?: boolean
}

export const IconWrapper: React.FC<IconWrapperProps> = ({
  children,
  className = 'h-5 w-5 text-emerald-400',
  'aria-hidden': ariaHidden = true,
}) => {

  return (
    <span
      className={cn('mt-0.5 flex-shrink-0', className)}
      aria-hidden={ariaHidden}
    >
      {children}
    </span>
  )
}

export default IconWrapper
