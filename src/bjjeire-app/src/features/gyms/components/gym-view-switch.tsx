import type { JSX } from 'react'
import type { GymView } from '@/features/gyms/utils/gym-view-url'
import { GymViewSwitchTestIds } from '@/constants/gymDataTestIds'
import { uiContent } from '@/config/ui-content'
import { viewSwitchButtonVariants } from '@/lib/view-switch-variants'

const { viewSwitch } = uiContent.gyms

const VIEWS = [
  { view: 'list', label: viewSwitch.list, testId: GymViewSwitchTestIds.LIST },
  { view: 'map', label: viewSwitch.map, testId: GymViewSwitchTestIds.MAP },
] as const

interface GymViewSwitchProps {
  view: GymView
  onChange: (view: GymView) => void
}

export const GymViewSwitch = function GymViewSwitch({
  view,
  onChange,
}: GymViewSwitchProps): JSX.Element {
  return (
    <div
      role="group"
      aria-label={viewSwitch.ariaLabel}
      className="inline-flex w-fit shrink-0 divide-x divide-hairline overflow-hidden rounded-lg border border-border-strong"
      data-testid={GymViewSwitchTestIds.ROOT}
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
