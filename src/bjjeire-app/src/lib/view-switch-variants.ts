import { cva } from 'class-variance-authority'

export const viewSwitchButtonVariants = cva(
  'inline-flex min-h-11 min-w-16 items-center justify-center px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset',
  {
    variants: {
      selected: {
        // The usual focus token is the same green as this fill, so the ring would vanish.
        true: 'bg-primary-700 text-ink-50 focus-visible:ring-ink-50 dark:bg-primary-500',
        false:
          'bg-surface-solid text-fg-muted hover:bg-muted hover:text-fg focus-visible:ring-ring-focus',
      },
    },
    defaultVariants: { selected: false },
  }
)
