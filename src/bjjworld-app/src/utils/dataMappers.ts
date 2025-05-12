/* eslint-disable @typescript-eslint/no-explicit-any */
import { City } from '../constants/cities';
import {
  BjjEventDto,
  EventFormData,
  BjjEventType,
  ScheduleType,
  BjjEventHoursDto,
  PricingType,
  EventScheduleUnion,
  FixedDateSchedule,
  RecurringSchedule,
} from '../types/event';

// Convert BjjEventType enum to backend string
export const getBjjEventTypeToString = (type: BjjEventType): string => {
  const typeMap: Record<BjjEventType, string> = {
    [BjjEventType.OpenMat]: 'OpenMat',
    [BjjEventType.Seminar]: 'Seminar',
    [BjjEventType.Tournament]: 'Tournament',
    [BjjEventType.Camp]: 'Camp',
    [BjjEventType.Other]: 'Other',
  };
  return typeMap[type] ?? 'Other';
};

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

// Normalize backend BjjEventDto to frontend BjjEventDto
export const normalizeEvent = (backendEvent: any): BjjEventDto => {
  // Normalize schedule to EventScheduleUnion
  const normalizeSchedule = (schedule: any): EventScheduleUnion => {
    if (schedule?.scheduleType === ScheduleType.FixedDate) {
      return {
        scheduleType: ScheduleType.FixedDate,
        startDate: schedule.startDate ?? '', // Required for FixedDate
        endDate: schedule.endDate ?? undefined,
        hours: (schedule.hours ?? []).map((hour: any): BjjEventHoursDto => ({
          dayOfWeek: hour.day ?? null, // Map backend 'day' to 'dayOfWeek'
          date: null, // Backend doesn't use date
          openTime: hour.openTime ?? '',
          closeTime: hour.closeTime ?? '',
        })),
      } as FixedDateSchedule;
    }
    return {
      scheduleType: ScheduleType.Recurring,
      startDate: schedule?.startDate ?? undefined,
      endDate: schedule?.endDate ?? undefined,
      hours: (schedule?.hours ?? []).map((hour: any): BjjEventHoursDto => ({
        dayOfWeek: hour.day ?? null, // Map backend 'day' to 'dayOfWeek'
        date: null, // Backend doesn't use date
        openTime: hour.openTime ?? '',
        closeTime: hour.closeTime ?? '',
      })),
    } as RecurringSchedule;
  };

  return {
    id: backendEvent.id ?? undefined,
    createdOnUtc: backendEvent.createdOnUtc ?? null,
    updatedOnUtc: backendEvent.updatedOnUtc ?? null,
    name: backendEvent.name ?? '',
    description: backendEvent.description ?? null,
    type: getBjjEventTypeFromString(backendEvent.type),
    organiser: {
      name: backendEvent.organiser?.name ?? '',
      website: backendEvent.organiser?.website ?? '',
    },
    status: backendEvent.status ?? 0, // Adjust based on EventStatus enum
    statusReason: backendEvent.statusReason ?? null,
    socialMedia: {
      instagram: backendEvent.socialMedia?.instagram ?? '',
      facebook: backendEvent.socialMedia?.facebook ?? '',
      x: backendEvent.socialMedia?.x ?? '',
      youTube: backendEvent.socialMedia?.youTube ?? '',
    },
    region: backendEvent.region ?? '',
    city: backendEvent.city as City,
    location: {
      address: backendEvent.location?.address ?? '',
      venue: backendEvent.location?.venue ?? '',
      coordinates: {
        type: 'Point',
        latitude: backendEvent.location?.coordinates?.latitude ?? 0,
        longitude: backendEvent.location?.coordinates?.longitude ?? 0,
        placeName: backendEvent.location?.coordinates?.placeName ?? null,
        placeId: backendEvent.location?.coordinates?.placeId ?? null,
      },
    },
    schedule: normalizeSchedule(backendEvent.schedule),
    pricing: {
      type: backendEvent.pricing?.type ?? PricingType.Free,
      amount: backendEvent.pricing?.amount ?? 0,
      durationDays: backendEvent.pricing?.durationDays ?? null,
      currency: backendEvent.pricing?.currency ?? 'EUR',
    },
    eventUrl: backendEvent.eventUrl ?? '',
    imageUrl: backendEvent.imageUrl ?? '',
  };
};

// Map frontend EventFormData to backend BjjEventDto
export const mapEventFormDataToDto = (formData: EventFormData): any => {
  // Map schedule to backend structure
  const mapSchedule = (schedule: EventScheduleUnion): any => {
    return {
      scheduleType: schedule.scheduleType,
      startDate: schedule.startDate ?? null,
      endDate: schedule.endDate ?? null,
      hours: (schedule.hours ?? []).map((hour) => ({
        day: hour.dayOfWeek ?? null, // Map 'dayOfWeek' to backend 'day'
        openTime: hour.openTime,
        closeTime: hour.closeTime,
      })),
    };
  };

  return {
    name: formData.name,
    description: formData.description ?? null,
    type: getBjjEventTypeToString(formData.type),
    organiser: {
      name: formData.organiser.name,
      website: formData.organiser.website,
    },
    status: formData.status,
    statusReason: formData.statusReason ?? null,
    socialMedia: {
      instagram: formData.socialMedia.instagram,
      facebook: formData.socialMedia.facebook,
      x: formData.socialMedia.x,
      youTube: formData.socialMedia.youTube,
    },
    region: formData.region,
    city: formData.city,
    location: {
      address: formData.location.address,
      venue: formData.location.venue,
      coordinates: {
        type: 'Point',
        latitude: formData.location.coordinates.latitude,
        longitude: formData.location.coordinates.longitude,
        placeName: formData.location.coordinates.placeName ?? null,
        placeId: formData.location.coordinates.placeId ?? null,
      },
    },
    schedule: mapSchedule(formData.schedule),
    pricing: {
      type: formData.pricing.type,
      amount: formData.pricing.amount,
      durationDays: formData.pricing.durationDays ?? null,
      currency: formData.pricing.currency,
    },
    eventUrl: formData.eventUrl,
    imageUrl: formData.imageUrl,
  };
};