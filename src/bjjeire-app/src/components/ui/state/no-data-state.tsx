import type { JSX } from 'react'
import { InformationCircleIcon } from '@heroicons/react/20/solid'
import { NoDataStateTestIds } from '@/constants/commonDataTestIds'
import { uiContent } from '@/config/ui-content'

interface NoDataStateProps {
  title?: string
  messageLine1?: string
  messageLine2?: string
  actionText?: string
  onActionClick?: () => void
  'data-testid'?: string
}

const NoDataState = function NoDataState({
  title = uiContent.shared.emptyTitle,
  messageLine1 = uiContent.shared.emptyLine1,
  messageLine2 = uiContent.shared.emptyLine2,
  actionText,
  onActionClick,
  'data-testid': dataTestIdFromProp,
}: NoDataStateProps): JSX.Element {
  const rootTestId = dataTestIdFromProp ?? NoDataStateTestIds.ROOT

  return (
    <div
      role="status"
      className="my-10 rounded-xl bg-surface-solid p-6 text-center shadow-card ring-1 ring-hairline"
      data-testid={rootTestId}
    >
      <InformationCircleIcon
        className="mx-auto h-12 w-12 text-primary-500 dark:text-primary-400"
        aria-hidden="true"
        data-testid={NoDataStateTestIds.ICON}
      />
      <h3
        className="mt-3 text-lg font-bold text-fg"
        data-testid={NoDataStateTestIds.TITLE}
      >
        {title}
      </h3>
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
            {uiContent.shared.emptyActionJoiner}{' '}
            <button
              onClick={onActionClick}
              className="rounded-sm font-semibold text-primary-700 underline-offset-2 transition-colors hover:text-primary-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus dark:text-primary-300 dark:hover:text-primary-200"
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
