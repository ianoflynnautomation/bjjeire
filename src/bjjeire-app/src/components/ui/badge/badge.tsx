import { memo } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { BadgeTestIds } from '@/constants/commonDataTestIds'

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-semibold uppercase tracking-wider ring-1',
  {
    variants: {
      colorScheme: {
        emerald: 'bg-emerald-100 text-emerald-700 ring-emerald-500/30 dark:bg-emerald-900/40 dark:text-emerald-300',
        slate: 'bg-slate-100 text-slate-600 ring-slate-400/40 dark:bg-slate-700/50 dark:text-slate-300 dark:ring-slate-600/40',
        amber: 'bg-amber-100 text-amber-700 ring-amber-500/30 dark:bg-amber-900/40 dark:text-amber-300',
        red: 'bg-red-100 text-red-700 ring-red-500/30 dark:bg-red-900/40 dark:text-red-300',
        blue: 'bg-blue-100 text-blue-700 ring-blue-500/30 dark:bg-blue-900/40 dark:text-blue-300',
        neutral: 'bg-slate-100 text-slate-600 ring-slate-400/40 dark:bg-slate-700/50 dark:text-slate-300 dark:ring-slate-600/40',
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
