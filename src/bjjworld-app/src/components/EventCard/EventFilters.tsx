import React from 'react';
import { City, CITIES } from '../../constants/cities';
import { BjjEventType } from '../../types/event';
import { BJJ_EVENT_TYPES } from '../../constants/eventTypes';
import { MapPinIcon, ChevronDownIcon } from '@heroicons/react/20/solid';

interface EventFiltersProps {
  selectedType: BjjEventType | 'all';
  selectedCity: City | 'all';
  onTypeChange: (type: BjjEventType | 'all') => void;
  onCityChange: (city: City | 'all') => void;
  disabled?: boolean;
}

export const EventFilters: React.FC<EventFiltersProps> = ({
  selectedType,
  selectedCity,
  onTypeChange,
  onCityChange,
  disabled = false,
}) => {
  const commonButtonClasses =
    'rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-indigo-500';
  const activeButtonClasses = 'bg-indigo-600 text-white shadow-sm';
  const inactiveButtonClasses = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
  const disabledButtonClasses = 'opacity-60 cursor-not-allowed';

  const selectClasses = `appearance-none w-full rounded-md border border-slate-300 bg-white text-slate-600 text-sm font-medium py-2 pl-3 pr-10 shadow-sm hover:border-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150 ease-in-out ${
    disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''
  }`;

  return (
    <section className="mb-8 rounded-lg bg-white p-5 sm:p-6 shadow-md">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-5">
        {/* Event Type Filters */}
        <div className="md:col-span-3">
          <label htmlFor="event-type-filter" className="mb-1.5 block text-sm font-medium text-slate-600">
            Event Type
          </label>
          <div id="event-type-filter" className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onTypeChange('all')}
              disabled={disabled}
              className={`${commonButtonClasses} ${
                selectedType === 'all' ? activeButtonClasses : inactiveButtonClasses
              } ${disabled ? disabledButtonClasses : ''}`}
            >
              All Types
            </button>
            {BJJ_EVENT_TYPES.map(({ value, label }) => (
              <button
                type="button"
                key={value}
                onClick={() => onTypeChange(value)}
                disabled={disabled}
                className={`${commonButtonClasses} ${
                  selectedType === value ? activeButtonClasses : inactiveButtonClasses
                } ${disabled ? disabledButtonClasses : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* City Filter - Modernized Dropdown */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-x-2 mb-1.5">
            <MapPinIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
            <label htmlFor="city-filter" className="block text-sm font-medium text-slate-600">
              City
            </label>
          </div>
          <div className="relative">
            <select
              id="city-filter"
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value as City | 'all')}
              disabled={disabled}
              className={selectClasses}
              aria-label="Select a city to filter events"
            >
              <option value="all">All Cities</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <ChevronDownIcon
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </section>
  );
};