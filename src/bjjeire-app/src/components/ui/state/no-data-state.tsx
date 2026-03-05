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
      className="my-10 rounded-2xl bg-slate-800/40 p-6 text-center backdrop-blur-sm shadow-md shadow-black/20 ring-1 ring-white/[0.08]"
      data-testid={rootTestId}
    >
      <InformationCircleIcon
        className="mx-auto h-12 w-12 text-emerald-400"
        aria-hidden="true"
        data-testid={NoDataStateTestIds.ICON}
      />
      <p
        className="mt-3 text-lg font-bold text-slate-50"
        data-testid={NoDataStateTestIds.TITLE}
      >
        {title}
      </p>
      <p
        className="mt-1 text-sm text-slate-400"
        data-testid={NoDataStateTestIds.MESSAGE_LINE1}
      >
        {messageLine1}
      </p>
      <p
        className="mt-0.5 text-sm text-slate-400"
        data-testid={NoDataStateTestIds.MESSAGE_LINE2}
      >
        {messageLine2}
        {onActionClick && actionText && (
          <>
            {' '}
            Or{' '}
            <button
              onClick={onActionClick}
              className="font-semibold text-emerald-400 transition-colors hover:text-emerald-300 focus:underline focus:outline-none"
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
