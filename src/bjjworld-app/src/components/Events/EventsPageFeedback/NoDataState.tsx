import React from 'react'
import { InformationCircleIcon } from '@heroicons/react/20/solid'

interface NoDataStateProps { // Renamed for potential broader use
  title?: string;
  messageLine1?: string;
  messageLine2?: string;
  actionText?: string;
  onActionClick?: () => void; // Make action optional
  'data-testid'?: string;
}

const NoDataState: React.FC<NoDataStateProps> = ({
  title = 'No Items Found',
  messageLine1 = 'There are currently no items to display.',
  messageLine2 = 'Try adjusting your filters or check back later.',
  actionText,
  onActionClick,
  'data-testid': baseTestId = 'no-data-state',
}) => (
  <div
    className="my-10 rounded-md border border-slate-200 bg-slate-50 p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800" // UPDATED: Neutral scheme
    data-testid={baseTestId}
  >
    <InformationCircleIcon
      className="mx-auto h-10 w-10 text-emerald-500 dark:text-emerald-400" // UPDATED: Icon color
      aria-hidden="true"
    />
    <p
      className="mt-3 text-lg font-semibold text-slate-800 dark:text-slate-100" // UPDATED: Text color
      data-testid={`${baseTestId}-title`}
    >
      {title}
    </p>
    <p
      className="mt-1 text-sm text-slate-600 dark:text-slate-300" // UPDATED: Text color
      data-testid={`${baseTestId}-message-line1`}
    >
      {messageLine1}
    </p>
    <p
      className="mt-0.5 text-sm text-slate-600 dark:text-slate-300" // UPDATED: Text color
      data-testid={`${baseTestId}-message-line2`}
    >
      {messageLine2}
      {onActionClick && actionText && (
        <>
          {' '}Or{' '}
          <button
            onClick={onActionClick}
            className="font-medium text-emerald-600 transition-colors hover:text-emerald-700 focus:underline focus:outline-none dark:text-emerald-400 dark:hover:text-emerald-300" // UPDATED: Link color
            data-testid={`${baseTestId}-action-button`}
          >
            {actionText}
          </button>
          .
        </>
      )}
    </p>
  </div>
)

export default React.memo(NoDataState)