import { City } from '../constants/cities';
import { BjjEventType, BackendBjjEventDto, BjjEventDto, EventFormData, RecurringSchedule, ScheduleType, EventScheduleUnion, FixedDateSchedule } from '../types/event';

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

export const normalizeEvent = (backendEvent: BackendBjjEventDto): BjjEventDto => {
  // Normalize schedule based on scheduleType
  const normalizeSchedule = (schedule: EventScheduleUnion): EventScheduleUnion => {
    if (schedule.scheduleType === ScheduleType.FixedDate) {
      return {
        scheduleType: ScheduleType.FixedDate,
        startDate: schedule.startDate, // Required for FixedDate
        endDate: schedule.endDate ?? undefined,
        hours: schedule.hours ?? [],
      } as FixedDateSchedule;
    } else {
      return {
        scheduleType: ScheduleType.Recurring,
        startDate: schedule.startDate ?? undefined,
        endDate: schedule.endDate ?? undefined,
        hours: schedule.hours ?? [],
      } as RecurringSchedule;
    }
  };

  return {
    id: backendEvent.id ?? "",
    name: backendEvent.name,
    type: getBjjEventTypeFromString(backendEvent.type),
    city: backendEvent.city as City,
    isActive: backendEvent.isActive,
    address: backendEvent.address,
    eventUrl: backendEvent.eventUrl ?? undefined,
    schedule: normalizeSchedule(backendEvent.schedule),
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
          phone: backendEvent.contact.phone ?? undefined,
          email: backendEvent.contact.email ?? undefined,
          website: backendEvent.contact.website ?? undefined,
          socialMedia: backendEvent.contact.socialMedia ?? undefined,
        }
      : undefined,
  };
};

export const mapEventFormDataToDto = (formData: EventFormData): BackendBjjEventDto => {
  const typeMap: Record<BjjEventType, string> = {
    [BjjEventType.OpenMat]: 'OpenMat',
    [BjjEventType.Seminar]: 'Seminar',
    [BjjEventType.Tournament]: 'Tournament',
    [BjjEventType.Camp]: 'Camp',
    [BjjEventType.Other]: 'Other',
  };

  // Map schedule based on scheduleType
  const mapSchedule = (schedule: EventScheduleUnion): EventScheduleUnion => {
    if (schedule.scheduleType === ScheduleType.FixedDate) {
      return {
        scheduleType: ScheduleType.FixedDate,
        startDate: schedule.startDate, // Required for FixedDate
        endDate: schedule.endDate ?? undefined,
        hours: (schedule.hours ?? []).map((hour) => ({
          dayOfWeek: hour.dayOfWeek ?? null,
          date: hour.date ?? null,
          openTime: hour.openTime,
          closeTime: hour.closeTime,
        })),
      } as FixedDateSchedule;
    } else {
      return {
        scheduleType: ScheduleType.Recurring,
        startDate: schedule.startDate ?? undefined,
        endDate: schedule.endDate ?? undefined,
        hours: (schedule.hours ?? []).map((hour) => ({
          dayOfWeek: hour.dayOfWeek ?? null,
          date: hour.date ?? null,
          openTime: hour.openTime,
          closeTime: hour.closeTime,
        })),
      } as RecurringSchedule;
    }
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
    schedule: mapSchedule(formData.schedule),
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