import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        gradient:
          'border border-primary-800/20 bg-primary-700 text-ink-50 hover:bg-primary-800 dark:bg-primary-500 dark:hover:bg-primary-600 dark:border-primary-400/20',
        accent:
          'border border-bitcoin/20 bg-bitcoin text-white hover:bg-bitcoin-hover',
        solid:
          'border border-primary-800/20 bg-primary-700 text-ink-50 hover:bg-primary-800 dark:bg-primary-500 dark:hover:bg-primary-600 dark:border-primary-400/20',
        outline:
          'border border-hairline bg-transparent text-fg-muted hover:border-border-strong hover:bg-muted hover:text-fg',
        ghost:
          'border border-transparent bg-transparent text-primary-700 hover:bg-muted hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-5 py-3 text-base',
      },
    },
    defaultVariants: { variant: 'gradient', size: 'md' },
  }
)
