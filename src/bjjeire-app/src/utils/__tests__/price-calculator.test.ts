import { describe, it, expect } from 'vitest'
import { calculateEventPrice } from '../price-calculator'
import { PricingType } from '@/types/event'
import type {
  BjjEventScheduleDto,
  BjjEventPricingModelDto,
} from '@/types/event'

const EUR = 'EUR'

const flatRate = (amount: number): BjjEventPricingModelDto => ({
  type: PricingType.FlatRate,
  amount,
  currency: EUR,
})

const perSession = (amount: number): BjjEventPricingModelDto => ({
  type: PricingType.PerSession,
  amount,
  currency: EUR,
})

const perDay = (
  amount: number,
  durationDays?: number
): BjjEventPricingModelDto => ({
  type: PricingType.PerDay,
  amount,
  currency: EUR,
  durationDays,
})

const schedule = (
  hours: number,
  startDate?: string,
  endDate?: string
): BjjEventScheduleDto => ({
  hours: Array.from({ length: hours }, (_, i) => ({
    day: `Day${i}`,
    openTime: '09:00',
    closeTime: '11:00',
  })),
  startDate: startDate ?? null,
  endDate: endDate ?? null,
})

describe('calculateEventPrice', () => {
  describe('no pricing', () => {
    it('returns zero event price with default EUR currency', () => {
      expect(calculateEventPrice()).toEqual({
        total: 0,
        unit: 'event',
        currency: EUR,
      })
    })
  })

  describe('Free pricing', () => {
    it('returns zero price', () => {
      expect(
        calculateEventPrice(undefined, {
          type: PricingType.Free,
          amount: 0,
          currency: EUR,
        })
      ).toEqual({ total: 0, unit: 'event', currency: EUR })
    })

    it('uses currency from the pricing model', () => {
      expect(
        calculateEventPrice(undefined, {
          type: PricingType.Free,
          amount: 0,
          currency: 'USD',
        })
      ).toEqual({ total: 0, unit: 'event', currency: 'USD' })
    })
  })

  describe('FlatRate pricing', () => {
    it('returns the flat amount regardless of schedule', () => {
      expect(calculateEventPrice(schedule(3), flatRate(100))).toEqual({
        total: 100,
        unit: 'event',
        currency: EUR,
      })
    })

    it('works without a schedule', () => {
      expect(calculateEventPrice(undefined, flatRate(50))).toEqual({
        total: 50,
        unit: 'event',
        currency: EUR,
      })
    })
  })

  describe('PerSession pricing', () => {
    it('returns weekly unit and multiplies by session count when no startDate', () => {
      expect(calculateEventPrice(schedule(3), perSession(20))).toEqual({
        total: 60,
        unit: 'weekly',
        currency: EUR,
      })
    })

    it('returns event unit and multiplies by session count when startDate is provided', () => {
      expect(
        calculateEventPrice(
          schedule(2, '2024-06-01', '2024-06-02'),
          perSession(30)
        )
      ).toEqual({ total: 60, unit: 'event', currency: EUR })
    })
  })

  describe('PerDay pricing', () => {
    it('uses explicit durationDays when provided', () => {
      expect(
        calculateEventPrice(
          schedule(1, '2024-06-01', '2024-06-05'),
          perDay(50, 3)
        )
      ).toEqual({
        total: 150,
        unit: 'event',
        currency: EUR,
      })
    })

    it('derives days from startDate/endDate when durationDays is absent', () => {
      // 2024-06-01 to 2024-06-03 = 3 days
      expect(
        calculateEventPrice(schedule(1, '2024-06-01', '2024-06-03'), perDay(40))
      ).toEqual({ total: 120, unit: 'event', currency: EUR })
    })

    it('defaults to 1 day when dates are invalid', () => {
      expect(
        calculateEventPrice(schedule(1, 'bad-date', 'bad-date'), perDay(40))
      ).toEqual({ total: 40, unit: 'event', currency: EUR })
    })

    it('returns weekly unit when no startDate but sessions exist', () => {
      expect(calculateEventPrice(schedule(2), perDay(25))).toEqual({
        total: 50,
        unit: 'weekly',
        currency: EUR,
      })
    })
  })
})
