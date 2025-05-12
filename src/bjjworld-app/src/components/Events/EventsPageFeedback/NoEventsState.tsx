import React from 'react'
import { InformationCircleIcon } from '@heroicons/react/20/solid'

interface NoEventsStateProps {
  onOpenForm: () => void
  'data-testid'?: string
}

const NoEventsState: React.FC<NoEventsStateProps> = ({
  onOpenForm,
  'data-testid': baseTestId = 'no-events-state',
}) => (
  <div
    className="my-10 rounded-md border border-emerald-200 bg-emerald-50 p-6 text-center shadow-sm "
    data-testid={baseTestId}
  >
    <InformationCircleIcon
      className="mx-auto h-10 w-10 text-emerald-500"
      aria-hidden="true"
    />
    <p
      className="mt-2 text-lg font-semibold text-slate-800"
      data-testid={`${baseTestId}-title`}
    >
      No Events Found
    </p>
    <p
      className="mt-1 text-sm text-slate-600"
      data-testid={`${baseTestId}-cta-message`}
    >
      Try adjusting your filters or{' '}
      <button
        onClick={onOpenForm}
        className="font-medium text-emerald-600 hover:text-emerald-500 focus:outline-none focus:underline transition-colors"
        data-testid={`${baseTestId}-submit-event-button`}
      >
        submit a new event
      </button>
      .
    </p>
  </div>
)

export default React.memo(NoEventsState)
