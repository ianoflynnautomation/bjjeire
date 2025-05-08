import { BaseApiEntityModel } from './common';

export type EventType = 'open-mat' | 'camp' | 'tournament' | 'seminar';

// Interface for EventForm data
export interface EventFormData {
  title: string;
  type: EventType;
  city: 'Cork' | 'Dublin';
  date: string;
  description: string;
  contactEmail: string;
}

// Enum for BjjEventType (backend)
export enum BjjEventType {
  OpenMat = 0,
  Seminar = 1,
  Tournament = 2,
  Camp = 3,
  Other = 4,
}

// Interface for event hours
export interface BjjEventHoursDto {
  day: number;
  openTime: string;
  closeTime: string;
}

// Interface for contact details
export interface ContactDto {
  contactPerson: string;
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: Record<string, string | null>;
}

// Interface for geocoordinates
export interface GeoCoordinatesDto {
  type: string;
  latitude: number;
  longitude: number;
  placeName: string;
  placeId?: string;
}

// Interface for BJJ event (backend)
export interface BjjEventDto extends BaseApiEntityModel {
  eventName: string;
  type: BjjEventType;
  eventUrl?: string;
  isActive: boolean;
  statusReason?: string | null;
  address: string;
  bjjEventHours: BjjEventHoursDto[];
  contact: ContactDto;
  coordinates: GeoCoordinatesDto;
  cost?: number;
}

// Interface for API response
export interface BjjEventsResponseDto {
  data: BjjEventDto[];
  pagination: PaginationDto;
}

export interface PaginationDto {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPageUrl: string | null;
  previousPageUrl: string | null;
}

export interface GetBjjEventsPaginationQuery {
  page?: number;
  pageSize?: number;
  city?: string | 'all';
  type?: BjjEventType | 'all';
}

// Mapping for display
export const BJJ_EVENT_TYPES: { value: BjjEventType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Events' },
  { value: BjjEventType.OpenMat, label: 'Open Mat' },
  { value: BjjEventType.Seminar, label: 'Seminar' },
  { value: BjjEventType.Tournament, label: 'Tournament' },
  { value: BjjEventType.Camp, label: 'Camp' },
  { value: BjjEventType.Other, label: 'Other' },
];

// Mapping EventType to BjjEventType
export const mapEventTypeToBjjEventType = (type: EventType): BjjEventType => {
  switch (type) {
    case 'open-mat':
      return BjjEventType.OpenMat;
    case 'seminar':
      return BjjEventType.Seminar;
    case 'tournament':
      return BjjEventType.Tournament;
    case 'camp':
      return BjjEventType.Camp;
    default:
      return BjjEventType.Other;
  }
};