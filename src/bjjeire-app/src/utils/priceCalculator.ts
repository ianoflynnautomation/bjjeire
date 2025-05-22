import {
  EventScheduleUnion,
  FixedDateSchedule,
  RecurringSchedule,
  BjjEventPricingModelDto,
  PricingType,
  ScheduleType,
} from '@/types/event'
import { isValid, parseISO, differenceInCalendarDays } from 'date-fns'

export interface CalculatedPrice {
  total: number
  unit: string
  currency: string
}

const DEFAULT_CURRENCY = 'EUR'

export const calculateEventPrice = (
  schedule?: EventScheduleUnion,
  pricing?: BjjEventPricingModelDto
): CalculatedPrice => {
  if (!pricing || pricing.type === PricingType.Free) {
    return {
      total: 0,
      unit: 'event',
      currency: pricing?.currency || DEFAULT_CURRENCY,
    }
  }

  const { type, amount, durationDays, currency = DEFAULT_CURRENCY } = pricing

  if (type === PricingType.FlatRate || !schedule) {
    return { total: amount || 0, unit: 'event', currency }
  }

  if (schedule.scheduleType === ScheduleType.Recurring) {
    const recurringSchedule = schedule as RecurringSchedule
    const sessionsOrActiveDaysPerWeek = recurringSchedule.hours?.length || 0

    if (type === PricingType.PerSession && sessionsOrActiveDaysPerWeek > 0) {
      return {
        total: (amount || 0) * sessionsOrActiveDaysPerWeek,
        unit: 'weekly',
        currency,
      }
    }
    if (type === PricingType.PerDay && sessionsOrActiveDaysPerWeek > 0) {
      return {
        total: (amount || 0) * sessionsOrActiveDaysPerWeek,
        unit: 'weekly',
        currency,
      }
    }
  }

  if (schedule.scheduleType === ScheduleType.FixedDate) {
    const fixedSchedule = schedule as FixedDateSchedule
    const {
      startDate: startDateStr,
      endDate: endDateStr,
      hours,
    } = fixedSchedule

    let calculatedEventDurationDays = 1

    if (startDateStr) {
      const startDt = parseISO(startDateStr)
      if (isValid(startDt)) {
        if (endDateStr) {
          const endDt = parseISO(endDateStr)
          if (isValid(endDt) && endDt >= startDt) {
            calculatedEventDurationDays =
              differenceInCalendarDays(endDt, startDt) + 1
          }
        }
      } else {
      }
    }

    if (type === PricingType.PerSession) {
      const totalSessions = hours?.length || 0
      return { total: (amount || 0) * totalSessions, unit: 'event', currency }
    }
    if (type === PricingType.PerDay) {
      const effectiveDays =
        durationDays != null && durationDays > 0
          ? durationDays
          : calculatedEventDurationDays
      return { total: (amount || 0) * effectiveDays, unit: 'event', currency }
    }
  }

  return { total: amount || 0, unit: 'event', currency }
}
