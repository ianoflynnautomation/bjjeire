import { City } from '../constants/cities';
import { BjjEventType, BackendBjjEventDto, BjjEventDto, EventFormData, ScheduleType } from '../types/event';

// Convert backend type string to BjjEventType enum
export const getBjjEventTypeFromString = (type: string): BjjEventType => {
  const typeMap: Record<string, BjjEventType> = {
    OpenMat: BjjEventType.OpenMat,
    Seminar: BjjEventType.Seminar,
    Tournament: BjjEventType.Tournament,
    Camp: BjjEventType.Camp,
    Other: BjjEventType.Other,
  };
  return typeMap[type] ?? BjjEventType.Other;
};

export const normalizeEvent = (backendEvent: BackendBjjEventDto): BjjEventDto => ({
  id: backendEvent.id ?? "", // Handle optional id (from previous fix)
  name: backendEvent.name,
  type: getBjjEventTypeFromString(backendEvent.type),
  city: backendEvent.city as City,
  isActive: backendEvent.isActive,
  address: backendEvent.address,
  eventUrl: backendEvent.eventUrl ?? undefined,
  schedule: {
    ...backendEvent.schedule,
    scheduleType: backendEvent.schedule.scheduleType as ScheduleType,
    hours: backendEvent.schedule.hours ?? [],
    startDate: backendEvent.schedule.startDate ?? undefined,
    endDate: backendEvent.schedule.endDate ?? undefined,
  },
  pricing: {
    ...backendEvent.pricing,
    amount: backendEvent.pricing.amount ?? 0,
    durationDays: backendEvent.pricing.durationDays ?? null,
    currency: backendEvent.pricing.currency ?? 'EUR',
    type: backendEvent.pricing.type,
  },
  coordinates: backendEvent.coordinates
    ? {
        type: 'Point',
        latitude: backendEvent.coordinates.latitude,
        longitude: backendEvent.coordinates.longitude,
      }
    : undefined,
  contact: backendEvent.contact
    ? {
        contactPerson: backendEvent.contact.contactPerson ?? undefined,
        phone: backendEvent.contact.phone ?? undefined, // Convert null to undefined
        email: backendEvent.contact.email ?? undefined, // Convert null to undefined
        website: backendEvent.contact.website ?? undefined, // Convert null to undefined
        socialMedia: backendEvent.contact.socialMedia ?? undefined, // Convert null to undefined
      }
    : undefined,
});

export const mapEventFormDataToDto = (formData: EventFormData): BackendBjjEventDto => {
  const typeMap: Record<BjjEventType, string> = {
    [BjjEventType.OpenMat]: 'OpenMat',
    [BjjEventType.Seminar]: 'Seminar',
    [BjjEventType.Tournament]: 'Tournament',
    [BjjEventType.Camp]: 'Camp',
    [BjjEventType.Other]: 'Other',
  };

  return {
    name: formData.name,
    type: typeMap[formData.type],
    eventUrl: formData.eventUrl ?? null,
    organiser: null,
    isActive: true,
    statusReason: null,
    address: formData.address ?? '',
    city: formData.city,
    schedule: {
      scheduleType: formData.schedule.scheduleType,
      startDate: formData.schedule.startDate ?? undefined, // Use undefined instead of null
      endDate: formData.schedule.endDate ?? undefined, // Use undefined instead of null
      hours: (formData.schedule.hours ?? []).map((hour) => ({
        dayOfWeek: hour.dayOfWeek ?? null,
        date: hour.date ?? null,
        openTime: hour.openTime,
        closeTime: hour.closeTime,
      })),
    },
    contact: {
      contactPerson: formData.contact?.contactPerson ?? '',
      phone: formData.contact?.phone ?? null,
      email: formData.contact?.email ?? null,
      website: formData.contact?.website ?? null,
      socialMedia: formData.contact?.socialMedia ?? null,
    },
    coordinates: formData.coordinates
      ? {
          type: 'Point',
          latitude: formData.coordinates.latitude,
          longitude: formData.coordinates.longitude,
          placeName: formData.address ?? '',
          placeId: null,
        }
      : undefined,
    pricing: {
      type: formData.pricing.type,
      amount: formData.pricing.amount ?? 0,
      durationDays: formData.pricing.durationDays ?? null,
      currency: formData.pricing.currency ?? 'EUR',
    },
  };
};