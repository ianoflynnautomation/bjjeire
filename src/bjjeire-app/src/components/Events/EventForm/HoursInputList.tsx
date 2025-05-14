import React from 'react'
import { ScheduleType, BjjEventHoursDto } from '../../../types/event'
import { FormEventScheduleUnion } from './eventForm.types'
import { HoursInputRow } from './HoursInputRow'
import { EventFormTestIds } from './eventForm.testIds'

interface HoursInputListProps {
  schedule: FormEventScheduleUnion
  isSubmitting: boolean
  onHourChange: (
    index: number,
    field: keyof BjjEventHoursDto,
    value: string | number | null
  ) => void
  onAddHour: () => void
  onRemoveHour: (index: number) => void
}

export const HoursInputList: React.FC<HoursInputListProps> = ({
  schedule,
  isSubmitting,
  onHourChange,
  onAddHour,
  onRemoveHour,
}) => {
  return (
    <div className="space-y-3" data-testid={EventFormTestIds.HOURS_LIST_CONTAINER}>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        {schedule.scheduleType === ScheduleType.FixedDate ? 'Daily Hours' : 'Weekly Hours'}
        {schedule.hours.length === 0 && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {' '}
            (At least one time slot is required for submission)
          </span>
        )}
      </label>
      {schedule.hours.map((hourEntry, index) => (
        <HoursInputRow
          key={hourEntry._formKey}
          index={index}
          hourEntry={hourEntry}
          scheduleType={schedule.scheduleType}
          startDate={schedule.startDate}
          endDate={schedule.endDate}
          isSubmitting={isSubmitting}
          onHourChange={onHourChange}
          onRemoveHour={onRemoveHour}
        />
      ))}
      {schedule.hours.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Please add at least one time slot.
        </p>
      )}
      {/* Add Time Slot Button */}
      <button
        type="button"
        onClick={onAddHour}
        className="mt-2 flex items-center gap-2 rounded-md border border-dashed border-emerald-400 dark:border-emerald-600 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isSubmitting}
        data-testid={EventFormTestIds.ADD_HOUR_BUTTON}
      >
        <svg // Plus Icon
          className="h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
        Add Time Slot
      </button>
    </div>
  )
}
