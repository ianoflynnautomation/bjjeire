import { memo } from 'react'
import type { JSX } from 'react'
import type { County } from '@/constants/counties'
import { COUNTIES } from '@/constants/counties'
import { BJJ_EVENT_TYPES } from '@/constants/eventTypes'
import type { BjjEventType } from '@/types/event'
import SelectFilter from '@/components/ui/filters/select-filter'
import ButtonGroupFilter from '@/components/ui/filters/button-group-filter'
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

const eventTypeOptions = [
  { value: 'all' as const, label: filters.allTypesOption },
  ...BJJ_EVENT_TYPES.map(type => ({
    value: type.value,
    label: type.label,
  })),
]

interface EventFiltersProps {
  selectedCity: County | 'all' | undefined
  selectedType: BjjEventType | 'all' | undefined
  onCityChange: (city: County | 'all' | undefined) => void
  onTypeChange: (type: BjjEventType | 'all' | undefined) => void
  disabled: boolean
  dataTestId?: string
}

const EventFilters = memo(function EventFilters({
  selectedCity,
  selectedType,
  onCityChange,
  onTypeChange,
  disabled,
  dataTestId,
}: EventFiltersProps): JSX.Element {
  return (
    <div
      className="rounded-2xl bg-white/80 p-4 backdrop-blur-sm shadow-sm shadow-black/10 ring-1 ring-black/6 sm:flex sm:flex-row sm:items-end sm:gap-4 dark:bg-slate-800/40 dark:shadow-black/20 dark:ring-white/6"
      data-testid={dataTestId ?? EventsPageTestIds.FILTERS}
      aria-label="Event filters"
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
      <ButtonGroupFilter<BjjEventType | 'all'>
        label={filters.eventTypeLabel}
        options={eventTypeOptions}
        selectedValue={selectedType ?? 'all'}
        onValueChange={onTypeChange}
        disabled={disabled}
        data-testid={ButtonGroupFilterTestIds.ROOT}
        className="flex-1 sm:flex-none"
      />
    </div>
  )
})

export default EventFilters
