import React, { memo } from 'react'
import {
  DetailItemTestIds,
  withTestIdSuffix,
} from '../../../constants/commonDataTestIds'

interface DetailItemProps {
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
  ariaLabel?: string
  'data-testid'?: string
  testIdInstanceSuffix?: string
}

export const DetailItem: React.FC<DetailItemProps> = memo(
  ({
    icon,
    children,
    className,
    ariaLabel,
    'data-testid': dataTestId = DetailItemTestIds.ROOT(),
    testIdInstanceSuffix = '',
  }) => (
    <div
      className={`flex items-start gap-x-2.5 text-slate-600 dark:text-slate-300 ${className || ''}`}
      data-testid={dataTestId}
    >
      <span
        className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400"
        aria-hidden="true"
        data-testid={withTestIdSuffix(
          DetailItemTestIds.ICON,
          testIdInstanceSuffix
        )}
      >
        {icon}
      </span>
      <div
        className="flex-grow"
        {...(ariaLabel && { 'aria-label': ariaLabel })}
        data-testid={withTestIdSuffix(
          DetailItemTestIds.CONTENT,
          testIdInstanceSuffix
        )}
      >
        {children}
      </div>
    </div>
  )
)
