import React from 'react'
import { ScheduleType, BjjEventHoursDto } from '../../../types/event'
import { FormEventScheduleUnion } from './eventForm.types'
import { HoursInputList } from './HoursInputList'
import { EventFormTestIds } from './eventForm.testIds'

interface ScheduleSectionProps {
  schedule: FormEventScheduleUnion
  isSubmitting: boolean
  onScheduleTypeChange: (newType: ScheduleType) => void
  onScheduleDetailsChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  onHourChange: (
    index: number,
    field: keyof BjjEventHoursDto,
    value: string | number | null
  ) => void
  onAddHour: () => void
  onRemoveHour: (index: number) => void
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  schedule,
  isSubmitting,
  onScheduleTypeChange,
  onScheduleDetailsChange,
  onHourChange,
  onAddHour,
  onRemoveHour,
}) => {
  return (
    <div
      className="space-y-4 rounded-md border border-slate-200 dark:border-slate-700 p-4"
      data-testid={EventFormTestIds.SCHEDULE_SECTION_CONTAINER}
    >
      <h3 className="text-lg font-medium text-slate-900 dark:text-white">Schedule Details</h3>

      {/* Schedule Type Select */}
      <div>
        <label
          htmlFor="scheduleTypeSelect"
          className="block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          Schedule Type
        </label>
        <select
          id="scheduleTypeSelect"
          name="scheduleType"
          value={schedule.scheduleType}
          onChange={(e) => onScheduleTypeChange(e.target.value as ScheduleType)}
          className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          disabled={isSubmitting}
          required
          data-testid={EventFormTestIds.SCHEDULE_TYPE_SELECT}
        >
          <option value={ScheduleType.FixedDate}>Fixed Date (e.g., Seminar, Competition)</option>
          <option value={ScheduleType.Recurring}>Recurring (e.g., Regular Class)</option>
        </select>
      </div>

      {/* Start Date */}
      <div>
        <label
          htmlFor="schedule.startDate"
          className="block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          {schedule.scheduleType === ScheduleType.FixedDate
            ? 'Event Start Date'
            : 'Effective Start Date (Optional)'}
        </label>
        <input
          id="schedule.startDate"
          type="date"
          name="startDate" // Matches the key in schedule state
          value={schedule.startDate || ''}
          onChange={onScheduleDetailsChange}
          className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          disabled={isSubmitting}
          required={schedule.scheduleType === ScheduleType.FixedDate}
          data-testid={EventFormTestIds.START_DATE_INPUT}
        />
      </div>

      {/* End Date */}
      <div>
        <label
          htmlFor="schedule.endDate"
          className="block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          {schedule.scheduleType === ScheduleType.FixedDate
            ? 'Event End Date (Optional)'
            : 'Effective End Date (Optional)'}
        </label>
        <input
          id="schedule.endDate"
          type="date"
          name="endDate"
          value={schedule.endDate || ''}
          onChange={onScheduleDetailsChange}
          className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          disabled={isSubmitting}
          min={schedule.startDate || undefined}
          data-testid={EventFormTestIds.END_DATE_INPUT}
        />
      </div>

      {/* Hours Configuration */}
      <HoursInputList
        schedule={schedule}
        isSubmitting={isSubmitting}
        onHourChange={onHourChange}
        onAddHour={onAddHour}
        onRemoveHour={onRemoveHour}
      />
    </div>
  )
}
