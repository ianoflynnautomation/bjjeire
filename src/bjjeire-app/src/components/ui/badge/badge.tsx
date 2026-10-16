import { memo } from 'react'
import type { JSX } from 'react'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { badgeVariants } from '@/lib/badge-variants'
import { BadgeTestIds } from '@/constants/commonDataTestIds'

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
}: BadgeProps): JSX.Element {
  return (
    <span
      className={cn(badgeVariants({ colorScheme, size }), className)}
      data-testid={dataTestId}
    >
      {text}
    </span>
  )
})
