import type { County } from '@/constants/counties'
import type { BaseApiEntityModel, LocationDto, SocialMediaDto } from './common'

export enum BjjEventType {
  OpenMat = 0,
  Seminar = 1,
  Camp = 3,
  Other = 4,
}

export enum PricingType {
  Free = 0,
  FlatRate = 1,
  PerSession = 2,
  PerDay = 3,
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

export enum ScheduleKind {
  FixedDates = 'FixedDates',
  WeeklyRecurring = 'WeeklyRecurring',
}

export interface OrganizerDto {
  name: string
  website: string
}

export interface BjjEventPricingModelDto {
  type: PricingType
  label?: string | null
  appliesToTypes?: BjjEventType[] | null
  amount?: number | null
  durationDays?: number | null
  currency?: string | null
}

export interface BjjEventSessionDto {
  date?: string | null
  day?: string | null
  startTime: string
  endTime: string
  title?: string | null
  types?: BjjEventType[] | null
}

export interface BjjEventScheduleDto {
  kind: ScheduleKind
  startDate?: string | null
  endDate?: string | null
  sessions: BjjEventSessionDto[]
}

export interface BjjEventDto extends BaseApiEntityModel {
  name: string
  description?: string | null
  types: BjjEventType[]
  organiser?: OrganizerDto
  status: EventStatus
  statusReason?: string | null
  socialMedia?: SocialMediaDto
  county: County
  location?: LocationDto
  schedule?: BjjEventScheduleDto
  pricingOptions?: BjjEventPricingModelDto[]
  eventUrl: string
  imageUrl: string
}

export interface GetBjjEventsPaginationQuery {
  county?: County | 'all'
  types?: BjjEventType[]
  page: number
  pageSize: number
}
