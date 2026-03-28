import { memo } from 'react'
import type { JSX } from 'react'
import { SpinnerTestIds } from '@/constants/commonDataTestIds'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  text?: string
  className?: string
  'data-testid'?: string
}

const sizeClasses: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-4',
}

const LoadingSpinner = memo(function LoadingSpinner({
  size = 'md',
  color = 'text-emerald-600',
  text,
  className,
  'data-testid': dataTestIdFromProp,
}: LoadingSpinnerProps): JSX.Element {
  const rootTestId = dataTestIdFromProp ?? SpinnerTestIds.ROOT

  return (
    <div
      data-testid={rootTestId}
      className={cn('flex flex-col items-center justify-center p-4', className)}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          'animate-spin rounded-full border-solid border-t-transparent',
          sizeClasses[size],
          color
        )}
        aria-hidden="true"
      />
      {text && <p className={cn('mt-3 text-sm font-medium', color)}>{text}</p>}
      <span className="sr-only">{text ?? 'Loading...'}</span>
    </div>
  )
})

export default LoadingSpinner
