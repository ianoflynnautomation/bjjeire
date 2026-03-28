import { memo } from 'react'
import type { HTMLAttributes, JSX } from 'react'
import { cn } from '@/lib/cn'

export const CardContent = memo(function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div
      className={cn('flex flex-1 flex-col p-2 sm:p-3', className)}
      {...props}
    />
  )
})
