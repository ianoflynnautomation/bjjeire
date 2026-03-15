import { BjjEventType } from '@/types/event'
import { BJJ_EVENT_TYPES } from '@/constants/eventTypes'

function resolveEventType(
  eventType: BjjEventType | string
): BjjEventType | undefined {
  return BJJ_EVENT_TYPES.find(
    t =>
      t.value === eventType ||
      t.label.toLowerCase() === String(eventType).toLowerCase()
  )?.value
}

export function getEventTypeLabel(eventType: BjjEventType | string): string {
  const matchedType = resolveEventType(eventType)
  return BJJ_EVENT_TYPES.find(t => t.value === matchedType)?.label ?? 'Event'
}

export function getEventTypeBannerGradient(
  eventType: BjjEventType | string
): string {
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

export function getEventTypeColorClasses(
  eventType: BjjEventType | string
): string {
  const typeValue = resolveEventType(eventType)
  switch (typeValue) {
    case BjjEventType.OpenMat:
      return 'bg-emerald-900/50 text-emerald-300 ring-1 ring-emerald-700/50'
    case BjjEventType.Camp:
      return 'bg-violet-900/50 text-violet-300 ring-1 ring-violet-700/50'
    case BjjEventType.Tournament:
      return 'bg-rose-900/50 text-rose-300 ring-1 ring-rose-700/50'
    case BjjEventType.Seminar:
      return 'bg-amber-900/50 text-amber-300 ring-1 ring-amber-700/50'
    case BjjEventType.Other:
    default:
      return 'bg-slate-700/60 text-slate-300 ring-1 ring-slate-600/60'
  }
}
