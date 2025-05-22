import React, { memo } from 'react'
import { CloseIconTestIds } from '../../../constants/commonDataTestIds'

type CloseIconProps = React.SVGProps<SVGSVGElement> & {
  'data-testid'?: string
}

export const CloseIcon: React.FC<CloseIconProps> = ({
  className,
  'data-testid': dataTestId = CloseIconTestIds.ROOT(),
  ...props
}) => (
  <svg
    className={className || 'w-6 h-6'}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    data-testid={dataTestId}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
)

export default memo(CloseIcon)
