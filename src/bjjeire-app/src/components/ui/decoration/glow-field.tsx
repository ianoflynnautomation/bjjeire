import type { JSX } from 'react'
import { cn } from '@/lib/cn'

interface GlowFieldProps {
  className?: string
}

export const GlowField = function GlowField({
  className,
}: GlowFieldProps): JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0', className)}
    >
      <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary-500/10 blur-2xl" />
      <div className="absolute -bottom-8 left-10 h-24 w-24 rounded-full bg-accent-500/10 blur-2xl" />
    </div>
  )
}
