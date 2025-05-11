// src/components/EventFilters/EventFilters.tsx
import React from 'react'
import { City, CITIES } from '../../constants/cities' 
import { BJJ_EVENT_TYPES } from '../../constants/eventTypes'
import { BjjEventType } from '../../types/event'
import SelectFilter from './../Filters/SelectFilter'
import ButtonGroupFilter from './../Filters/ButtonGroupFilter'
import { MapPinIcon } from '@heroicons/react/20/solid' 

interface EventFiltersProps {
  selectedCity: City | 'all' 
  selectedType: BjjEventType | undefined 
  onCityChange: (city: City | 'all') => void
  onTypeChange: (type: BjjEventType | 'all') => void
  disabled: boolean
}

const EventFilters: React.FC<EventFiltersProps> = ({
  selectedCity,
  selectedType,
  onCityChange,
  onTypeChange,
  disabled,
}) => {

  const cityOptions = CITIES.map((city) => ({ value: city.value, label: city.label }))

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:gap-4">
      <SelectFilter
        id="city-filter"
        label="City"
        value={selectedCity}
        onChange={onCityChange}
        options={cityOptions}
        disabled={disabled}
        placeholderOptionLabel="All Cities"
        Icon={MapPinIcon} 
      />

      <ButtonGroupFilter<BjjEventType>
        label="Event Type"
        options={BJJ_EVENT_TYPES}
        selectedValue={selectedType}
        onValueChange={onTypeChange}
        disabled={disabled}
        allOptionLabel="All Types"
      />
    </div>
  )
}

export default EventFilters
