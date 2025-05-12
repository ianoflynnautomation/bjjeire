import { City } from '../constants/cities';
import {HateoasPagination} from  './common'; 

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
  dayOfWeek?: number | null; 
  date?: string | null;      
  openTime: string;        
  closeTime: string;
}

export interface BaseSchedule {
  scheduleType: ScheduleType;
}

export interface FixedDateSchedule extends BaseSchedule {
  scheduleType: ScheduleType.FixedDate;
  startDate: string;         
  endDate?: string;        
  hours: BjjEventHoursDto[];
}

export interface RecurringSchedule extends BaseSchedule {
  scheduleType: ScheduleType.Recurring;
  hours: BjjEventHoursDto[];   
  startDate?: string;        
  endDate?: string; 
}

export type EventScheduleUnion = FixedDateSchedule | RecurringSchedule;

export interface BjjEventDto {
  id?: string;
  name: string;
  type: BjjEventType;
  address?: string;
  city: City;
  isActive: boolean;
  schedule: EventScheduleUnion;
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
  schedule: EventScheduleUnion;
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
  type: string; 
  eventUrl?: string | null;
  organiser?: string | null;
  isActive: boolean;
  statusReason?: string | null;
  address?: string;
  city: City;
  schedule: EventScheduleUnion;
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
