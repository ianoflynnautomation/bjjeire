import { describe, it, expect } from 'vitest'
import { calculateEventPrices } from '../price-calculator'
import { BjjEventType, PricingType, ScheduleKind } from '@/types/event'
import type {
  BjjEventScheduleDto,
  BjjEventPricingModelDto,
  BjjEventSessionDto,
} from '@/types/event'

const EUR = 'EUR'

const flatRate = (amount: number): BjjEventPricingModelDto => ({
  type: PricingType.FlatRate,
  amount,
  currency: EUR,
})

const perSession = (
  amount: number,
  appliesToTypes?: BjjEventType[]
): BjjEventPricingModelDto => ({
  type: PricingType.PerSession,
  amount,
  currency: EUR,
  appliesToTypes,
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

const fixedSession = (
  date: string,
  types?: BjjEventType[]
): BjjEventSessionDto => ({
  date,
  startTime: '09:00',
  endTime: '11:00',
  types,
})

const fixedSchedule = (
  sessions: BjjEventSessionDto[],
  startDate?: string,
  endDate?: string
): BjjEventScheduleDto => ({
  kind: ScheduleKind.FixedDates,
  startDate: startDate ?? null,
  endDate: endDate ?? null,
  sessions,
})

const weeklySchedule = (sessionCount: number): BjjEventScheduleDto => ({
  kind: ScheduleKind.WeeklyRecurring,
  startDate: null,
  endDate: null,
  sessions: Array.from({ length: sessionCount }, (_, i) => ({
    day: `Day${i}`,
    startTime: '09:00',
    endTime: '11:00',
  })),
})

describe('calculateEventPrices', () => {
  describe('no pricing options', () => {
    it('given undefined pricing options, when prices are calculated, then an empty list is returned', () => {
      expect(calculateEventPrices()).toEqual([])
    })

    it('given empty pricing options, when prices are calculated, then an empty list is returned', () => {
      expect(calculateEventPrices(undefined, [])).toEqual([])
    })
  })

  describe('Free pricing', () => {
    it('given a free option, when prices are calculated, then a zero price with the free unit is returned', () => {
      expect(
        calculateEventPrices(undefined, [
          { type: PricingType.Free, amount: 0, currency: EUR },
        ])
      ).toEqual([{ label: undefined, total: 0, unit: 'free', currency: EUR }])
    })

    it('given a currency on the option, when prices are calculated, then that currency is used', () => {
      expect(
        calculateEventPrices(undefined, [
          { type: PricingType.Free, amount: 0, currency: 'USD' },
        ])
      ).toEqual([{ label: undefined, total: 0, unit: 'free', currency: 'USD' }])
    })
  })

  describe('FlatRate pricing', () => {
    it('given a flat-rate option, when prices are calculated, then the flat amount is returned regardless of schedule', () => {
      expect(calculateEventPrices(weeklySchedule(3), [flatRate(100)])).toEqual([
        { label: undefined, total: 100, unit: 'event', currency: EUR },
      ])
    })

    it('given a flat-rate option with no schedule, when prices are calculated, then the flat amount is returned', () => {
      expect(calculateEventPrices(undefined, [flatRate(50)])).toEqual([
        { label: undefined, total: 50, unit: 'event', currency: EUR },
      ])
    })

    it('given the API string form of the pricing type, when prices are calculated, then it is treated like the enum', () => {
      expect(
        calculateEventPrices(undefined, [
          {
            type: 'FlatRate' as unknown as PricingType,
            amount: 75,
            currency: EUR,
          },
        ])
      ).toEqual([{ label: undefined, total: 75, unit: 'event', currency: EUR }])
    })
  })

  describe('PerSession pricing', () => {
    it('given a per-session option on a recurring schedule, when prices are calculated, then the weekly total per session count is returned', () => {
      expect(calculateEventPrices(weeklySchedule(3), [perSession(20)])).toEqual(
        [{ label: undefined, total: 60, unit: 'weekly', currency: EUR }]
      )
    })

    it('given a per-session option on fixed dates, when prices are calculated, then the amount is multiplied by session count', () => {
      const schedule = fixedSchedule(
        [fixedSession('2026-06-01'), fixedSession('2026-06-02')],
        '2026-06-01',
        '2026-06-02'
      )
      expect(calculateEventPrices(schedule, [perSession(30)])).toEqual([
        { label: undefined, total: 60, unit: 'perSession', currency: EUR },
      ])
    })

    it('given a per-session option scoped by type, when prices are calculated, then only matching sessions are counted', () => {
      const schedule = fixedSchedule(
        [
          fixedSession('2026-06-01', [BjjEventType.Camp]),
          fixedSession('2026-06-02', [BjjEventType.Camp]),
          fixedSession('2026-06-03', [BjjEventType.OpenMat]),
        ],
        '2026-06-01',
        '2026-06-03'
      )
      expect(
        calculateEventPrices(schedule, [perSession(20, [BjjEventType.OpenMat])])
      ).toEqual([
        { label: undefined, total: 20, unit: 'perSession', currency: EUR },
      ])
    })

    it('given untagged sessions, when prices are calculated, then they count toward any scope', () => {
      const schedule = fixedSchedule(
        [
          fixedSession('2026-06-01'),
          fixedSession('2026-06-02', [BjjEventType.Camp]),
        ],
        '2026-06-01',
        '2026-06-02'
      )
      expect(
        calculateEventPrices(schedule, [perSession(20, [BjjEventType.OpenMat])])
      ).toEqual([
        { label: undefined, total: 20, unit: 'perSession', currency: EUR },
      ])
    })
  })

  describe('PerDay pricing', () => {
    it('given an explicit durationDays, when prices are calculated, then that duration is used', () => {
      const schedule = fixedSchedule(
        [fixedSession('2026-06-01')],
        '2026-06-01',
        '2026-06-05'
      )
      expect(calculateEventPrices(schedule, [perDay(50, 3)])).toEqual([
        { label: undefined, total: 150, unit: 'perDay', currency: EUR },
      ])
    })

    it('given no durationDays, when prices are calculated, then the days are derived from the start and end dates', () => {
      // 2026-06-01 to 2026-06-03 = 3 days
      const schedule = fixedSchedule([], '2026-06-01', '2026-06-03')
      expect(calculateEventPrices(schedule, [perDay(40)])).toEqual([
        { label: undefined, total: 120, unit: 'perDay', currency: EUR },
      ])
    })

    it('given invalid dates, when prices are calculated, then a single day is assumed', () => {
      const schedule = fixedSchedule([], 'bad-date', 'bad-date')
      expect(calculateEventPrices(schedule, [perDay(40)])).toEqual([
        { label: undefined, total: 40, unit: 'perDay', currency: EUR },
      ])
    })

    it('given a per-day option on a recurring schedule, when prices are calculated, then the weekly unit is returned', () => {
      expect(calculateEventPrices(weeklySchedule(2), [perDay(25)])).toEqual([
        { label: undefined, total: 50, unit: 'weekly', currency: EUR },
      ])
    })
  })

  describe('multiple pricing options', () => {
    it('given multiple pricing options, when prices are calculated, then one price per option is returned with labels preserved', () => {
      const schedule = fixedSchedule(
        [
          fixedSession('2026-07-25', [BjjEventType.Camp]),
          fixedSession('2026-07-27', [BjjEventType.OpenMat]),
        ],
        '2026-07-25',
        '2026-07-27'
      )
      const options: BjjEventPricingModelDto[] = [
        { ...flatRate(275), label: 'Full camp' },
        { ...perDay(110, 1), label: 'Day pass' },
      ]

      expect(calculateEventPrices(schedule, options)).toEqual([
        { label: 'Full camp', total: 275, unit: 'event', currency: EUR },
        { label: 'Day pass', total: 110, unit: 'perDay', currency: EUR },
      ])
    })
  })
})
