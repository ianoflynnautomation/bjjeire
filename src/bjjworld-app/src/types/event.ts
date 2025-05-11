import { City } from '../constants/cities';
import {HateoasPagination} from  './common'; // Assuming HateoasPagination is correctly defined in './common'

export enum BjjEventType {
  OpenMat = 0,
  Seminar = 1,
  Tournament = 2,
  Camp = 3,
  Other = 4,
}

export enum PricingType {
  Free = 0,
  FlatRate = 1,
  PerSession = 2,
  PerDay = 3,
}

export enum ScheduleType {
  FixedDate = 'FixedDate',
  Recurring = 'Recurring',
}

export interface BjjEventPricingModelDto {
  type: PricingType;
  amount: number;
  durationDays?: number | null;
  currency: string;
}

export interface BjjEventHoursDto {
  dayOfWeek?: number | null; // 0 = Sunday, ..., 6 = Saturday. Crucial for RecurringSchedule.
  date?: string | null;      // ISO date string. Can be used by FixedDateSchedule for specific day's hours in a multi-day event.
  openTime: string;          // e.g., "09:00"
  closeTime: string;         // e.g., "11:00"
}

// --- New Schedule Structure ---

// Base interface for all schedule types
export interface BaseSchedule {
  scheduleType: ScheduleType;
}

// Specific interface for Fixed Date Schedules
export interface FixedDateSchedule extends BaseSchedule {
  scheduleType: ScheduleType.FixedDate;
  startDate: string;           // ISO date string, mandatory for fixed date events
  endDate?: string;          // ISO date string, optional (e.g., for single-day events)
  hours: BjjEventHoursDto[];   // Kept mandatory to align with original BjjEventScheduleDto
}

// Specific interface for Recurring Schedules
export interface RecurringSchedule extends BaseSchedule {
  scheduleType: ScheduleType.Recurring;
  hours: BjjEventHoursDto[];   // Mandatory. Entries should utilize 'dayOfWeek'.
  startDate?: string;          // ISO date string, optional: when the recurrence begins
  endDate?: string;            // ISO date string, optional: when the recurrence ends
}

// Union of all possible schedule types
export type EventScheduleUnion = FixedDateSchedule | RecurringSchedule;

// --- End of New Schedule Structure ---


export interface BjjEventDto {
  id?: string;
  name: string;
  type: BjjEventType;
  address?: string;
  city: City;
  isActive: boolean;
  schedule: EventScheduleUnion; // Updated to use the new union type
  pricing: BjjEventPricingModelDto;
  contact?: {
    contactPerson?: string;
    phone?: string;
    email?: string;
    website?: string;
    socialMedia?: Record<string, string>;
  };
  coordinates?: {
    type: 'Point';
    latitude: number;
    longitude: number;
  };
  eventUrl?: string;
}

export interface EventFormData {
  name: string;
  type: BjjEventType;
  city: City;
  address?: string;
  pricing: BjjEventPricingModelDto;
  schedule: EventScheduleUnion; // Updated to use the new union type
  contact?: {
    contactPerson?: string;
    phone?: string;
    email?: string;
    website?: string;
    socialMedia?: Record<string, string>;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  eventUrl?: string;
}

export interface BackendBjjEventDto {
  id?: string;
  name: string;
  type: string; // Note: This is 'string', consider aligning with BjjEventType if it's a direct mapping
  eventUrl?: string | null;
  organiser?: string | null;
  isActive: boolean;
  statusReason?: string | null;
  address?: string;
  city: City;
  schedule: EventScheduleUnion; // Updated to use the new union type
  pricing: BjjEventPricingModelDto;
  contact?: {
    contactPerson?: string;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    socialMedia?: Record<string, string> | null;
  };
  coordinates?: {
    type: 'Point';
    latitude: number;
    longitude: number;
    placeName?: string;
    placeId?: string | null;
  };
}

export interface GetBjjEventsPaginationQuery {
  city: City | 'all';
  type?: BjjEventType;
  page: number;
  pageSize: number;
}

export interface BackendBjjEventsResponse {
  data: BackendBjjEventDto[];
  pagination: HateoasPagination;
}

// The old BjjEventScheduleDto is now removed.
// The BaseSchedule, FixedDateSchedule, RecurringSchedule, and EventScheduleUnion
// definitions you added at the bottom are now integrated above and used.