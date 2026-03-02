import type {
  BjjEventScheduleDto,
  BjjEventPricingModelDto} from '@/types/event';
import {
  PricingType,
} from '@/types/event'
import { isValid, parseISO, differenceInCalendarDays } from 'date-fns'

export interface CalculatedPrice {
  total: number
  unit: string
  currency: string
}

const DEFAULT_CURRENCY = 'EUR'

export const calculateEventPrice = (
  schedule?: BjjEventScheduleDto,
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

  const { startDate: startDateStr, endDate: endDateStr, hours } = schedule
  const sessionsCount = hours?.length || 0

  if (!startDateStr) {
    // No fixed dates — treat as recurring (weekly)
    if (type === PricingType.PerSession && sessionsCount > 0) {
      return { total: (amount || 0) * sessionsCount, unit: 'weekly', currency }
    }
    if (type === PricingType.PerDay && sessionsCount > 0) {
      return { total: (amount || 0) * sessionsCount, unit: 'weekly', currency }
    }
  } else {
    // Fixed date event — calculate duration from startDate/endDate
    let calculatedEventDurationDays = 1
    const startDt = parseISO(startDateStr)
    if (isValid(startDt) && endDateStr) {
      const endDt = parseISO(endDateStr)
      if (isValid(endDt) && endDt >= startDt) {
        calculatedEventDurationDays = differenceInCalendarDays(endDt, startDt) + 1
      }
    }

    if (type === PricingType.PerSession) {
      return { total: (amount || 0) * sessionsCount, unit: 'event', currency }
    }
    if (type === PricingType.PerDay) {
      const effectiveDays =
        durationDays !== null && durationDays !== undefined && durationDays > 0
          ? durationDays
          : calculatedEventDurationDays
      return { total: (amount || 0) * effectiveDays, unit: 'event', currency }
    }
  }

  return { total: amount || 0, unit: 'event', currency }
}
