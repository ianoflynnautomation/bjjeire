import { memo } from 'react'
import type { JSX, SVGProps } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { CloseIconTestIds } from '@/constants/commonDataTestIds'

type CloseIconProps = SVGProps<SVGSVGElement> & {
  'data-testid'?: string
}

export const CloseIcon = memo(function CloseIcon({
  className,
  'data-testid': dataTestId = CloseIconTestIds.ROOT,
  ...props
}: CloseIconProps): JSX.Element {
  return (
    <XMarkIcon
      className={className ?? 'h-6 w-6'}
      aria-hidden="true"
      data-testid={dataTestId}
      {...props}
    />
  )
})
