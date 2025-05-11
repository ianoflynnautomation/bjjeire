import { BjjEventScheduleDto, BjjEventPricingModelDto, PricingType, ScheduleType } from '../types/event';

interface CalculatedPrice {
  total: number;
  unit: string; // e.g., "weekly", "daily", "session"
  currency: string;
}

/**
 * Calculates the total price based on the event's schedule and pricing model.
 * @param schedule - The event schedule (Recurring or FixedDate)
 * @param pricing - The pricing model (Free, FlatRate, PerSession, PerDay)
 * @returns Calculated price with total, unit, and currency
 */
export const calculateEventPrice = (
  schedule: BjjEventScheduleDto,
  pricing: BjjEventPricingModelDto
): CalculatedPrice => {
  const { type, amount, durationDays, currency = 'EUR' } = pricing;
  const { scheduleType, startDate, endDate, hours } = schedule;

  if (type === PricingType.Free) {
    return { total: 0, unit: 'event', currency };
  }

  if (type === PricingType.FlatRate) {
    return { total: amount, unit: 'event', currency };
  }

  if (scheduleType === ScheduleType.Recurring) {
    // For recurring schedules, calculate weekly price based on hours per week
    const sessionsPerWeek = hours.length; // One session per dayOfWeek
    if (type === PricingType.PerSession) {
      return { total: amount * sessionsPerWeek, unit: 'weekly', currency };
    }
    if (type === PricingType.PerDay) {
      return { total: amount * sessionsPerWeek, unit: 'weekly', currency };
    }
  }

  if (scheduleType === ScheduleType.FixedDate && startDate && endDate) {
    // For fixed-date schedules, calculate based on date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (type === PricingType.PerSession) {
      const totalSessions = hours.length; // One session per date
      return { total: amount * totalSessions, unit: 'event', currency };
    }
    if (type === PricingType.PerDay) {
      const effectiveDays = durationDays ?? days; // Use durationDays if provided
      return { total: amount * effectiveDays, unit: 'event', currency };
    }
  }

  // Fallback for invalid schedules or pricing types
  return { total: amount, unit: 'event', currency };
};