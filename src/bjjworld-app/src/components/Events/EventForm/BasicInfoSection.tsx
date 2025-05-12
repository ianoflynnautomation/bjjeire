import React from 'react';
import { BjjEventType } from '../../../types/event'; 
import { CITIES, City } from '../../../constants/cities'; 
import { BJJ_EVENT_TYPES } from '../../../constants/eventTypes'; 
import { EventFormTestIds } from './eventForm.testIds'; 

interface BasicInfoSectionProps {
  name: string;
  type: BjjEventType;
  city: City;
  address: string | undefined;
  isSubmitting: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  name,
  type,
  city,
  address,
  isSubmitting,
  onInputChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Event Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Event Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          name="name"
          value={name}
          onChange={onInputChange}
          className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          disabled={isSubmitting}
          required
          data-testid={EventFormTestIds.NAME_INPUT}
          aria-required="true"
        />
      </div>

      {/* Event Type */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Event Type <span className="text-red-500">*</span>
        </label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={onInputChange}
          className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          disabled={isSubmitting}
          required
          data-testid={EventFormTestIds.TYPE_SELECT}
          aria-required="true"
        >
          {BJJ_EVENT_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* City */}
      <div>
        <label htmlFor="city" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          City <span className="text-red-500">*</span>
        </label>
        <select
          id="city"
          name="city"
          value={city}
          onChange={onInputChange}
          className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          disabled={isSubmitting}
          required
          data-testid={EventFormTestIds.CITY_SELECT}
          aria-required="true"
        >
          {CITIES.map((cityOption) => (
            <option key={cityOption.value} value={cityOption.value}>
              {cityOption.label}
            </option>
          ))}
        </select>
      </div>

      {/* Address */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Address / Venue <span className="text-xs text-slate-500">(Optional)</span>
        </label>
        <input
          id="address"
          type="text"
          name="address"
          value={address || ''}
          onChange={onInputChange}
          placeholder="e.g., Unit 5, Business Park, Main St"
          className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          disabled={isSubmitting}
          data-testid={EventFormTestIds.ADDRESS_INPUT}
        />
      </div>
    </div>
  );
};
