import React, { useState, useEffect } from 'react';
import { ScheduleType, BjjEventType } from '../../types/event'; // Assuming ScheduleType is already defined
import { City, CITIES } from '../../constants/cities'; // Assuming these are defined
import { BJJ_EVENT_TYPES } from '../../constants/eventTypes'; // Assuming these are defined

// --- Helper: Unique ID Generator ---
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

// --- Enhanced Type Definitions ---
interface HourEntry {
  id: string; // For React key and easier updates/removals
  openTime: string;
  closeTime: string;
  date?: string;      // For FixedDate
  dayOfWeek?: number; // For Recurring (e.g., 1 for Monday, 7 for Sunday)
}

export interface EventScheduleFormData {
  scheduleType: ScheduleType;
  startDate?: string; // For FixedDate, or overall period for Recurring
  endDate?: string;   // For FixedDate, or overall period for Recurring
  hours: HourEntry[]; // Will hold specific time slots
}

interface EventFormData {
  title: string;
  type: BjjEventType; // Ensure BjjEventType is correctly imported or defined
  city: City;        // Ensure City is correctly imported or defined
  address?: string;
  cost?: number;
  schedule: EventScheduleFormData;
}

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: EventFormData) => Promise<void>;
  isSubmitting: boolean;
  initialData?: Partial<EventFormData>; // Optional: For editing existing events
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

