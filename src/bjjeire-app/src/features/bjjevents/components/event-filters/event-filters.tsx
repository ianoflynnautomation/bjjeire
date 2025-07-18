import React, { memo, useMemo } from 'react'
import { County, COUNTIES } from '../../../../constants/counties'
import { BJJ_EVENT_TYPES } from '../../../../constants/eventTypes'
import { BjjEventType } from '../../../../types/event'
import SelectFilter from '../../../../components/ui/filters/select-filter';
import ButtonGroupFilter from '../../../../components/ui/filters/button-group-filter';
import { MapPinIcon } from '@heroicons/react/20/solid'
import { EventFiltersTestIds } from '../../../../constants/eventDataTestIds'

interface EventFiltersProps {
  selectedCity: County | 'all' | undefined
  selectedType: BjjEventType | 'all' | undefined
  onCityChange: (city: County | 'all' | undefined) => void
  onTypeChange: (type: BjjEventType | 'all' | undefined) => void
  disabled: boolean
  dataTestId?: string
}

const EventFilters: React.FC<EventFiltersProps> = memo(
  ({
    selectedCity,
    selectedType,
    onCityChange,
    onTypeChange,
    disabled,
    dataTestId,
  }) => {
    const cityOptions = useMemo(
      () => [
        { value: 'all' as const, label: 'All Counties' },
        ...COUNTIES.map(city => ({
          value: city.value as County,
          label: city.label,
        })),
      ],
      []
    )

    const eventTypeOptions = useMemo(
      () => [
        { value: 'all' as const, label: 'All Types' },
        ...BJJ_EVENT_TYPES.map(type => ({
          value: type.value as BjjEventType,
          label: type.label as string,
        })),
      ],
      []
    )

    const rootTestId =
      dataTestId || EventFiltersTestIds.ROOT

    return (
      <div
        className="flex flex-col gap-6 sm:flex-row sm:gap-4"
        data-testid={rootTestId}
      >
        <SelectFilter
          id="city-filter"
          label="Select County"
          value={selectedCity ?? 'all'}
          onChange={onCityChange}
          options={cityOptions}
          disabled={disabled}
          Icon={MapPinIcon}
          data-testid={EventFiltersTestIds.CITY_SELECT}
          className="flex-1"
        />
        <ButtonGroupFilter<BjjEventType | 'all'>
          label="Event Type"
          options={eventTypeOptions}
          selectedValue={selectedType ?? 'all'}
          onValueChange={onTypeChange}
          disabled={disabled}
          data-testid={EventFiltersTestIds.TYPE_GROUP}
          className="flex-1 sm:flex-none"
        />
      </div>
    )
  }
)

export default EventFilters
