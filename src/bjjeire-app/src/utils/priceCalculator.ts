import {
  EventScheduleUnion, // Updated import
  FixedDateSchedule,  // For type casting/guarding if needed
  RecurringSchedule,  // For type casting/guarding if needed
  BjjEventPricingModelDto,
  PricingType,
  ScheduleType,
} from '@/types/event';

interface CalculatedPrice {
  total: number;
  unit: string; // e.g., "weekly", "daily", "session", "event"
  currency: string;
}

/**
 * Calculates the total price based on the event's schedule and pricing model.
 * @param schedule - The event schedule (RecurringSchedule or FixedDateSchedule)
 * @param pricing - The pricing model (Free, FlatRate, PerSession, PerDay)
 * @returns Calculated price with total, unit, and currency
 */
export const calculateEventPrice = (
  schedule: EventScheduleUnion, // Updated parameter type
  pricing: BjjEventPricingModelDto
): CalculatedPrice => {
  const { type, amount, durationDays, currency = 'EUR' } = pricing;

  if (type === PricingType.Free) {
    return { total: 0, unit: 'event', currency };
  }

  if (type === PricingType.FlatRate) {
    return { total: amount, unit: 'event', currency };
  }

  // Handle Recurring Schedules
  if (schedule.scheduleType === ScheduleType.Recurring) {
    // TypeScript knows 'schedule' is RecurringSchedule here
    const recurringSchedule = schedule as RecurringSchedule;
    const sessionsPerWeek = recurringSchedule.hours.length; // Assumes one entry per session/day

    if (type === PricingType.PerSession) {
      // Price per session * sessions per week
      return { total: amount * sessionsPerWeek, unit: 'weekly', currency };
    }
    if (type === PricingType.PerDay) {
      // Price per active day * number of active days in a week
      // Assuming sessionsPerWeek also represents distinct active days in a week
      return { total: amount * sessionsPerWeek, unit: 'weekly', currency };
    }
  }

  // Handle Fixed Date Schedules
  if (schedule.scheduleType === ScheduleType.FixedDate) {
    // TypeScript knows 'schedule' is FixedDateSchedule here
    const fixedSchedule = schedule as FixedDateSchedule;
    const { startDate, endDate, hours } = fixedSchedule; // startDate is string, endDate is string | undefined

    let calculatedDays = 1; // Default for a single-day event or if endDate is missing/invalid

    if (startDate) { // startDate is mandatory for FixedDateSchedule
      const startDt = new Date(startDate);
      if (endDate) {
        const endDt = new Date(endDate);
        // Ensure both dates are valid before calculation
        if (!isNaN(startDt.getTime()) && !isNaN(endDt.getTime()) && endDt >= startDt) {
          calculatedDays = Math.ceil((endDt.getTime() - startDt.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        } else if (!isNaN(startDt.getTime())) {
          // endDate is invalid or before startDate, treat as single day based on startDate
          calculatedDays = 1;
        } else {
          // Both dates might be invalid, or startDate is invalid. Fallback or error.
          // For now, let's assume if startDate is invalid, this path has issues.
          // Given FixedDateSchedule type, startDate should be a valid string.
        }
      } else if (!isNaN(startDt.getTime())) {
        // Only startDate is provided (or endDate was invalid), so it's a 1-day event
        calculatedDays = 1;
      }
    }


    if (type === PricingType.PerSession) {
      const totalSessions = hours.length; // Assumes each entry in 'hours' is a billable session
      return { total: amount * totalSessions, unit: 'event', currency };
    }
    if (type === PricingType.PerDay) {
      // Use pricing.durationDays if provided, otherwise use the calculated event duration
      const effectiveDays = durationDays != null && durationDays > 0 ? durationDays : calculatedDays;
      return { total: amount * effectiveDays, unit: 'event', currency };
    }
  }

  // Fallback: If pricing type is PerSession or PerDay but schedule type isn't specifically handled above,
  // or if other conditions aren't met, treat as a flat rate for the event.
  // This primarily covers scenarios where PerSession/PerDay is set but the schedule
  // doesn't lend itself to that calculation (e.g. missing dates for FixedDate, or unexpected combo).
  return { total: amount, unit: 'event', currency };
};