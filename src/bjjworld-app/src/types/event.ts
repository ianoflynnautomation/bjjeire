import { City } from '../constants/cities';

export enum BjjEventType {
  OpenMat = 0,
  Seminar = 1,
  Tournament = 2,
  Camp = 3,
  Other = 4,
}

export enum ScheduleType {
  Recurring = 'Recurring',
  FixedDate = 'FixedDate',
}

export interface BjjEventHoursDto {
  dayOfWeek?: number | null;
  date?: string | null;
  openTime: string;
  closeTime: string;
}

export interface BjjEventScheduleDto {
  scheduleType: ScheduleType;
  startDate?: string | null;
  endDate?: string | null;
  hours: BjjEventHoursDto[];
}

export interface BackendBjjEventHoursDto {
  day?: string;
  date?: string | null;
  openTime: string;
  closeTime: string;
}

export interface BackendBjjEventScheduleDto {
  scheduleType: string;
  startDate?: string | null;
  endDate?: string | null;
  hours: BackendBjjEventHoursDto[];
}

export interface ContactDto {
  contactPerson?: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  socialMedia?: {
    facebook?: string | null;
    twitter?: string | null;
    instagram?: string | null;
    youtube?: string | null;
  } | null;
}

export interface GeoCoordinatesDto {
  type: string;
  latitude: number;
  longitude: number;
  placeName?: string;
  placeId?: string | null;
}

export interface BackendBjjEventDto {
  id?: string;
  name: string;
  type: string;
  eventUrl?: string | null;
  isActive: boolean;
  statusReason?: string | null;
  address: string;
  city: string;
  schedule: BackendBjjEventScheduleDto;
  contact: ContactDto;
  coordinates: GeoCoordinatesDto;
  cost?: number | null;
  createdOnUtc?: string;
  updatedOnUtc?: string | null;
}

export interface BjjEventDto {
  id?: string;
  name: string;
  type: BjjEventType;
  eventUrl?: string | null;
  isActive: boolean;
  statusReason?: string | null;
  address: string;
  city: City;
  schedule: BjjEventScheduleDto;
  contact: ContactDto;
  coordinates: GeoCoordinatesDto;
  cost?: number | null;
}

export interface GetBjjEventsPaginationQuery {
  page?: number;
  pageSize?: number;
  city?: City | 'all';
  type?: BjjEventType | 'all';
}

export interface EventScheduleFormData {
  scheduleType: ScheduleType;
  startDate?: string;
  endDate?: string;
  hours?: { openTime: string; closeTime: string; date?: string }[];
}

export interface EventFormData {
  title: string;
  type: BjjEventType;
  city: City;
  address?: string;
  cost?: number;
  schedule: EventScheduleFormData;
}