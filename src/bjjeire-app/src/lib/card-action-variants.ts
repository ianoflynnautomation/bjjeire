import { cva } from 'class-variance-authority'

export const cardActionVariants = cva(
  'inline-flex min-h-11 w-full items-center justify-center gap-x-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors duration-150',
  {
    variants: {
      variant: {
        primary:
          'bg-primary-700 text-ink-50 hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas dark:bg-primary-500 dark:hover:bg-primary-600',
        unavailable: 'cursor-not-allowed bg-muted text-fg-subtle opacity-70',
      },
    },
    defaultVariants: { variant: 'primary' },
  }
)
