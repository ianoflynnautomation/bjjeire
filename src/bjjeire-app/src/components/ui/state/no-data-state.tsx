import React, { memo } from 'react'
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

const NoDataState: React.FC<NoDataStateProps> = ({
  title = 'No Items Found',
  messageLine1 = 'There are currently no items to display.',
  messageLine2 = 'Try adjusting your filters or check back later.',
  actionText,
  onActionClick,
  'data-testid': dataTestIdFromProp,
}) => {
  const rootTestId = dataTestIdFromProp || NoDataStateTestIds.ROOT

  return (
    <div
      className="my-10 rounded-md border border-slate-200 bg-slate-50 p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800"
      data-testid={rootTestId}
    >
      <InformationCircleIcon
        className="mx-auto h-10 w-10 text-emerald-500 dark:text-emerald-400"
        aria-hidden="true"
        data-testid={NoDataStateTestIds.ICON}
      />
      <p
        className="mt-3 text-lg font-semibold text-slate-800 dark:text-slate-100"
        data-testid={NoDataStateTestIds.TITLE}
      >
        {title}
      </p>
      <p
        className="mt-1 text-sm text-slate-600 dark:text-slate-300"
        data-testid={NoDataStateTestIds.MESSAGE_LINE1}
      >
        {messageLine1}
      </p>
      <p
        className="mt-0.5 text-sm text-slate-600 dark:text-slate-300"
        data-testid={NoDataStateTestIds.MESSAGE_LINE2}
      >
        {messageLine2}
        {onActionClick && actionText && (
          <>
            {' '}
            Or{' '}
            <button
              onClick={onActionClick}
              className="font-medium text-emerald-600 transition-colors hover:text-emerald-700 focus:underline focus:outline-none dark:text-emerald-400 dark:hover:text-emerald-300"
              data-testid={NoDataStateTestIds.BUTTON}
            >
              {actionText}
            </button>
            .
          </>
        )}
      </p>
    </div>
  )
}

export default memo(NoDataState)
