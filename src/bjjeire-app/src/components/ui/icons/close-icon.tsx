import React from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { CloseIconTestIds } from '@/constants/commonDataTestIds'

type CloseIconProps = React.SVGProps<SVGSVGElement> & {
  'data-testid'?: string
}

export const CloseIcon: React.FC<CloseIconProps> = ({
  className,
  'data-testid': dataTestId = CloseIconTestIds.ROOT,
  ...props
}) => (
  <XMarkIcon
    className={className || 'h-6 w-6'}
    aria-hidden="true"
    data-testid={dataTestId}
    {...props}
  />
)

export default CloseIcon
