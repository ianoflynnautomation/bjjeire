import type { JSX } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/cn'

interface PaginationButtonProps {
  direction: 'prev' | 'next'
  disabled: boolean
  onClick: () => void
  'data-testid'?: string
}

export function PaginationButton({
  direction,
  disabled,
  onClick,
  'data-testid': dataTestId,
}: PaginationButtonProps): JSX.Element {
  const isPrev = direction === 'prev'

  return (
    <button
      data-testid={dataTestId}
      className={cn(
        buttonVariants({ variant: 'outline', size: 'sm' }),
        'gap-1.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md'
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={isPrev ? 'Previous page' : 'Next page'}
    >
      {isPrev && <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />}
      {isPrev ? 'Prev' : 'Next'}
      {!isPrev && <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />}
    </button>
  )
}
