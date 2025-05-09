import { City } from '../constants/cities';
import { BjjEventType, BjjEventDto, BackendBjjEventDto, EventFormData, ScheduleType } from '../types/event';
import { getBjjEventTypeFromString } from '../constants/eventTypes';

// Helper function to convert day string to dayOfWeek number (e.g., 'Monday' -> 1)
const getDayOfWeek = (day: string): number => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days.indexOf(day);
};

// Map backend event to frontend event
export const normalizeEvent = (backendEvent: BackendBjjEventDto): BjjEventDto => ({
  ...backendEvent,
  type: getBjjEventTypeFromString(backendEvent.type),
  city: backendEvent.city as City, // Safe cast since backend ensures valid city
  schedule: {
    ...backendEvent.schedule,
    scheduleType: backendEvent.schedule.scheduleType as ScheduleType,
    hours: backendEvent.schedule.hours.map((hour) => ({
      dayOfWeek: hour.day ? getDayOfWeek(hour.day) : null,
      date: hour.date,
      openTime: hour.openTime,
      closeTime: hour.closeTime,
    })),
  },
});

// Map EventFormData to BackendBjjEventDto for API submission
export const mapEventFormDataToDto = (formData: EventFormData): BackendBjjEventDto => {
  // Convert BjjEventType enum to string representation for backend
  const typeMap: Record<BjjEventType, string> = {
    [BjjEventType.OpenMat]: 'OpenMat',
    [BjjEventType.Seminar]: 'Seminar',
    [BjjEventType.Tournament]: 'Tournament',
    [BjjEventType.Camp]: 'Camp',
    [BjjEventType.Other]: 'Other',
  };

  return {
    name: formData.title,
    type: typeMap[formData.type], // Convert enum to string
    city: formData.city, // City is already a string (e.g., 'Cork', 'Dublin')
    address: formData.address || '', // Provide empty string if undefined
    cost: formData.cost ?? null, // Use null if undefined
    schedule: {
      scheduleType: formData.schedule.scheduleType,
      startDate: formData.schedule.startDate ?? null,
      endDate: formData.schedule.endDate ?? null,
      hours: (formData.schedule.hours ?? []).map((hour) => ({
        date: hour.date ?? null,
        openTime: hour.openTime,
        closeTime: hour.closeTime,
        day: hour.date ? undefined : formData.schedule.scheduleType === ScheduleType.Recurring ? 'Sunday' : undefined, // Default to Sunday for recurring, omit for fixed date
      })),
    },
    isActive: true, // Default for new events
    contact: {}, // Empty contact object (adjust based on form data if contact fields are added)
    coordinates: {
      type: 'Point',
      latitude: 0, // Placeholder; backend may geocode based on address
      longitude: 0,
      placeName: formData.address || '',
    },
    eventUrl: null, // Optional, not provided in form
    statusReason: null, // Optional
    createdOnUtc: new Date().toISOString(), // Set current timestamp
    updatedOnUtc: null, // Not set for new events
  };
};