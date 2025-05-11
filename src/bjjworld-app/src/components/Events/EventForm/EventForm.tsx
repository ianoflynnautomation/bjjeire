/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  ScheduleType,
  BjjEventType,
  EventFormData,
  BjjEventHoursDto,
  PricingType,
  FixedDateSchedule,
  RecurringSchedule,
  EventScheduleUnion,
} from '../../../types/event';
import { City, CITIES } from '../../../constants/cities';
import { BJJ_EVENT_TYPES } from '../../../constants/eventTypes';
import { DAYS_OF_WEEK } from '../../../constants/common';

// --- Helper: Unique ID Generator ---
const generateTempKey = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

// --- Local Form-Specific Types ---
interface FormBjjEventHoursDto extends BjjEventHoursDto {
  _formKey: string; // For React list key
}

// Define form-specific schedule types that use FormBjjEventHoursDto
interface FormFixedDateSchedule extends Omit<FixedDateSchedule, 'hours'> {
  hours: FormBjjEventHoursDto[];
}
interface FormRecurringSchedule extends Omit<RecurringSchedule, 'hours'> {
  hours: FormBjjEventHoursDto[];
}
type FormEventScheduleUnion = FormFixedDateSchedule | FormRecurringSchedule;

// This is the type for our component's internal state
interface FormDataTypeForState extends Omit<EventFormData, 'schedule'> {
  schedule: FormEventScheduleUnion;
}
// --- End Local Form-Specific Types ---

