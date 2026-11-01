import type {
  BjjEventScheduleDto,
  BjjEventPricingModelDto,
  BjjEventSessionDto,
} from '@/types/event'
import { PricingType, ScheduleKind } from '@/types/event'
import type { BjjEventType } from '@/types/event'

export type PriceUnit = 'event' | 'weekly' | 'perDay' | 'perSession' | 'free'

export interface CalculatedPrice {
  label?: string | null
  total: number
  unit: PriceUnit
  currency: string
}

const DEFAULT_CURRENCY = 'EUR'

type PricingTypeName = keyof typeof PricingType

function resolvePricingTypeName(
  type: PricingType | string | null | undefined
): PricingTypeName | undefined {
  if (type === undefined || type === null || !(type in PricingType)) {
    return undefined
  }
  return type as PricingTypeName
}

function normaliseType(type: BjjEventType | string): string {
  return type.replace(/\s+/g, '').toLowerCase()
}

function sessionMatchesScope(
  session: BjjEventSessionDto,
  scope: BjjEventType[]
): boolean {
  // Untagged sessions belong to every event type
  if (!session.types || session.types.length === 0) {
    return true
  }
  const scopeNames = scope.map(normaliseType)
  return session.types.some(t => scopeNames.includes(normaliseType(t)))
}

function countSessionsInScope(
  schedule: BjjEventScheduleDto | undefined,
  appliesToTypes: BjjEventType[] | null | undefined
): number {
  const sessions = schedule?.sessions ?? []
  if (sessions.length === 0) {
    return 1
  }
  if (!appliesToTypes || appliesToTypes.length === 0) {
    return sessions.length
  }
  const matching = sessions.filter(s => sessionMatchesScope(s, appliesToTypes))
  return Math.max(matching.length, 1)
}

function isWeeklyRecurring(schedule?: BjjEventScheduleDto): boolean {
  if (!schedule) {
    return false
  }
  return (
    schedule.kind === ScheduleKind.WeeklyRecurring ||
    (!schedule.startDate && schedule.sessions.length > 0)
  )
}

function calculatePricingOption(
  schedule: BjjEventScheduleDto | undefined,
  pricing: BjjEventPricingModelDto
): CalculatedPrice {
  const { label, amount, appliesToTypes } = pricing
  const currency = pricing.currency ?? DEFAULT_CURRENCY
  const amountValue = amount ?? 0
  const typeName = resolvePricingTypeName(pricing.type)

  if (typeName === 'Free') {
    return { label, total: 0, unit: 'free', currency }
  }

  if (typeName === 'PerSession') {
    const count = countSessionsInScope(schedule, appliesToTypes)
    return {
      label,
      total: amountValue * count,
      unit: isWeeklyRecurring(schedule) ? 'weekly' : 'perSession',
      currency,
    }
  }

  if (typeName === 'PerDay') {
    // A recurring schedule has no fixed duration — the meaningful total is
    // one week's worth of sessions
    if (isWeeklyRecurring(schedule)) {
      const count = countSessionsInScope(schedule, appliesToTypes)
      return { label, total: amountValue * count, unit: 'weekly', currency }
    }
    return { label, total: amountValue, unit: 'perDay', currency }
  }

  return { label, total: amountValue, unit: 'event', currency }
}

export function calculateEventPrices(
  schedule?: BjjEventScheduleDto,
  pricingOptions?: BjjEventPricingModelDto[]
): CalculatedPrice[] {
  if (!pricingOptions || pricingOptions.length === 0) {
    return []
  }
  return pricingOptions.map(option => calculatePricingOption(schedule, option))
}
