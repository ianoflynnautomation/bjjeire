import React from 'react'
import { ScheduleType, BjjEventHoursDto } from '../../../types/event'
import { FormBjjEventHoursDto } from './eventForm.types'
import { DAYS_OF_WEEK } from '../../../constants/common'
import { EventFormTestIds } from './eventForm.testIds'

interface HoursInputRowProps {
  index: number
  hourEntry: FormBjjEventHoursDto
  scheduleType: ScheduleType
  startDate?: string
  endDate?: string
  isSubmitting: boolean
  onHourChange: (
    index: number,
    field: keyof BjjEventHoursDto,
    value: string | number | null
  ) => void
  onRemoveHour: (index: number) => void
}

export const HoursInputRow: React.FC<HoursInputRowProps> = ({
  index,
  hourEntry,
  scheduleType,
  startDate,
  endDate,
  isSubmitting,
  onHourChange,
  onRemoveHour,
}) => {
  const key = hourEntry._formKey

  return (
    <div
      className="grid grid-cols-1 gap-3 rounded-md border border-slate-200 dark:border-slate-700 p-3 sm:grid-cols-[1fr_auto_auto_auto]"
      data-testid={EventFormTestIds.getHourRowId(key)}
    >
      {/* Date Input for FixedDate */}
      {scheduleType === ScheduleType.FixedDate && (
        <div>
          <label htmlFor={`hourDate-${key}`} className="sr-only">
            Date
          </label>
          <input
            type="date"
            id={`hourDate-${key}`}
            data-testid={EventFormTestIds.getHourDateInputId(key)}
            value={hourEntry.date || ''}
            onChange={(e) => onHourChange(index, 'date', e.target.value)}
            className="w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
            disabled={isSubmitting}
            required
            min={startDate || undefined}
            max={endDate || startDate || undefined}
          />
        </div>
      )}
      {/* DayOfWeek Select for Recurring */}
      {scheduleType === ScheduleType.Recurring && (
        <div>
          <label htmlFor={`dayOfWeek-${key}`} className="sr-only">
            Day of Week
          </label>
          <select
            id={`dayOfWeek-${key}`}
            data-testid={EventFormTestIds.getHourDaySelectId(key)}
            value={hourEntry.dayOfWeek ?? ''}
            onChange={(e) =>
              onHourChange(
                index,
                'dayOfWeek',
                e.target.value === '' ? null : Number(e.target.value)
              )
            }
            className="w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
            disabled={isSubmitting}
            required
          >
            <option value="" disabled>
              Select Day
            </option>
            {DAYS_OF_WEEK.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>
      )}
      {/* Open Time */}
      <div>
        <label htmlFor={`openTime-${key}`} className="sr-only">
          Open Time
        </label>
        <input
          type="time"
          id={`openTime-${key}`}
          data-testid={EventFormTestIds.getHourOpenTimeInputId(key)}
          value={hourEntry.openTime}
          onChange={(e) => onHourChange(index, 'openTime', e.target.value)}
          className="w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          disabled={isSubmitting}
          required
        />
      </div>
      {/* Close Time */}
      <div>
        <label htmlFor={`closeTime-${key}`} className="sr-only">
          Close Time
        </label>
        <input
          type="time"
          id={`closeTime-${key}`}
          data-testid={EventFormTestIds.getHourCloseTimeInputId(key)}
          value={hourEntry.closeTime}
          onChange={(e) => onHourChange(index, 'closeTime', e.target.value)}
          className="w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          disabled={isSubmitting}
          required
          min={hourEntry.openTime || undefined}
        />
      </div>
      {/* Remove Button */}
      <button
        type="button"
        onClick={() => onRemoveHour(index)}
        className="flex items-center justify-center rounded-md bg-orange-50 dark:bg-orange-900/30 p-2 text-orange-500 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Remove time slot"
        data-testid={EventFormTestIds.getHourRemoveButtonId(key)}
        disabled={isSubmitting}
      >
        <svg // Trash Icon
          className="h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  )
}
