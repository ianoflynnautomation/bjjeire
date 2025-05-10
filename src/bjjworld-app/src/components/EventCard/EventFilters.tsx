import React from 'react'
import { City, CITIES } from '../../constants/cities'
import { BjjEventType } from '../../types/event'
import { BJJ_EVENT_TYPES } from '../../constants/eventTypes';
import { MapPinIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';

interface EventFiltersProps {
  selectedCity: City | 'all'
  selectedType: BjjEventType | undefined
  onCityChange: (city: City | 'all') => void
  onTypeChange: (type: BjjEventType | 'all' | undefined) => void
  disabled: boolean
}

const EventFilters: React.FC<EventFiltersProps> = ({
  selectedCity,
  selectedType,
  onCityChange,
  onTypeChange,
  disabled,
}) => {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:gap-4">
      {/* City Filter */}
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="city-filter" className="block text-sm font-medium text-slate-700 mb-1">
          City
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPinIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </div>
          <select
            id="city-filter"
            name="city-filter"
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value as City | 'all')}
            disabled={disabled}
            className={clsx(
              "block w-full rounded-md border-slate-300 py-2.5 pl-10 pr-10 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm",
              disabled ? "bg-slate-50 cursor-not-allowed" : "bg-white"
            )}
          >
            <option value="all">All Cities</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDownIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Event Type Filter */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Event Type
        </label>
        <div className="flex flex-wrap gap-2">
          {/* "All Types" Button */}
          <button
            type="button"
            onClick={() => onTypeChange('all')}
            disabled={disabled}
            className={clsx(
              "rounded-md px-3 py-1.5 text-sm font-medium border transition-colors",
              selectedType === undefined
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400",
              disabled ? "opacity-50 cursor-not-allowed hover:bg-white" : ""
            )}
          >
            All Types
          </button>

          {/* Buttons for each BJJ Event Type */}
          {BJJ_EVENT_TYPES.map((eventType) => (
            <button
              key={eventType.value}
              type="button"
              onClick={() => onTypeChange(eventType.value)}
              disabled={disabled}
              className={clsx(
                "rounded-md px-3 py-1.5 text-sm font-medium border transition-colors",
                selectedType === eventType.value
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400",
                disabled ? "opacity-50 cursor-not-allowed hover:bg-white" : ""
              )}
            >
              {eventType.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventFilters;
