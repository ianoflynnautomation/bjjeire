import { EventFormData, BackendBjjEventDto, BjjEventDto, BjjEventType, ScheduleType } from '../types/event';
import { City } from '../constants/cities';

// Validates and maps a backend city string to a valid City type
const mapCity = (city: string): City => {
  const validCities: City[] = ['Cork', 'Dublin', 'all'];
  return validCities.includes(city as City) ? (city as City) : 'all';
};

// Normalizes backend DTO to frontend DTO
export const normalizeEvent = (backendEvent: BackendBjjEventDto): BjjEventDto => {
  const typeMap: { [key: string]: BjjEventType } = {
    OpenMat: BjjEventType.OpenMat,
    Seminar: BjjEventType.Seminar,
    Tournament: BjjEventType.Tournament,
    Camp: BjjEventType.Camp,
    Other: BjjEventType.Other,
  };

  return {
    id: backendEvent.id,
    name: backendEvent.name,
    type: typeMap[backendEvent.type] ?? BjjEventType.Other,
    eventUrl: backendEvent.eventUrl,
    isActive: backendEvent.isActive,
    statusReason: backendEvent.statusReason,
    address: backendEvent.address,
    city: mapCity(backendEvent.city),
    schedule: {
      scheduleType: backendEvent.schedule.scheduleType as ScheduleType,
      startDate: backendEvent.schedule.startDate,
      endDate: backendEvent.schedule.endDate,
      hours: (backendEvent.schedule.hours ?? []).map((hour) => ({
        dayOfWeek: hour.day ? getDayOfWeekNumber(hour.day) : null,
        date: hour.date,
        openTime: hour.openTime,
        closeTime: hour.closeTime,
      })),
    },
    contact: backendEvent.contact,
    coordinates: backendEvent.coordinates,
    cost: backendEvent.cost,
  };
};

// Helper to convert day string to number (0-6)
const getDayOfWeekNumber = (day: string): number => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days.indexOf(day);
};

// Maps form data to backend DTO for POST request
export const mapEventFormDataToDto = (formData: EventFormData): BackendBjjEventDto => {
  const typeMap: { [key: number]: string } = {
    [BjjEventType.OpenMat]: 'OpenMat',
    [BjjEventType.Seminar]: 'Seminar',
    [BjjEventType.Tournament]: 'Tournament',
    [BjjEventType.Camp]: 'Camp',
    [BjjEventType.Other]: 'Other',
  };

  return {
    name: formData.title,
    type: typeMap[formData.type] ?? 'Other',
    city: formData.city,
    address: formData.address || '',
    cost: formData.cost || null,
    schedule: {
      scheduleType: formData.schedule.scheduleType,
      startDate: formData.schedule.startDate || null,
      endDate: formData.schedule.endDate || null,
      hours: formData.schedule.hours ?? [],
    },
    isActive: true,
    statusReason: 'Published',
    eventUrl: null,
    contact: {},
    coordinates: { type: 'Point', latitude: 0, longitude: 0 },
  };
};