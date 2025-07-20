import React, { memo } from 'react'

interface DetailItemProps {
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
  ariaLabel?: string
  'data-testid'?: string
}

export const DetailItem: React.FC<DetailItemProps> = memo(
  ({
    icon,
    children,
    className,
    ariaLabel,
    'data-testid': dataTestId
  }) => (
    <div
      className={`flex items-start gap-x-2.5 text-slate-600 dark:text-slate-300 ${className || ''}`}
      data-testid={dataTestId}
    >
      <span
        className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div
        className="flex-grow"
        {...(ariaLabel && { 'aria-label': ariaLabel })}
      >
        {children}
      </div>
    </div>
  )
)
