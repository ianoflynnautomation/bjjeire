import React, { memo } from 'react'
import clsx from 'clsx'
import { BadgeTestIds } from '../../../constants/commonDataTestIds'

interface BadgeProps {
  text: string
  colorScheme?: 'emerald' | 'slate' | 'amber' | 'red' | 'blue' | 'neutral'
  size?: 'xs' | 'sm'
  className?: string
  'data-testid'?: string
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  colorScheme = 'neutral',
  size = 'xs',
  className,
  'data-testid': dataTestId = BadgeTestIds.ROOT(),
}) => {
  const baseClasses =
    'inline-flex items-center rounded-full font-semibold uppercase tracking-wider'

  const sizeClasses = {
    xs: 'px-2.5 py-0.5 text-xs',
    sm: 'px-3 py-1 text-sm',
  }

  const colorClasses = {
    emerald:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-700 dark:text-emerald-100',
    slate: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-700 dark:text-amber-100',
    red: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100',
    neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
  }

  return (
    <span
      className={clsx(
        baseClasses,
        sizeClasses[size],
        colorClasses[colorScheme],
        className
      )}
      data-testid={dataTestId}
    >
      {text}
    </span>
  )
}

export default memo(Badge)
