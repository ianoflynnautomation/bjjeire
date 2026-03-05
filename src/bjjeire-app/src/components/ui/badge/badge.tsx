import React, { memo } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { BadgeTestIds } from '@/constants/commonDataTestIds'

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-semibold uppercase tracking-wider ring-1',
  {
    variants: {
      colorScheme: {
        emerald:
          'bg-emerald-100 text-emerald-800 ring-emerald-200',
        slate: 'bg-slate-100 text-slate-800 ring-slate-200',
        amber: 'bg-amber-100 text-amber-800 ring-amber-200',
        red: 'bg-red-100 text-red-800 ring-red-200',
        blue: 'bg-blue-100 text-blue-800 ring-blue-200',
        neutral: 'bg-gray-100 text-gray-800 ring-gray-200',
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

export const Badge: React.FC<BadgeProps> = ({
  text,
  colorScheme,
  size,
  className,
  'data-testid': dataTestId = BadgeTestIds.ROOT,
}) => {
  return (
    <span
      className={cn(badgeVariants({ colorScheme, size }), className)}
      data-testid={dataTestId}
    >
      {text}
    </span>
  )
}

export default memo(Badge)
