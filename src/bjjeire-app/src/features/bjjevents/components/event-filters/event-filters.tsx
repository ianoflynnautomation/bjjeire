import { memo } from 'react'
import type { County } from '@/constants/counties'
import { COUNTIES } from '@/constants/counties'
import { BJJ_EVENT_TYPES } from '@/constants/eventTypes'
import type { BjjEventType } from '@/types/event'
import SelectFilter from '@/components/ui/filters/select-filter'
import ButtonGroupFilter from '@/components/ui/filters/button-group-filter'
import { MapPinIcon } from '@heroicons/react/20/solid'
import { EventsPageTestIds } from '@/constants/eventDataTestIds'
import { SelectFilterTestIds, ButtonGroupFilterTestIds } from '@/constants/commonDataTestIds'
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
}: EventFiltersProps) {
  return (
    <div
      className="rounded-2xl bg-slate-800/40 p-4 backdrop-blur-sm ring-1 ring-white/[0.06] shadow-sm shadow-black/20 sm:flex sm:flex-row sm:items-end sm:gap-4"
      data-testid={dataTestId || EventsPageTestIds.FILTERS}
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
        className="flex-1 min-w-0"
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
