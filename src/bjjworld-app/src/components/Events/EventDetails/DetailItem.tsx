import React, { memo } from 'react'

interface DetailItemProps {
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
  ariaLabel?: string
  'data-testid'?: string
}

export const DetailItem: React.FC<DetailItemProps> = memo(
  ({ icon, children, className, ariaLabel, 'data-testid': dataTestId }) => (
    <div
      className={`flex items-start gap-x-2 text-slate-600 ${className || ''}`}
      data-testid={dataTestId}
    >
      <span
        className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500 dark:text-orange-400"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div
        className="flex-grow"
        {...(ariaLabel && { 'aria-label': ariaLabel })}
        // If children are simple text and you need a testid on the text container specifically:
        // data-testid={dataTestId ? `${dataTestId}-content` : undefined}
      >
        {children}
      </div>
    </div>
  )
)
