import { memo } from 'react'
import type { ButtonHTMLAttributes, JSX } from 'react'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { buttonVariants } from '@/lib/button-variants'

interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = memo(function Button({
  variant,
  size,
  className,
  ...props
}: ButtonProps): JSX.Element {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
})

export { CardActionButton } from './card-action-button'
