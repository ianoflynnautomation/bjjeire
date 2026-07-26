import type { JSX } from 'react'
import type { County } from '@/constants/counties'
import { COUNTIES } from '@/constants/counties'
import { BJJ_EVENT_TYPES } from '@/constants/eventTypes'
import type { BjjEventType } from '@/types/event'
import SelectFilter from '@/components/ui/filters/select-filter'
import { MultiButtonGroupFilter } from '@/components/ui/filters/multi-button-group-filter'
import { MapPinIcon } from '@heroicons/react/20/solid'
import { EventsPageTestIds } from '@/constants/eventDataTestIds'
import {
  SelectFilterTestIds,
  ButtonGroupFilterTestIds,
} from '@/constants/commonDataTestIds'
import { uiContent } from '@/config/ui-content'

const { filters } = uiContent.events

const cityOptions = [
  { value: 'all' as const, label: filters.allCountiesOption },
  ...COUNTIES.map(city => ({ value: city.value, label: city.label })),
]

const eventTypeOptions = BJJ_EVENT_TYPES.map(type => ({
  value: type.value,
  label: type.label,
}))

interface EventFiltersProps {
  selectedCity: County | 'all' | undefined
  selectedTypes: BjjEventType[]
  onCityChange: (city: County | 'all' | undefined) => void
  onTypesChange: (types: BjjEventType[]) => void
  disabled: boolean
  dataTestId?: string
}

export const EventFilters = function EventFilters({
  selectedCity,
  selectedTypes,
  onCityChange,
  onTypesChange,
  disabled,
  dataTestId,
}: EventFiltersProps): JSX.Element {
  return (
    <section
      className="rounded-2xl bg-surface p-4 backdrop-blur-sm shadow-sm shadow-black/10 ring-1 ring-hairline sm:flex sm:flex-row sm:items-end sm:gap-4 dark:shadow-black/20"
      data-testid={dataTestId ?? EventsPageTestIds.FILTERS}
      aria-label={filters.ariaLabel}
    >
      <SelectFilter
        id="city-filter"
        label={filters.countyLabel}
        value={selectedCity ?? 'all'}
        onChange={onCityChange}
        options={cityOptions}
        disabled={disabled}
        Icon={MapPinIcon}
        data-testid={SelectFilterTestIds.ROOT}
        className="sm:w-48 shrink-0"
      />
      <MultiButtonGroupFilter<BjjEventType>
        label={filters.eventTypeLabel}
        allLabel={filters.allTypesOption}
        options={eventTypeOptions}
        selectedValues={selectedTypes}
        onSelectionChange={onTypesChange}
        disabled={disabled}
        dataTestId={ButtonGroupFilterTestIds.ROOT}
        className="flex-1 sm:flex-none"
      />
    </section>
  )
}
