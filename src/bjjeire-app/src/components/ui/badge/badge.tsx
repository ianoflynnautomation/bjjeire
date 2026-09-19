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
          'bg-primary-100 text-primary-800 ring-primary-700/20 dark:bg-primary-900/50 dark:text-primary-300 dark:ring-primary-400/20',
        slate:
          'bg-ink-100 text-ink-700 ring-ink-400/30 dark:bg-ink-800 dark:text-ink-200 dark:ring-ink-500/30',
        amber:
          'bg-warning-50 text-warning-800 ring-warning-700/20 dark:bg-warning-950/50 dark:text-warning-400 dark:ring-warning-500/25',
        red: 'bg-danger-50 text-danger-700 ring-danger-600/20 dark:bg-danger-950/50 dark:text-danger-400 dark:ring-danger-500/25',
        blue: 'bg-info-500/10 text-info-600 ring-info-500/25 dark:bg-info-600/20 dark:text-info-400',
        neutral:
          'bg-ink-100 text-ink-700 ring-ink-400/30 dark:bg-ink-800 dark:text-ink-200 dark:ring-ink-500/30',
        beltWhite:
          'bg-ink-50 text-ink-700 ring-ink-400/40 dark:bg-white/10 dark:text-ink-50 dark:ring-white/20',
        beltBlue:
          'bg-blue-100 text-blue-800 ring-blue-700/20 dark:bg-blue-950/50 dark:text-blue-200 dark:ring-blue-400/25',
        beltPurple:
          'bg-violet-100 text-violet-800 ring-violet-700/20 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-500/25',
        beltBrown:
          'bg-accent-100 text-accent-800 ring-accent-600/25 dark:bg-accent-950/60 dark:text-accent-200 dark:ring-accent-500/30',
        beltBlack:
          'bg-ink-800 text-ink-50 ring-ink-600/40 dark:bg-ink-950 dark:text-ink-50 dark:ring-white/15',
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
