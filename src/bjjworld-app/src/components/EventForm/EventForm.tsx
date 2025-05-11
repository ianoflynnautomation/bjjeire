import React, { useState, useEffect } from 'react';
import {
  ScheduleType,
  BjjEventType,
  EventFormData,
  BjjEventHoursDto,
  PricingType,
} from '../../types/event';
import { City, CITIES } from '../../constants/cities';
import { BJJ_EVENT_TYPES } from '../../constants/eventTypes';
import { DAYS_OF_WEEK } from '../../constants/common';

// --- Helper: Unique ID Generator for Temporary Keys (only for rendering) ---
const generateTempKey = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const getDefaultFormData = (): EventFormData => ({
  name: '',
  type: BJJ_EVENT_TYPES[0]?.value || BjjEventType.OpenMat,
  city: CITIES[0]?.value || City.Dublin,
  address: '',
  pricing: {
    type: PricingType.Free,
    amount: 0,
    durationDays: null,
    currency: 'EUR',
  },
  schedule: {
    scheduleType: ScheduleType.FixedDate,
    startDate: undefined,
    endDate: undefined,
    hours: [] as BjjEventHoursDto[], // Use BjjEventHoursDto directly
  },
  contact: undefined,
  coordinates: undefined,
  eventUrl: undefined,
});

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: EventFormData) => Promise<void>;
  isSubmitting: boolean;
  initialData?: Partial<EventFormData>;
}

