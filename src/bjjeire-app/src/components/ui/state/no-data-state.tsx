import type { JSX } from 'react'
import { InformationCircleIcon } from '@heroicons/react/20/solid'
import { NoDataStateTestIds } from '@/constants/commonDataTestIds'

interface NoDataStateProps {
  title?: string
  messageLine1?: string
  messageLine2?: string
  actionText?: string
  onActionClick?: () => void
  'data-testid'?: string
}

const NoDataState = function NoDataState({
  title = 'No Items Found',
  messageLine1 = 'There are currently no items to display.',
  messageLine2 = 'Try adjusting your filters or check back later.',
  actionText,
  onActionClick,
  'data-testid': dataTestIdFromProp,
}: NoDataStateProps): JSX.Element {
  const rootTestId = dataTestIdFromProp ?? NoDataStateTestIds.ROOT

  return (
    <div
      className="my-10 rounded-xl bg-surface-solid p-6 text-center shadow-card ring-1 ring-hairline"
      data-testid={rootTestId}
    >
      <InformationCircleIcon
        className="mx-auto h-12 w-12 text-primary-500 dark:text-primary-400"
        aria-hidden="true"
        data-testid={NoDataStateTestIds.ICON}
      />
      <p
        className="mt-3 text-lg font-bold text-fg"
        data-testid={NoDataStateTestIds.TITLE}
      >
        {title}
      </p>
      <p
        className="mt-1 text-sm text-fg-subtle"
        data-testid={NoDataStateTestIds.MESSAGE_LINE1}
      >
        {messageLine1}
      </p>
      <p
        className="mt-0.5 text-sm text-fg-subtle"
        data-testid={NoDataStateTestIds.MESSAGE_LINE2}
      >
        {messageLine2}
        {onActionClick && actionText && (
          <>
            {' '}
            Or{' '}
            <button
              onClick={onActionClick}
              className="font-semibold text-primary-700 transition-colors hover:text-primary-800 focus:underline focus:outline-none dark:text-primary-300 dark:hover:text-primary-200"
              data-testid={NoDataStateTestIds.BUTTON}
            >
              {actionText}
            </button>
            {'.'}
          </>
        )}
      </p>
    </div>
  )
}

export default NoDataState
