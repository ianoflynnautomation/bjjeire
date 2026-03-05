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

const getEventDurationDays = (
  startDate?: string | null,
  endDate?: string | null
): number => {
  if (!startDate) {return 1}

  const startDt = parseISO(startDate)
  if (!isValid(startDt) || !endDate) {return 1}

  const endDt = parseISO(endDate)
  if (!isValid(endDt) || endDt < startDt) {return 1}

  return differenceInCalendarDays(endDt, startDt) + 1
}

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
  const amountValue = amount || 0

  if (type === PricingType.FlatRate || !schedule) {
    return { total: amountValue, unit: 'event', currency }
  }

  const { startDate: startDateStr, endDate: endDateStr, hours } = schedule
  const sessionsCount = hours?.length || 0

  if (!startDateStr && sessionsCount > 0 && (type === PricingType.PerSession || type === PricingType.PerDay)) {
    return { total: amountValue * sessionsCount, unit: 'weekly', currency }
  }

  if (type === PricingType.PerSession) {
    return { total: amountValue * sessionsCount, unit: 'event', currency }
  }

  if (type === PricingType.PerDay) {
    const effectiveDays =
      durationDays !== null && durationDays !== undefined && durationDays > 0
        ? durationDays
        : getEventDurationDays(startDateStr, endDateStr)
    return { total: amountValue * effectiveDays, unit: 'event', currency }
  }

  return { total: amountValue, unit: 'event', currency }
}
