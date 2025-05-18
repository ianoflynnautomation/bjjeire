import { County } from '@/constants/counties'
import { HateoasPagination, BaseApiEntityModel, LocationDto, SocialMediaDto } from './common'

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
export enum EventStatus {
  Upcoming = 1,
  RegistrationOpen = 2,
  RegistrationClosed = 3,
  Ongoing = 4,
  Completed = 5,
  Canceled = 6,
  Postponed = 7,
}

export interface OrganizerDto {
  name: string
  website: string
}

export interface BjjEventPricingModelDto {
  type: PricingType
  amount: number
  durationDays?: number | null
  currency: string
}

export interface BjjEventHoursDto {
  dayOfWeek?: number | null
  date?: string | null
  openTime: string
  closeTime: string
}

export interface BaseSchedule {
  scheduleType: ScheduleType
}

export interface FixedDateSchedule extends BaseSchedule {
  scheduleType: ScheduleType.FixedDate
  startDate: string
  endDate?: string
  hours: BjjEventHoursDto[]
}

export interface RecurringSchedule extends BaseSchedule {
  scheduleType: ScheduleType.Recurring
  hours: BjjEventHoursDto[]
  startDate?: string
  endDate?: string
}

export type EventScheduleUnion = FixedDateSchedule | RecurringSchedule

export interface BjjEventDto extends BaseApiEntityModel {
  name: string
  description?: string | null
  type: BjjEventType
  organiser: OrganizerDto
  status: EventStatus
  statusReason?: string | null
  socialMedia: SocialMediaDto
  county: County
  location: LocationDto
  schedule: EventScheduleUnion
  pricing: BjjEventPricingModelDto
  eventUrl: string
  imageUrl: string
}

export interface GetBjjEventsPaginationQuery {
  county?: County | 'all'
  type?: BjjEventType
  page: number
  pageSize: number
}

export interface BackendBjjEventsResponse {
  data: BjjEventDto[]
  pagination: HateoasPagination
}
