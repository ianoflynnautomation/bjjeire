import { memo } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { BadgeTestIds } from '@/constants/commonDataTestIds'

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-semibold uppercase tracking-wider ring-1',
  {
    variants: {
      colorScheme: {
        emerald: 'bg-emerald-900/40 text-emerald-300 ring-emerald-500/30',
        slate: 'bg-slate-700/50 text-slate-300 ring-slate-600/40',
        amber: 'bg-amber-900/40 text-amber-300 ring-amber-500/30',
        red: 'bg-red-900/40 text-red-300 ring-red-500/30',
        blue: 'bg-blue-900/40 text-blue-300 ring-blue-500/30',
        neutral: 'bg-slate-700/50 text-slate-300 ring-slate-600/40',
      },
      size: {
        xs: 'px-2.5 py-0.5 text-xs',
        sm: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: { colorScheme: 'neutral', size: 'xs' },
  }
)

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  text: string
  className?: string
  'data-testid'?: string
}

export const Badge = memo(function Badge({
  text,
  colorScheme,
  size,
  className,
  'data-testid': dataTestId = BadgeTestIds.ROOT,
}: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ colorScheme, size }), className)}
      data-testid={dataTestId}
    >
      {text}
    </span>
  )
})
