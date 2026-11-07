import type { JSX } from 'react'
import type { EventView } from '@/features/bjjevents/utils/event-view-url'
import { EventViewSwitchTestIds } from '@/constants/eventDataTestIds'
import { uiContent } from '@/config/ui-content'
import { viewSwitchButtonVariants } from '@/lib/view-switch-variants'

const { viewSwitch } = uiContent.events

const VIEWS = [
  { view: 'list', label: viewSwitch.list, testId: EventViewSwitchTestIds.LIST },
  { view: 'map', label: viewSwitch.map, testId: EventViewSwitchTestIds.MAP },
] as const

interface EventViewSwitchProps {
  view: EventView
  onChange: (view: EventView) => void
}

export const EventViewSwitch = function EventViewSwitch({
  view,
  onChange,
}: EventViewSwitchProps): JSX.Element {
  return (
    <div
      role="group"
      aria-label={viewSwitch.ariaLabel}
      className="inline-flex w-fit shrink-0 divide-x divide-hairline overflow-hidden rounded-lg border border-border-strong"
      data-testid={EventViewSwitchTestIds.ROOT}
    >
      {VIEWS.map(option => (
        <button
          key={option.view}
          type="button"
          aria-pressed={view === option.view}
          className={viewSwitchButtonVariants({
            selected: view === option.view,
          })}
          onClick={() => onChange(option.view)}
          data-testid={option.testId}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
