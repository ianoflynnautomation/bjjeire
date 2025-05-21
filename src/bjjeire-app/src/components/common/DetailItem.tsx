import React, { memo } from 'react'
import { IconWrapper } from './IconWrapper'
import { DetailItemTestIds } from '../../constants/commonDataTestIds'

interface DetailItemProps {
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
  iconClassName?: string
  ariaLabel?: string
  'data-testid'?: string
  testIdInstanceSuffix?: string
}

export const DetailItem: React.FC<DetailItemProps> = memo(
  ({
    icon,
    children,
    className,
    iconClassName,
    ariaLabel,
    'data-testid': rootDataTestId,
    testIdInstanceSuffix = '',
  }) => {
    const actualRootDataTestId =
      rootDataTestId || DetailItemTestIds.ROOT(testIdInstanceSuffix)

    return (
      <div
        className={`flex items-start gap-x-2.5 text-slate-600 dark:text-slate-300 ${className || ''}`}
        data-testid={actualRootDataTestId}
      >
        <IconWrapper
          className={iconClassName}
          data-testid={DetailItemTestIds.ICON(testIdInstanceSuffix)}
        >
          {icon}
        </IconWrapper>
        <div
          className="flex-grow"
          data-testid={DetailItemTestIds.CONTENT(testIdInstanceSuffix)}
          {...(ariaLabel && { 'aria-label': ariaLabel })}
        >
          {children}
        </div>
      </div>
    )
  }
)
