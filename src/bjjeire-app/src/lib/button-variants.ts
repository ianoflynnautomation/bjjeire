import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        gradient:
          'border border-emerald-500/50 bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-500 text-white shadow-sm hover:-translate-y-0.5 hover:from-emerald-700 hover:to-green-600 hover:shadow-md',
        solid:
          'border border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-700',
        outline:
          'border border-white/[0.12] bg-white/[0.05] text-slate-200 hover:border-emerald-500/50 hover:bg-emerald-900/30 hover:text-emerald-300',
        ghost:
          'border border-transparent bg-transparent text-emerald-400 hover:bg-white/[0.06] hover:text-emerald-300',
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
