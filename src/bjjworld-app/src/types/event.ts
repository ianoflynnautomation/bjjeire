import { City } from '../constants/cities' // Add this import

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
  dayOfWeek?: number | null
  date?: string | null
  openTime: string
  closeTime: string
}

export interface BjjEventScheduleDto {
  scheduleType: ScheduleType
  startDate?: string | null
  endDate?: string | null
  hours?: BjjEventHoursDto[]
}

export interface BackendBjjEventHoursDto {
  day?: string
  date?: string | null
  openTime: string
  closeTime: string
}

export interface BackendBjjEventScheduleDto {
  scheduleType: string
  startDate?: string | null
  endDate?: string | null
  hours?: BackendBjjEventHoursDto[]
}

export interface BackendBjjEventDto {
  name: string
  type: string
  eventUrl?: string | null
  isActive: boolean
  statusReason?: string | null
  address: string
  city: string
  schedule: BackendBjjEventScheduleDto
  contact: ContactDto
  coordinates: GeoCoordinatesDto
  cost?: number | null
  id?: string
  createdOnUtc?: string
  updatedOnUtc?: string | null
}

export interface ContactDto {
  contactPerson?: string
  phone?: string | null
  email?: string | null
  website?: string | null
  socialMedia?: { [key: string]: string } | null
}

export interface GeoCoordinatesDto {
  type: string
  latitude: number
  longitude: number
  placeName?: string
  placeId?: string | null
}

export interface BjjEventDto {
  name: string
  type: BjjEventType
  eventUrl?: string | null
  isActive: boolean
  statusReason?: string | null
  address: string
  city: string
  schedule: BjjEventScheduleDto
  contact: ContactDto
  coordinates: GeoCoordinatesDto
  cost?: number | null
}

export interface GetBjjEventsPaginationQuery {
  page?: number
  pageSize?: number
  city?: City | 'all'
  type?: BjjEventType | 'all'
  scheduleType?: ScheduleType | 'all'
  startDate?: string
  endDate?: string
}

export interface EventHoursFormData {
  dayOfWeek?: number | null
  date?: string | null
  openTime: string
  closeTime: string
}

export interface EventScheduleFormData {
  scheduleType: ScheduleType
  startDate?: string
  endDate?: string
  weeklyHours?: EventHoursFormData[]
  dailyHours?: EventHoursFormData[]
}

export interface EventFormData {
  title: string
  type: string
  city: City
  address?: string
  cost?: number
  schedule: EventScheduleFormData
  contactPerson?: string
  contactEmail?: string
  phone?: string
  website?: string
  socialMedia?: string
  eventUrl?: string
  latitude?: number
  longitude?: number
  placeName?: string
}

export type FilterEventType = BjjEventType | 'all'

export const BJJ_EVENT_TYPES_FOR_SELECT: { value: FilterEventType; label: string }[] = [
  { value: BjjEventType.OpenMat, label: 'Open Mat' },
  { value: BjjEventType.Seminar, label: 'Seminar' },
  { value: BjjEventType.Tournament, label: 'Tournament' },
  { value: BjjEventType.Camp, label: 'Camp' },
  { value: BjjEventType.Other, label: 'Other' },
  { value: 'all', label: 'All Types' },
]

export const mapEventFormDataToDto = (formData: EventFormData): BjjEventDto => {
  const schedule: BjjEventScheduleDto = {
    scheduleType: formData.schedule.scheduleType,
    startDate: formData.schedule.startDate || null,
    endDate: formData.schedule.endDate || null,
    hours: [],
  }

  if (formData.schedule.scheduleType === ScheduleType.Recurring && formData.schedule.weeklyHours) {
    schedule.hours = formData.schedule.weeklyHours.map((h) => ({
      dayOfWeek: h.dayOfWeek ?? null,
      date: null,
      openTime: h.openTime.length === 5 ? `${h.openTime}:00` : h.openTime,
      closeTime: h.closeTime.length === 5 ? `${h.closeTime}:00` : h.closeTime,
    }))
  } else if (
    formData.schedule.scheduleType === ScheduleType.FixedDate &&
    formData.schedule.dailyHours
  ) {
    schedule.hours = formData.schedule.dailyHours.map((h) => ({
      dayOfWeek: null,
      date: h.date ?? null,
      openTime: h.openTime.length === 5 ? `${h.openTime}:00` : h.openTime,
      closeTime: h.closeTime.length === 5 ? `${h.closeTime}:00` : h.closeTime,
    }))
  }

  const eventType = BJJ_EVENT_TYPES_FOR_SELECT.find(
    (t) => t.label.toLowerCase() === formData.type.toLowerCase() && t.value !== 'all'
  )?.value as BjjEventType | undefined

  return {
    name: formData.title,
    type: eventType ?? BjjEventType.Other,
    eventUrl: formData.eventUrl || null,
    isActive: true,
    statusReason: null,
    address: formData.address || '',
    city: formData.city,
    schedule,
    contact: {
      contactPerson: formData.contactPerson || '',
      phone: formData.phone || null,
      email: formData.contactEmail || null,
      website: formData.website || null,
      socialMedia: formData.socialMedia ? { instagram: formData.socialMedia } : null,
    },
    coordinates: {
      type: 'Point',
      latitude: formData.latitude ?? 0,
      longitude: formData.longitude ?? 0,
      placeName: formData.placeName || '',
      placeId: null,
    },
    cost: formData.cost ?? null,
  }
}
