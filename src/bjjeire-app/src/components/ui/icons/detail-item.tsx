import React, { memo } from 'react'
import { IconWrapper } from './icon-wrapper'
import { DetailItemTestIds } from '../../../constants/commonDataTestIds'

interface DetailItemProps {
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
  iconClassName?: string
  ariaLabel?: string
  'data-testid'?: string
}

export const DetailItem: React.FC<DetailItemProps> = memo(
  ({
    icon,
    children,
    className,
    iconClassName,
    ariaLabel,
    'data-testid': rootDataTestId
  }) => {
    const actualRootDataTestId =
      rootDataTestId || DetailItemTestIds.ROOT

    return (
      <div
        className={`flex items-start gap-x-2.5 text-slate-600 dark:text-slate-300 ${className || ''}`}
        data-testid={actualRootDataTestId}
      >
        <IconWrapper
          className={iconClassName}
          data-testid={DetailItemTestIds.ICON}
        >
          {icon}
        </IconWrapper>
        <div
          className="flex-grow"
          data-testid={DetailItemTestIds.CONTENT}
          {...(ariaLabel && { 'aria-label': ariaLabel })}
        >
          {children}
        </div>
      </div>
    )
  }
)
