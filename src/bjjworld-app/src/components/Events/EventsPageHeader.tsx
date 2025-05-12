import React from 'react'
import { PlusIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'

interface EventsPageHeaderProps {
  onOpenForm: () => void
  isSubmittingEvent: boolean
  isFormOpen: boolean
  'data-testid'?: string
}

const EventsPageHeader: React.FC<EventsPageHeaderProps> = ({
  onOpenForm,
  isSubmittingEvent,
  isFormOpen,
  'data-testid': baseTestId = 'events-page-header',
}) => (
  <header
    className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row"
    data-testid={baseTestId}
  >
    <h1
      className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
      data-testid={`${baseTestId}-title`}
    >
      BJJ Events
    </h1>
    <button
      type="button"
      onClick={onOpenForm}
      disabled={isSubmittingEvent}
      className={clsx(
        'inline-flex items-center gap-x-2 rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 ease-in-out',
        isSubmittingEvent
          ? 'bg-emerald-400 dark:bg-emerald-700 cursor-not-allowed'
          : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:from-emerald-500 dark:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-700 dark:focus:ring-offset-slate-900 dark:text-white'
      )}
      aria-controls="event-form"
      aria-expanded={isFormOpen}
      data-testid={`${baseTestId}-submit-event-button`}
    >
      <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
      {isSubmittingEvent ? 'Submitting...' : 'Submit Event'}
    </button>
  </header>
)

export default React.memo(EventsPageHeader)
