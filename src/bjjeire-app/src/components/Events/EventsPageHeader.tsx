import React from 'react'

interface EventsPageHeaderProps {
  'data-testid'?: string
}

const EventsPageHeader: React.FC<EventsPageHeaderProps> = ({
  'data-testid': baseTestId = 'events-page-header',
}) => (
  <header
    className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row"
    data-testid={baseTestId}
  >
    <h1
      className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl"
      data-testid={`${baseTestId}-title`}
    >
      BJJ Events
    </h1>
  </header>
)

export default React.memo(EventsPageHeader)
