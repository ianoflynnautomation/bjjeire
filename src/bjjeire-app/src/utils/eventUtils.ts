import { BjjEventType } from '@/types/event'
import { BJJ_EVENT_TYPES } from '@/constants/eventTypes'

export const getEventTypeLabel = (eventType: BjjEventType | string): string => {
  const foundType = BJJ_EVENT_TYPES.find(
    t =>
      t.value === eventType ||
      t.label.toLowerCase() === String(eventType).toLowerCase()
  )
  return foundType?.label || 'Event'
}

export const getEventTypeColorClasses = (
  eventType: BjjEventType | string
): string => {
  const typeConfig = BJJ_EVENT_TYPES.find(
    t =>
      t.value === eventType ||
      t.label.toLowerCase() === String(eventType).toLowerCase()
  )
  const typeValue = typeConfig?.value

  switch (typeValue) {
    case BjjEventType.OpenMat:
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    case BjjEventType.Camp:
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
    case BjjEventType.Tournament:
      return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    case BjjEventType.Seminar:
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
    case BjjEventType.Other:
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
  }
}
