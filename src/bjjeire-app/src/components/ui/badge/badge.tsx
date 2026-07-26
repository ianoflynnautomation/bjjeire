import type { JSX } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { BadgeTestIds } from '@/constants/commonDataTestIds'

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-semibold uppercase tracking-wider ring-1',
  {
    variants: {
      colorScheme: {
        emerald:
          'bg-primary-100 text-primary-700 ring-primary-500/30 dark:bg-primary-900/40 dark:text-primary-300',
        slate:
          'bg-ink-100 text-ink-600 ring-ink-400/40 dark:bg-ink-700/50 dark:text-ink-300 dark:ring-ink-500/40',
        amber:
          'bg-warning-50 text-warning-800 ring-warning-500/30 dark:bg-warning-950/40 dark:text-warning-500',
        red: 'bg-danger-500/10 text-danger-500 ring-danger-500/30 dark:bg-danger-950/40 dark:text-danger-400',
        blue: 'bg-blue-100 text-blue-700 ring-blue-500/30 dark:bg-blue-900/40 dark:text-blue-300',
        neutral:
          'bg-ink-100 text-ink-600 ring-ink-400/40 dark:bg-ink-700/50 dark:text-ink-300 dark:ring-ink-500/40',
        beltWhite:
          'bg-ink-100 text-ink-700 ring-ink-400/50 dark:bg-white/10 dark:text-ink-100 dark:ring-white/25',
        beltBlue:
          'bg-blue-100 text-blue-700 ring-blue-500/30 dark:bg-blue-900/40 dark:text-blue-300',
        beltPurple:
          'bg-violet-100 text-violet-700 ring-violet-500/30 dark:bg-violet-900/40 dark:text-violet-300',
        beltBrown:
          'bg-amber-100 text-amber-800 ring-amber-700/30 dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-700/40',
        beltBlack:
          'bg-ink-800 text-ink-100 ring-ink-500/40 dark:bg-ink-950 dark:text-ink-100 dark:ring-white/15',
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

export const Badge = function Badge({
  text,
  colorScheme,
  size,
  className,
  'data-testid': dataTestId = BadgeTestIds.ROOT,
}: BadgeProps): JSX.Element {
  return (
    <span
      className={cn(badgeVariants({ colorScheme, size }), className)}
      data-testid={dataTestId}
    >
      {text}
    </span>
  )
}
