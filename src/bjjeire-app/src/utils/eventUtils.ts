import { BjjEventType } from '@/types/event'
import { BJJ_EVENT_TYPES } from '@/constants/eventTypes'

const resolveEventType = (eventType: BjjEventType | string): BjjEventType | undefined =>
  BJJ_EVENT_TYPES.find(
    t =>
      t.value === eventType ||
      t.label.toLowerCase() === String(eventType).toLowerCase()
  )?.value

export const getEventTypeLabel = (eventType: BjjEventType | string): string => {
  const matchedType = resolveEventType(eventType)
  return BJJ_EVENT_TYPES.find(t => t.value === matchedType)?.label || 'Event'
}

export const getEventTypeBannerGradient = (
  eventType: BjjEventType | string
): string => {
  const typeValue = resolveEventType(eventType)
  switch (typeValue) {
    case BjjEventType.OpenMat:
      return 'from-emerald-900/70 via-emerald-800/30 to-slate-900/20'
    case BjjEventType.Camp:
      return 'from-violet-900/70 via-violet-800/30 to-slate-900/20'
    case BjjEventType.Tournament:
      return 'from-rose-900/70 via-rose-800/30 to-slate-900/20'
    case BjjEventType.Seminar:
      return 'from-amber-900/70 via-amber-800/30 to-slate-900/20'
    case BjjEventType.Other:
    default:
      return 'from-slate-700/60 via-slate-600/30 to-slate-900/20'
  }
}

export const getEventTypeColorClasses = (
  eventType: BjjEventType | string
): string => {
  const typeValue = resolveEventType(eventType)

  switch (typeValue) {
    case BjjEventType.OpenMat:
      return 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/60 dark:bg-emerald-900/50 dark:text-emerald-300 dark:ring-emerald-700/50'
    case BjjEventType.Camp:
      return 'bg-violet-100 text-violet-800 ring-1 ring-violet-300/60 dark:bg-violet-900/50 dark:text-violet-300 dark:ring-violet-700/50'
    case BjjEventType.Tournament:
      return 'bg-rose-100 text-rose-800 ring-1 ring-rose-300/60 dark:bg-rose-900/50 dark:text-rose-300 dark:ring-rose-700/50'
    case BjjEventType.Seminar:
      return 'bg-amber-100 text-amber-800 ring-1 ring-amber-300/60 dark:bg-amber-900/50 dark:text-amber-300 dark:ring-amber-700/50'
    case BjjEventType.Other:
    default:
      return 'bg-slate-100 text-slate-600 ring-1 ring-slate-300/60 dark:bg-slate-700/60 dark:text-slate-300 dark:ring-slate-600/60'
  }
}
