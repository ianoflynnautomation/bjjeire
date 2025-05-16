import React from 'react'
import { County, COUNTIES } from '../../../constants/counties'
import { BJJ_EVENT_TYPES } from '../../../constants/eventTypes'
import { BjjEventType } from '../../../types/event'
import SelectFilter from '../../Filters/SelectFilter'
import ButtonGroupFilter from '../../Filters/ButtonGroupFilter'
import { MapPinIcon } from '@heroicons/react/20/solid'

interface EventFiltersProps {
  selectedCity: County | 'all' | undefined; // Add undefined to the type
  selectedType: BjjEventType | undefined;
  onCityChange: (city: County | 'all' | undefined) => void; // Update onCityChange to accept undefined
  onTypeChange: (type: BjjEventType | 'all') => void;
  disabled: boolean;
  'data-testid'?: string;
}

const EventFilters: React.FC<EventFiltersProps> = ({
  selectedCity,
  selectedType,
  onCityChange,
  onTypeChange,
  disabled,
  'data-testid': baseTestId = 'event-filters',
}) => {
  const cityOptions = COUNTIES.map((city) => ({ value: city.value, label: city.label }))

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:gap-4"
      data-testid={baseTestId}
    >
      <SelectFilter
        id="city-filter"
        label="City"
        value={selectedCity}
        onChange={onCityChange}
        options={cityOptions}
        disabled={disabled}
        placeholderOptionLabel="All Cities"
        Icon={MapPinIcon}
        data-testid={`${baseTestId}-city-select`}
        className="flex-1"
      />
      <ButtonGroupFilter<BjjEventType>
        label="Event Type"
        options={BJJ_EVENT_TYPES}
        selectedValue={selectedType}
        onValueChange={onTypeChange}
        disabled={disabled}
        allOptionLabel="All Types"
        data-testid={`${baseTestId}-type-group`}
        className="flex-1 sm:flex-none"
      />
    </div>
  )
}

export default EventFilters
