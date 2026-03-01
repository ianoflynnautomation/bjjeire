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

const cityOptions = [
  { value: 'all' as const, label: 'All Counties' },
  ...COUNTIES.map(city => ({ value: city.value as County, label: city.label })),
]

const eventTypeOptions = [
  { value: 'all' as const, label: 'All Types' },
  ...BJJ_EVENT_TYPES.map(type => ({
    value: type.value as BjjEventType,
    label: type.label as string,
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
      className="flex flex-col gap-6 sm:flex-row sm:gap-4"
      data-testid={dataTestId || EventsPageTestIds.FILTERS}
    >
      <SelectFilter
        id="city-filter"
        label="Select County"
        value={selectedCity ?? 'all'}
        onChange={onCityChange}
        options={cityOptions}
        disabled={disabled}
        Icon={MapPinIcon}
        data-testid={SelectFilterTestIds.ROOT}
        className="flex-1"
      />
      <ButtonGroupFilter<BjjEventType | 'all'>
        label="Event Type"
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
