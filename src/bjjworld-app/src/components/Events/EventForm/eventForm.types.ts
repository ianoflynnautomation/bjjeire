import {
  BjjEventHoursDto,
  FixedDateSchedule,
  RecurringSchedule,
  EventFormData,
  ScheduleType,
} from '../../../types/event'

export interface FormBjjEventHoursDto extends BjjEventHoursDto {
  _formKey: string
}

export interface FormFixedDateSchedule extends Omit<FixedDateSchedule, 'hours'> {
  scheduleType: ScheduleType.FixedDate
  hours: FormBjjEventHoursDto[]
}

export interface FormRecurringSchedule extends Omit<RecurringSchedule, 'hours'> {
  scheduleType: ScheduleType.Recurring
  hours: FormBjjEventHoursDto[]
}

export type FormEventScheduleUnion = FormFixedDateSchedule | FormRecurringSchedule

export interface FormDataTypeForState extends Omit<EventFormData, 'schedule'> {
  schedule: FormEventScheduleUnion
}
