import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl font-medium transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        gradient:
          'border border-primary-500/50 bg-linear-to-r from-primary-700 via-primary-600 to-primary-500 text-white shadow-sm hover:-translate-y-0.5 hover:from-primary-800 hover:to-primary-500 hover:shadow-md',
        accent:
          'border border-accent-500/50 bg-linear-to-r from-accent-700 via-accent-600 to-accent-500 text-white shadow-sm hover:-translate-y-0.5 hover:from-accent-800 hover:to-accent-500 hover:shadow-md hover:shadow-accent-900/30',
        solid:
          'border border-primary-500 bg-primary-700 text-white hover:bg-primary-800',
        outline:
          'border border-hairline bg-black/5 text-fg-muted hover:border-primary-500/50 hover:bg-primary-50 hover:text-primary-700 dark:bg-white/[0.05] dark:hover:bg-primary-900/30 dark:hover:text-primary-300',
        ghost:
          'border border-transparent bg-transparent text-primary-600 hover:bg-black/[0.06] hover:text-primary-700 dark:text-primary-400 dark:hover:bg-white/[0.06] dark:hover:text-primary-300',
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