const getDefaultFormData = (): EventFormData => ({
  title: '',
  type: BJJ_EVENT_TYPES[0]?.value || ('' as unknown as BjjEventType), // Ensure BJJ_EVENT_TYPES is not empty
  city: CITIES[0] || ('' as City), // Ensure CITIES is not empty
  address: '',
  cost: undefined,
  schedule: {
    scheduleType: ScheduleType.FixedDate,
    startDate: '',
    endDate: '',
    hours: [],
  },
});

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
      setFormData((prev) => ({ ...prev, ...initialData, schedule: { ...prev.schedule, ...initialData.schedule, hours: initialData.schedule?.hours?.map(h => ({...h, id: h.id || generateId() })) || [] }}));
    } else {
      setFormData(getDefaultFormData());
    }
  }, [initialData, isOpen]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'cost' ? (value ? Number(value) : undefined) : value,
    }));
  };

  const handleScheduleTypeChange = (newScheduleType: ScheduleType) => {
    setFormData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        scheduleType: newScheduleType,
        hours: [], // Reset hours when type changes
        // Optionally reset startDate and endDate or adjust logic based on type
        // startDate: newScheduleType === ScheduleType.FixedDate ? prev.schedule.startDate : '',
        // endDate: newScheduleType === ScheduleType.FixedDate ? prev.schedule.endDate : '',
      },
    }));
  };
  
  const handleScheduleDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [name]: value,
      },
    }));
  }

  const handleHourChange = (id: string, field: keyof HourEntry, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        hours: prev.schedule.hours.map((hour) =>
          hour.id === id ? { ...hour, [field]: value } : hour
        ),
      },
    }));
  };

  const addHourEntry = () => {
    setFormData((prev) => {
      const newHour: HourEntry = {
        id: generateId(),
        openTime: '',
        closeTime: '',
      };
      if (prev.schedule.scheduleType === ScheduleType.FixedDate) {
        newHour.date = ''; // Default to empty or could be prev.schedule.startDate
      } else {
        newHour.dayOfWeek = DAYS_OF_WEEK[0].value; // Default to Monday
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

  const removeHourEntry = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        hours: prev.schedule.hours.filter((hour) => hour.id !== id),
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Transform formData.schedule.hours if needed before submitting
    // e.g., remove 'dayOfWeek' if FixedDate, remove 'date' if Recurring
    const payload = {
        ...formData,
        schedule: {
            ...formData.schedule,
            hours: formData.schedule.hours.map(h => {
                const {  ...rest } = h; // remove frontend-only id
                if (formData.schedule.scheduleType === ScheduleType.FixedDate) {
                    const { ...fixedHour } = rest;
                    return fixedHour;
                } else {
                    const {  ...recurringHour } = rest;
                    return recurringHour;
                }
            })
        }
    };
    await onSubmit(payload);
    // No need to call onClose() here if isSubmitting changes, let parent handle it
    // However, if onSubmit doesn't influence isSubmitting directly, you might want to call onClose or reset form
  };

  useEffect(() => {
    // Reset form if it closes and submission wasn't the cause, or if initialData changes
    if (!isOpen) {
     // setFormData(initialData ? { ...getDefaultFormData(), ...initialData } : getDefaultFormData());
    }
  }, [isOpen, initialData]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
                {initialData?.title ? 'Edit Event' : 'Submit New Event'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close form">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Event Details */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Event Title</label>
            <input
              id="title" type="text" name="title" value={formData.title} onChange={handleInputChange}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isSubmitting} required
            />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Event Type</label>
            <select
              id="type" name="type" value={formData.type} onChange={handleInputChange}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isSubmitting} required
            >
              {BJJ_EVENT_TYPES.map(({ value, label }) => (<option key={value} value={value}>{label}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
            <select
              id="city" name="city" value={formData.city} onChange={handleInputChange}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isSubmitting} required
            >
              {CITIES.map((city) => (<option key={city} value={city}>{city}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
            <input
              id="address" type="text" name="address" value={formData.address || ''} onChange={handleInputChange}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="cost" className="block text-sm font-medium text-gray-700">Cost (USD)</label>
            <input
              id="cost" type="number" name="cost" value={formData.cost ?? ''} onChange={handleInputChange} placeholder="e.g., 20 (leave blank if free)"
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isSubmitting} min="0" step="any"
            />
          </div>

          {/* Schedule Section */}
          <div className="space-y-4 rounded-md border border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-900">Schedule Details</h3>
            <div>
              <label htmlFor="scheduleType" className="block text-sm font-medium text-gray-700">Schedule Type</label>
              <select
                id="scheduleType" name="scheduleType" value={formData.schedule.scheduleType}
                onChange={(e) => handleScheduleTypeChange(e.target.value as ScheduleType)}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={isSubmitting} required
              >
                <option value={ScheduleType.FixedDate}>Fixed Date (e.g., Seminar, Competition)</option>
                <option value={ScheduleType.Recurring}>Recurring (e.g., Regular Class)</option>
              </select>
            </div>

            {/* Common Start/End Dates for overall period */}
             <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    {formData.schedule.scheduleType === ScheduleType.FixedDate ? "Event Start Date" : "Effective Start Date (Optional)"}
                </label>
                <input
                    id="startDate" type="date" name="startDate"
                    value={formData.schedule.startDate || ''}
                    onChange={handleScheduleDetailsChange}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={isSubmitting}
                    required={formData.schedule.scheduleType === ScheduleType.FixedDate}
                />
            </div>
            <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                     {formData.schedule.scheduleType === ScheduleType.FixedDate ? "Event End Date" : "Effective End Date (Optional)"}
                </label>
                <input
                    id="endDate" type="date" name="endDate"
                    value={formData.schedule.endDate || ''}
                    onChange={handleScheduleDetailsChange}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={isSubmitting}
                    // Make endDate required or conditionally required based on your logic for FixedDate
                    // For Recurring, it could be optional.
                     min={formData.schedule.startDate || undefined}
                />
            </div>


            {/* Hours Configuration */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                {formData.schedule.scheduleType === ScheduleType.FixedDate ? 'Daily Hours' : 'Weekly Hours'}
              </label>
              {formData.schedule.hours.map((hourEntry) => (
                <div key={hourEntry.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-[1fr_auto_auto_auto]">
                  {formData.schedule.scheduleType === ScheduleType.FixedDate && (
                    <div>
                      <label htmlFor={`hourDate-${hourEntry.id}`} className="sr-only">Date</label>
                      <input
                        type="date" id={`hourDate-${hourEntry.id}`} value={hourEntry.date || ''}
                        onChange={(e) => handleHourChange(hourEntry.id, 'date', e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        disabled={isSubmitting} required
                        min={formData.schedule.startDate || undefined}
                        max={formData.schedule.endDate || undefined}
                      />
                    </div>
                  )}
                  {formData.schedule.scheduleType === ScheduleType.Recurring && (
                    <div>
                      <label htmlFor={`dayOfWeek-${hourEntry.id}`} className="sr-only">Day of Week</label>
                      <select
                        id={`dayOfWeek-${hourEntry.id}`} value={hourEntry.dayOfWeek || ''}
                        onChange={(e) => handleHourChange(hourEntry.id, 'dayOfWeek', Number(e.target.value))}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        disabled={isSubmitting} required
                      >
                        <option value="" disabled>Select Day</option>
                        {DAYS_OF_WEEK.map(day => <option key={day.value} value={day.value}>{day.label}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label htmlFor={`openTime-${hourEntry.id}`} className="sr-only">Open Time</label>
                    <input
                      type="time" id={`openTime-${hourEntry.id}`} value={hourEntry.openTime}
                      onChange={(e) => handleHourChange(hourEntry.id, 'openTime', e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      disabled={isSubmitting} required
                    />
                  </div>
                  <div>
                    <label htmlFor={`closeTime-${hourEntry.id}`} className="sr-only">Close Time</label>
                    <input
                      type="time" id={`closeTime-${hourEntry.id}`} value={hourEntry.closeTime}
                      onChange={(e) => handleHourChange(hourEntry.id, 'closeTime', e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      disabled={isSubmitting} required
                      min={hourEntry.openTime || undefined}
                    />
                  </div>
                  <button
                    type="button" onClick={() => removeHourEntry(hourEntry.id)}
                    className="flex items-center justify-center rounded-md bg-red-50 p-2 text-red-500 hover:bg-red-100 sm:col-start-auto"
                    aria-label="Remove time slot" disabled={isSubmitting}
                  >
                     <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  </button>
                </div>
              ))}
              {formData.schedule.hours.length === 0 && (
                <p className="text-sm text-gray-500">
                  No specific time slots added yet. Click "Add Time Slot" to begin.
                </p>
              )}
              <button
                type="button" onClick={addHourEntry}
                className="mt-2 flex items-center gap-2 rounded-md border border-dashed border-gray-400 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                Add Time Slot
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button" onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isSubmitting || formData.schedule.hours.length === 0} // Optionally disable if no hours added
            >
              {isSubmitting ? 'Submitting...' : (initialData?.title ? 'Save Changes' : 'Submit Event')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};