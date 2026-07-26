import type { ReactNode, JSX } from 'react'
import { IconWrapper } from './icon-wrapper'
import { DetailItemTestIds } from '@/constants/commonDataTestIds'
import { cn } from '@/lib/cn'

interface DetailItemProps {
  icon: ReactNode
  children: ReactNode
  className?: string
  iconClassName?: string
  ariaLabel?: string
  'data-testid'?: string
}

export const DetailItem = function DetailItem({
  icon,
  children,
  className,
  iconClassName,
  ariaLabel,
  'data-testid': dataTestId,
}: DetailItemProps): JSX.Element {
  const rootTestId = dataTestId ?? DetailItemTestIds.ROOT

  return (
    <div
      className={cn('flex items-start gap-x-2.5 text-fg-muted', className)}
      data-testid={rootTestId}
    >
      <IconWrapper className={iconClassName}>{icon}</IconWrapper>
      <div className="grow" aria-label={ariaLabel}>
        {children}
      </div>
    </div>
  )
}