export const EventForm: React.FC<EventFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  initialData,
}) => {
  const [formData, setFormData] = useState<EventFormData>(
    initialData ? { ...getDefaultFormData(), ...initialData } : getDefaultFormData()
  );

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...getDefaultFormData(),
        ...initialData,
        schedule: {
          ...getDefaultFormData().schedule,
          ...initialData.schedule,
          hours: initialData.schedule?.hours?.map((h) => ({
            ...h,
            dayOfWeek: h.dayOfWeek ?? null,
            date: h.date ?? null,
          })) || ([] as BjjEventHoursDto[]),
        },
      });
    } else {
      setFormData(getDefaultFormData());
    }
  }, [initialData, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'pricing.amount'
          ? value
            ? Number(value)
            : 0
          : name === 'city'
          ? (value as City)
          : value,
    }));
  };

  const handlePricingTypeChange = (type: PricingType) => {
    setFormData((prev) => ({
      ...prev,
      pricing: { ...prev.pricing, type },
    }));
  };

  const handleScheduleTypeChange = (newScheduleType: ScheduleType) => {
    setFormData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        scheduleType: newScheduleType,
        hours: [] as BjjEventHoursDto[], // Reset hours when type changes
      },
    }));
  };

  const handleScheduleDetailsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [name]: value || undefined, // Convert empty string to undefined for dates
      },
    }));
  };

  const handleHourChange = (index: number, field: keyof BjjEventHoursDto, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        hours: prev.schedule.hours.map((hour, i) =>
          i === index ? { ...hour, [field]: value } : hour
        ),
      },
    }));
  };

  const addHourEntry = () => {
    setFormData((prev) => {
      const newHour: BjjEventHoursDto = {
        openTime: '',
        closeTime: '',
        dayOfWeek: null,
        date: null,
      };
      if (prev.schedule.scheduleType === ScheduleType.FixedDate) {
        newHour.date = prev.schedule.startDate || '';
      } else {
        newHour.dayOfWeek = DAYS_OF_WEEK[0].value; // Default to Monday (value: 1)
      }
      return {
        ...prev,
        schedule: {
          ...prev.schedule,
          hours: [...prev.schedule.hours, newHour],
        },
      };
    });
  };

  const removeHourEntry = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        hours: prev.schedule.hours.filter((_, i) => i !== index),
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: EventFormData = {
      ...formData,
      schedule: {
        ...formData.schedule,
        hours: formData.schedule.hours.map((h): BjjEventHoursDto => {
          const { openTime, closeTime, dayOfWeek, date } = h;
          if (formData.schedule.scheduleType === ScheduleType.FixedDate) {
            return { openTime, closeTime, date }; // Exclude dayOfWeek
          } else {
            return {
              openTime,
              closeTime,
              dayOfWeek: dayOfWeek ? (dayOfWeek % 7) : null, // Map 1-7 to 0-6
            }; // Exclude date
          }
        }),
      },
    };
    await onSubmit(payload);
  };

  useEffect(() => {
    if (!isOpen) {
      setFormData(getDefaultFormData());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {initialData?.name ? 'Edit Event' : 'Submit New Event'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close form"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Event Details */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Event Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isSubmitting}
              required
            />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Event Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isSubmitting}
              required
            >
              {BJJ_EVENT_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City
            </label>
            <select
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isSubmitting}
              required
            >
              {CITIES.map((city) => (
                <option key={city.value} value={city.value}>
                  {city.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              id="address"
              type="text"
              name="address"
              value={formData.address || ''}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="pricing.type" className="block text-sm font-medium text-gray-700">
              Pricing Type
            </label>
            <select
              id="pricing.type"
              name="pricing.type"
              value={formData.pricing.type}
              onChange={(e) => handlePricingTypeChange(Number(e.target.value) as PricingType)}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isSubmitting}
              required
            >
              <option value={PricingType.Free}>Free</option>
              <option value={PricingType.FlatRate}>Flat Rate</option>
              <option value={PricingType.PerSession}>Per Session</option>
              <option value={PricingType.PerDay}>Per Day</option>
            </select>
          </div>
          <div>
            <label htmlFor="pricing.amount" className="block text-sm font-medium text-gray-700">
              Cost (EUR)
            </label>
            <input
              id="pricing.amount"
              type="number"
              name="pricing.amount"
              value={formData.pricing.amount}
              onChange={handleInputChange}
              placeholder="e.g., 20 (0 for free)"
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isSubmitting}
              min="0"
              step="any"
            />
          </div>

          {/* Schedule Section */}
          <div className="space-y-4 rounded-md border border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-900">Schedule Details</h3>
            <div>
              <label htmlFor="scheduleType" className="block text-sm font-medium text-gray-700">
                Schedule Type
              </label>
              <select
                id="scheduleType"
                name="scheduleType"
                value={formData.schedule.scheduleType}
                onChange={(e) => handleScheduleTypeChange(e.target.value as ScheduleType)}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={isSubmitting}
                required
              >
                <option value={ScheduleType.FixedDate}>Fixed Date (e.g., Seminar, Competition)</option>
                <option value={ScheduleType.Recurring}>Recurring (e.g., Regular Class)</option>
              </select>
            </div>

            {/* Common Start/End Dates for overall period */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                {formData.schedule.scheduleType === ScheduleType.FixedDate
                  ? 'Event Start Date'
                  : 'Effective Start Date (Optional)'}
              </label>
              <input
                id="startDate"
                type="date"
                name="startDate"
                value={formData.schedule.startDate || ''}
                onChange={handleScheduleDetailsChange}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={isSubmitting}
                required={formData.schedule.scheduleType === ScheduleType.FixedDate}
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                {formData.schedule.scheduleType === ScheduleType.FixedDate
                  ? 'Event End Date'
                  : 'Effective End Date (Optional)'}
              </label>
              <input
                id="endDate"
                type="date"
                name="endDate"
                value={formData.schedule.endDate || ''}
                onChange={handleScheduleDetailsChange}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={isSubmitting}
                min={formData.schedule.startDate || undefined}
              />
            </div>

            {/* Hours Configuration */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                {formData.schedule.scheduleType === ScheduleType.FixedDate ? 'Daily Hours' : 'Weekly Hours'}
              </label>
              {formData.schedule.hours.map((hourEntry, index) => (
                <div
                  key={generateTempKey()} // Use temporary key for rendering
                  className="grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-[1fr_auto_auto_auto]"
                >
                  {formData.schedule.scheduleType === ScheduleType.FixedDate && (
                    <div>
                      <label htmlFor={`hourDate-${index}`} className="sr-only">
                        Date
                      </label>
                      <input
                        type="date"
                        id={`hourDate-${index}`}
                        value={hourEntry.date || ''}
                        onChange={(e) => handleHourChange(index, 'date', e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        disabled={isSubmitting}
                        required
                        min={formData.schedule.startDate || undefined}
                        max={formData.schedule.endDate || undefined}
                      />
                    </div>
                  )}
                  {formData.schedule.scheduleType === ScheduleType.Recurring && (
                    <div>
                      <label htmlFor={`dayOfWeek-${index}`} className="sr-only">
                        Day of Week
                      </label>
                      <select
                        id={`dayOfWeek-${index}`}
                        value={hourEntry.dayOfWeek || ''}
                        onChange={(e) => handleHourChange(index, 'dayOfWeek', Number(e.target.value))}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        disabled={isSubmitting}
                        required
                      >
                        <option value="" disabled>
                          Select Day
                        </option>
                        {DAYS_OF_WEEK.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label htmlFor={`openTime-${index}`} className="sr-only">
                      Open Time
                    </label>
                    <input
                      type="time"
                      id={`openTime-${index}`}
                      value={hourEntry.openTime}
                      onChange={(e) => handleHourChange(index, 'openTime', e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor={`closeTime-${index}`} className="sr-only">
                      Close Time
                    </label>
                    <input
                      type="time"
                      id={`closeTime-${index}`}
                      value={hourEntry.closeTime}
                      onChange={(e) => handleHourChange(index, 'closeTime', e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      disabled={isSubmitting}
                      required
                      min={hourEntry.openTime || undefined}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeHourEntry(index)}
                    className="flex items-center justify-center rounded-md bg-red-50 p-2 text-red-500 hover:bg-red-100 sm:col-start-auto"
                    aria-label="Remove time slot"
                    disabled={isSubmitting}
                  >
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
              {formData.schedule.hours.length === 0 && (
                <p className="text-sm text-gray-500">
                  No specific time slots added yet. Click "Add Time Slot" to begin.
                </p>
              )}
              <button
                type="button"
                onClick={addHourEntry}
                className="mt-2 flex items-center gap-2 rounded-md border border-dashed border-gray-400 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Add Time Slot
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isSubmitting || formData.schedule.hours.length === 0}
            >
              {isSubmitting ? 'Submitting...' : (initialData?.name ? 'Save Changes' : 'Submit Event')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};