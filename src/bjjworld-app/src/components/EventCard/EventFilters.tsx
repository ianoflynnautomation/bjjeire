import React from 'react';
import { City, CITIES } from '../../constants/cities';
import { BjjEventType } from '../../types/event';
import { BJJ_EVENT_TYPES } from '../../constants/eventTypes';

interface EventFiltersProps {
  selectedType: BjjEventType | 'all';
  selectedCity: City | 'all';
  onTypeChange: (type: BjjEventType | 'all') => void;
  onCityChange: (city: City | 'all') => void;
}

export const EventFilters: React.FC<EventFiltersProps> = ({
  selectedType,
  selectedCity,
  onTypeChange,
  onCityChange,
}) => {
  return (
    <section className="mb-8 rounded-lg bg-white p-6 shadow-md">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
        <div className="md:col-span-3">
          <label className="mb-1 block text-sm font-medium text-gray-700">Event Type</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onTypeChange('all')}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                selectedType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Types
            </button>
            {BJJ_EVENT_TYPES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onTypeChange(value)}
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  selectedType === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
          <select
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value as City | 'all')}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Cities</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
};