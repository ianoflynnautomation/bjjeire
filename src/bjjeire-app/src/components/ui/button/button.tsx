import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/lib/button-variants'

interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  variant,
  size,
  className,
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

const cardActionVariants = cva(
  'inline-flex min-h-11 w-full items-center justify-center gap-x-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200',
  {
    variants: {
      variant: {
        primary:
          'bg-linear-to-r from-emerald-600 via-emerald-500 to-green-500 hover:scale-[1.02] hover:from-emerald-700 hover:to-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2',
        unavailable:
          'cursor-not-allowed bg-slate-200 text-slate-500 opacity-70 dark:bg-slate-700 dark:text-slate-400',
      },
    },
    defaultVariants: { variant: 'primary' },
  }
)

interface CardActionButtonProps {
  href?: string
  icon: React.ReactNode
  children: React.ReactNode
  'aria-label': string
  title: string
  'data-testid'?: string
  className?: string
}

export function CardActionButton({
  href,
  icon,
  children,
  'aria-label': ariaLabel,
  title,
  'data-testid': dataTestId,
  className,
}: CardActionButtonProps): React.JSX.Element {
  const classes = cn(
    cardActionVariants({ variant: href ? 'primary' : 'unavailable' }),
    className
  )

  if (!href) {
    return (
      <button
        disabled
        aria-disabled="true"
        aria-label={ariaLabel}
        title={title}
        data-testid={dataTestId}
        className={classes}
      >
        {icon}
        {children}
      </button>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      title={title}
      data-testid={dataTestId}
      className={classes}
    >
      {icon}
      {children}
    </a>
  )
}
