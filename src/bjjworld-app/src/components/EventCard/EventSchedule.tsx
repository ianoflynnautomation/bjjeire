import React from 'react'
import { BjjEventDto, ScheduleType, BjjEventHoursDto } from '../../types/event'
import { formatTime, formatDate } from '../../utils/dateUtils'
import {
  CalendarDaysIcon,
  ClockIcon,
  ClipboardDocumentListIcon,
  InformationCircleIcon,
} from '@heroicons/react/20/solid'

interface EventScheduleProps {
  schedule: BjjEventDto['schedule']
}

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const ScheduleItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="text-slate-600">{children}</li>
)

const ScheduleSection: React.FC<{
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}> = ({ title, icon, children }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-x-2">
      <span className="h-5 w-5 text-slate-400" aria-hidden="true">
        {icon}
      </span>
      <h4 className="font-semibold text-slate-600">{title}</h4>
    </div>
    {children}
  </div>
)

const EmptyScheduleMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center gap-x-2 text-sm text-slate-600">
    <InformationCircleIcon className="h-5 w-5 flex-shrink-0 text-slate-400" aria-hidden="true" />
    <span>{message}</span>
  </div>
)

export const EventSchedule: React.FC<EventScheduleProps> = ({ schedule }) => {
  if (!schedule) {
    return <EmptyScheduleMessage message="No schedule information provided." />
  }

  const renderHoursList = (hours: BjjEventHoursDto[], scheduleType: ScheduleType) => (
    <ul className="mt-1 list-none space-y-0.5 pl-5">
      {hours.slice(0, 3).map((hour, index) => (
        <ScheduleItem key={index}>
          {scheduleType === ScheduleType.Recurring &&
          hour.dayOfWeek !== null &&
          hour.dayOfWeek !== undefined
            ? `${daysOfWeek[hour.dayOfWeek] || 'N/A Day'}: `
            : scheduleType === ScheduleType.FixedDate && hour.date
              ? `${formatDate(hour.date)}: `
              : scheduleType === ScheduleType.FixedDate
                ? 'Daily: '
                : ''}
          {formatTime(hour.openTime)} - {formatTime(hour.closeTime)}
        </ScheduleItem>
      ))}
      {hours.length > 3 && <li className="pl-0 text-xs text-slate-600 italic">...and more</li>}
    </ul>
  )

  if (schedule.scheduleType === ScheduleType.Recurring) {
    if (!schedule.hours?.length) {
      return (
        <ScheduleSection title="Weekly Schedule" icon={<ClipboardDocumentListIcon />}>
          <EmptyScheduleMessage message="Recurring schedule hours not specified." />
        </ScheduleSection>
      )
    }

    return (
      <ScheduleSection title="Weekly Schedule" icon={<ClipboardDocumentListIcon />}>
        {renderHoursList(schedule.hours, ScheduleType.Recurring)}
        {schedule.endDate && (
          <p className="mt-1.5 text-xs text-slate-600">Ends: {formatDate(schedule.endDate)}</p>
        )}
      </ScheduleSection>
    )
  }

  if (schedule.scheduleType === ScheduleType.FixedDate) {
    return (
      <ScheduleSection title="Event Dates" icon={<CalendarDaysIcon />}>
        <p className="text-slate-600">
          {schedule.startDate ? formatDate(schedule.startDate) : 'Date TBD'}
          {schedule.endDate && schedule.endDate !== schedule.startDate
            ? ` - ${formatDate(schedule.endDate)}`
            : ''}
        </p>
        {schedule.hours?.length ? (
          renderHoursList(schedule.hours, ScheduleType.FixedDate)
        ) : (
          <div className="mt-1.5 flex items-center gap-x-2 text-xs text-slate-600">
            <ClockIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
            <span>Timings not specified. Check event page for details.</span>
          </div>
        )}
      </ScheduleSection>
    )
  }

  return (
    <EmptyScheduleMessage
      message={`Invalid or unsupported schedule type: ${schedule.scheduleType}.`}
    />
  )
}
