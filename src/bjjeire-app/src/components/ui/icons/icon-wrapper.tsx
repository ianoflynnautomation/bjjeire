import React, { memo } from 'react'
import clsx from 'clsx'
import { IconWrapperTestIds } from '../../../constants/commonDataTestIds'

interface IconWrapperProps {
  children: React.ReactNode
  className?: string
  'aria-hidden'?: boolean
  'data-testid'?: string
  testIdInstanceSuffix?: string
}

export const IconWrapper: React.FC<IconWrapperProps> = ({
  children,
  className = 'h-5 w-5 text-emerald-600 dark:text-emerald-400',
  'aria-hidden': ariaHidden = true,
  'data-testid': dataTestIdFromProp,
  testIdInstanceSuffix = '',
}) => {
  const rootTestId =
    dataTestIdFromProp || IconWrapperTestIds.ROOT(testIdInstanceSuffix)

  return (
    <span
      className={clsx('mt-0.5 flex-shrink-0', className)}
      aria-hidden={ariaHidden}
      data-testid={rootTestId}
    >
      {children}
    </span>
  )
}

export default memo(IconWrapper)
