import type { JSX } from 'react'
import { cn } from '@/lib/cn'

interface TricolorEdgeProps {
  className?: string
}

export const TricolorEdge = function TricolorEdge({
  className,
}: TricolorEdgeProps): JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-[image:var(--gradient-tricolor)]',
        className
      )}
    />
  )
}