const getDefaultFormData = (): FormDataTypeForState => ({
  name: '',
  type: BJJ_EVENT_TYPES[0]?.value ?? BjjEventType.OpenMat,
  city: CITIES[0]?.value ?? City.Dublin,
  address: '',
  pricing: {
    type: PricingType.Free,
    amount: 0,
    durationDays: null,
    currency: 'EUR',
  },
  schedule: {
    scheduleType: ScheduleType.FixedDate,
    startDate: '',
    endDate: undefined,
    hours: [],
  } as FormFixedDateSchedule,
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
  const [formData, setFormData] = useState<FormDataTypeForState>(getDefaultFormData());

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const defaultState = getDefaultFormData();
        let effectiveSchedule: FormEventScheduleUnion;

        if (initialData.schedule) {
          const initialScheduleData = initialData.schedule as EventScheduleUnion; // From props

          const mapToFormHours = (hours: BjjEventHoursDto[] | undefined, type: ScheduleType): FormBjjEventHoursDto[] => {
            return hours?.map((h) => ({
              ...h,
              _formKey: generateTempKey(),
              dayOfWeek: type === ScheduleType.Recurring ? (h.dayOfWeek ?? null) : null,
              date: type === ScheduleType.FixedDate ? (h.date ?? null) : null,
            })) || [];
          };

          if (initialScheduleData.scheduleType === ScheduleType.FixedDate) {
            effectiveSchedule = {
              scheduleType: ScheduleType.FixedDate,
              startDate: initialScheduleData.startDate || '',
              endDate: initialScheduleData.endDate,
              hours: mapToFormHours(initialScheduleData.hours, ScheduleType.FixedDate),
            } as FormFixedDateSchedule;
          } else { // RecurringSchedule
            effectiveSchedule = {
              scheduleType: ScheduleType.Recurring,
              startDate: initialScheduleData.startDate,
              endDate: initialScheduleData.endDate,
              hours: mapToFormHours(initialScheduleData.hours, ScheduleType.Recurring),
            } as FormRecurringSchedule;
          }
        } else {
          effectiveSchedule = defaultState.schedule;
        }

        setFormData({
          ...defaultState,
          ...(initialData as Partial<Omit<EventFormData, 'schedule'>>), // Overlay non-schedule initialData
          schedule: effectiveSchedule,
        });
      } else {
        setFormData(getDefaultFormData());
      }
    }
  }, [initialData, isOpen]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'type'
          ? Number(value) as BjjEventType
          : name === 'city'
          ? (value as City)
          : value,
    }));
  };

  const handlePricingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const field = name.split('.')[1];

    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [field]: field === 'type' ? Number(value) as PricingType : (value ? Number(value) : 0),
      }
    }));
  };

  const handleScheduleTypeChange = (newScheduleType: ScheduleType) => {
    setFormData((prev) => {
      const existingStartDate = (prev.schedule as any).startDate;
      const existingEndDate = (prev.schedule as any).endDate;
      let newScheduleObject: FormEventScheduleUnion;

      if (newScheduleType === ScheduleType.FixedDate) {
        newScheduleObject = {
          scheduleType: ScheduleType.FixedDate,
          startDate: typeof existingStartDate === 'string' ? existingStartDate : '',
          endDate: existingEndDate,
          hours: [],
        } as FormFixedDateSchedule;
      } else { 
        newScheduleObject = {
          scheduleType: ScheduleType.Recurring,
          startDate: existingStartDate,
          endDate: existingEndDate,
          hours: [],
        } as FormRecurringSchedule;
      }
      return { ...prev, schedule: newScheduleObject };
    });
  };

  const handleScheduleDetailsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [name]: value || undefined,
      } as FormEventScheduleUnion,
    }));
  };

  const handleHourChange = (index: number, field: keyof BjjEventHoursDto, value: string | number | null) => {
    setFormData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        hours: prev.schedule.hours.map((hour, i) =>
          i === index
            ? { ...hour, [field]: value === '' && (field === 'date' || field === 'dayOfWeek') ? null : value }
            : hour
        ),
      } as FormEventScheduleUnion,
    }));
  };

  const addHourEntry = () => {
    setFormData((prev) => {
      const newHour: FormBjjEventHoursDto = {
        _formKey: generateTempKey(),
        openTime: '09:00',
        closeTime: '11:00',
        dayOfWeek: null,
        date: null,
      };
      const currentSchedule = prev.schedule;

      if (currentSchedule.scheduleType === ScheduleType.FixedDate) {
        newHour.date = currentSchedule.startDate || '';
      } else {
        newHour.dayOfWeek = DAYS_OF_WEEK[0]?.value ?? 0;
      }
      return {
        ...prev,
        schedule: {
          ...currentSchedule,
          hours: [...currentSchedule.hours, newHour],
        } as FormEventScheduleUnion,
      };
    });
  };

  const removeHourEntry = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        hours: prev.schedule.hours.filter((_, i) => i !== index),
      } as FormEventScheduleUnion,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentFormSchedule = formData.schedule;

    const finalHours: BjjEventHoursDto[] = currentFormSchedule.hours.map((formHour) => {
      const { ...dtoHour } = formHour;
      if (currentFormSchedule.scheduleType === ScheduleType.FixedDate) {
        return { openTime: dtoHour.openTime, closeTime: dtoHour.closeTime, date: dtoHour.date ?? null, dayOfWeek: null };
      } else { 
        return { openTime: dtoHour.openTime, closeTime: dtoHour.closeTime, dayOfWeek: dtoHour.dayOfWeek ?? null, date: null };
      }
    });

    let finalSchedulePayload: EventScheduleUnion;
    if (currentFormSchedule.scheduleType === ScheduleType.FixedDate) {
      finalSchedulePayload = {
        scheduleType: ScheduleType.FixedDate,
        startDate: currentFormSchedule.startDate,
        endDate: currentFormSchedule.endDate,
        hours: finalHours,
      } as FixedDateSchedule;
    } else { 
      finalSchedulePayload = {
        scheduleType: ScheduleType.Recurring,
        startDate: currentFormSchedule.startDate,
        endDate: currentFormSchedule.endDate,
        hours: finalHours,
      } as RecurringSchedule;
    }

    const payload: EventFormData = {
      ...(formData as Omit<EventFormData, 'schedule'>),
      schedule: finalSchedulePayload,
    };
    await onSubmit(payload);
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-emerald-100 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            {initialData?.name ? 'Edit Event' : 'Submit New Event'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700" aria-label="Close form">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">Event Name</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-md border-emerald-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              disabled={isSubmitting}
              required
            />
          </div>
          {/* Event Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-slate-700">Event Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-md border-emerald-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              disabled={isSubmitting}
              required
            >
              {BJJ_EVENT_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          {/* City */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-slate-700">City</label>
            <select
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-md border-emerald-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              disabled={isSubmitting}
              required
            >
              {CITIES.map((city) => (
                <option key={city.value} value={city.value}>{city.label}</option>
              ))}
            </select>
          </div>
          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-slate-700">Address</label>
            <input
              id="address"
              type="text"
              name="address"
              value={formData.address || ''}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-md border-emerald-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              disabled={isSubmitting}
            />
          </div>
          {/* Pricing Type */}
          <div>
            <label htmlFor="pricing.type" className="block text-sm font-medium text-slate-700">Pricing Type</label>
            <select
              id="pricing.type"
              name="pricing.type"
              value={formData.pricing.type}
              onChange={handlePricingChange}
              className="mt-1 w-full rounded-md border-emerald-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              disabled={isSubmitting}
              required
            >
              <option value={PricingType.Free}>Free</option>
              <option value={PricingType.FlatRate}>Flat Rate</option>
              <option value={PricingType.PerSession}>Per Session</option>
              <option value={PricingType.PerDay}>Per Day</option>
            </select>
          </div>
          {/* Pricing Amount */}
          {formData.pricing.type !== PricingType.Free && (
            <div>
              <label htmlFor="pricing.amount" className="block text-sm font-medium text-slate-700">Cost (EUR)</label>
              <input
                id="pricing.amount"
                type="number"
                name="pricing.amount"
                value={formData.pricing.amount}
                onChange={handlePricingChange}
                placeholder="e.g., 20"
                className="mt-1 w-full rounded-md border-emerald-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                disabled={isSubmitting}
                min="0"
                step="any"
                required
              />
            </div>
          )}

          {/* Schedule Section */}
          <div className="space-y-4 rounded-md border border-emerald-200 p-4">
            <h3 className="text-lg font-medium text-slate-900">Schedule Details</h3>
            {/* Schedule Type Select */}
            <div>
              <label htmlFor="scheduleTypeSelect" className="block text-sm font-medium text-slate-700">Schedule Type</label>
              <select
                id="scheduleTypeSelect"
                name="scheduleType"
                value={formData.schedule.scheduleType}
                onChange={(e) => handleScheduleTypeChange(e.target.value as ScheduleType)}
                className="mt-1 w-full rounded-md border-emerald-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                disabled={isSubmitting}
                required
              >
                <option value={ScheduleType.FixedDate}>Fixed Date (e.g., Seminar, Competition)</option>
                <option value={ScheduleType.Recurring}>Recurring (e.g., Regular Class)</option>
              </select>
            </div>
            {/* Start Date */}
            <div>
              <label htmlFor="schedule.startDate" className="block text-sm font-medium text-slate-700">
                {formData.schedule.scheduleType === ScheduleType.FixedDate ? 'Event Start Date' : 'Effective Start Date (Optional)'}
              </label>
              <input
                id="schedule.startDate"
                type="date"
                name="startDate"
                value={formData.schedule.startDate || ''}
                onChange={handleScheduleDetailsChange}
                className="mt-1 w-full rounded-md border-emerald-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                disabled={isSubmitting}
                required={formData.schedule.scheduleType === ScheduleType.FixedDate}
              />
            </div>
            {/* End Date */}
            <div>
              <label htmlFor="schedule.endDate" className="block text-sm font-medium text-slate-700">
                {formData.schedule.scheduleType === ScheduleType.FixedDate ? 'Event End Date (Optional)' : 'Effective End Date (Optional)'}
              </label>
              <input
                id="schedule.endDate"
                type="date"
                name="endDate"
                value={formData.schedule.endDate || ''}
                onChange={handleScheduleDetailsChange}
                className="mt-1 w-full rounded-md border-emerald-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                disabled={isSubmitting}
                min={formData.schedule.startDate || undefined}
              />
            </div>

            {/* Hours Configuration */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                {formData.schedule.scheduleType === ScheduleType.FixedDate ? 'Daily Hours' : 'Weekly Hours'}
                {formData.schedule.hours.length === 0 && <span className="text-xs text-slate-500"> (At least one time slot is required)</span>}
              </label>
              {formData.schedule.hours.map((hourEntry, index) => (
                <div key={hourEntry._formKey} className="grid grid-cols-1 gap-3 rounded-md border border-emerald-200 p-3 sm:grid-cols-[1fr_auto_auto_auto]">
                  {/* Date Input for FixedDate */}
                  {formData.schedule.scheduleType === ScheduleType.FixedDate && (
                    <div>
                      <label htmlFor={`hourDate-${index}`} className="sr-only">Date</label>
                      <input
                        type="date"
                        id={`hourDate-${index}`}
                        value={hourEntry.date || ''}
                        onChange={(e) => handleHourChange(index, 'date', e.target.value)}
                        className="w-full rounded-md border-emerald-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                        disabled={isSubmitting}
                        required
                        min={(formData.schedule as FixedDateSchedule).startDate || undefined}
                        max={(formData.schedule as FixedDateSchedule).endDate || undefined}
                      />
                    </div>
                  )}
                  {/* DayOfWeek Select for Recurring */}
                  {formData.schedule.scheduleType === ScheduleType.Recurring && (
                    <div>
                      <label htmlFor={`dayOfWeek-${index}`} className="sr-only">Day of Week</label>
                      <select
                        id={`dayOfWeek-${index}`}
                        value={hourEntry.dayOfWeek ?? ''}
                        onChange={(e) => handleHourChange(index, 'dayOfWeek', e.target.value === '' ? null : Number(e.target.value))}
                        className="w-full rounded-md border-emerald-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                        disabled={isSubmitting}
                        required
                      >
                        <option value="" disabled>Select Day</option>
                        {DAYS_OF_WEEK.map((day) => (
                          <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {/* Open Time */}
                  <div>
                    <label htmlFor={`openTime-${index}`} className="sr-only">Open Time</label>
                    <input
                      type="time"
                      id={`openTime-${index}`}
                      value={hourEntry.openTime}
                      onChange={(e) => handleHourChange(index, 'openTime', e.target.value)}
                      className="w-full rounded-md border-emerald-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  {/* Close Time */}
                  <div>
                    <label htmlFor={`closeTime-${index}`} className="sr-only">Close Time</label>
                    <input
                      type="time"
                      id={`closeTime-${index}`}
                      value={hourEntry.closeTime}
                      onChange={(e) => handleHourChange(index, 'closeTime', e.target.value)}
                      className="w-full rounded-md border-emerald-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                      disabled={isSubmitting}
                      required
                      min={hourEntry.openTime || undefined}
                    />
                  </div>
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeHourEntry(index)}
                    className="flex items-center justify-center rounded-md bg-orange-50 p-2 text-orange-500 hover:bg-orange-100"
                    aria-label="Remove time slot"
                    disabled={isSubmitting}
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
              {formData.schedule.hours.length === 0 && (
                <p className="text-sm text-slate-500">At least one time slot is required.</p>
              )}
              {/* Add Time Slot Button */}
              <button
                type="button"
                onClick={addHourEntry}
                className="mt-2 flex items-center gap-2 rounded-md border border-dashed border-emerald-400 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
                disabled={isSubmitting}
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-gradient-to-r from-emerald-700 to-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
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