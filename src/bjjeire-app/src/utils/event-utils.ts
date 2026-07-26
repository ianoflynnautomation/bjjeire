import { BjjEventType } from '@/types/event'
import { BJJ_EVENT_TYPES } from '@/constants/eventTypes'
import { uiContent } from '@/config/ui-content'

function resolveEventType(
  eventType: BjjEventType | string
): BjjEventType | undefined {
  const normalized = String(eventType).replace(/\s+/g, '').toLowerCase()
  return BJJ_EVENT_TYPES.find(
    t =>
      t.value === eventType ||
      t.label.replace(/\s+/g, '').toLowerCase() === normalized
  )?.value
}

export function getEventTypeLabel(eventType: BjjEventType | string): string {
  const matchedType = resolveEventType(eventType)
  return (
    BJJ_EVENT_TYPES.find(t => t.value === matchedType)?.label ??
    uiContent.events.card.typeFallbackLabel
  )
}

export function getEventTypeBannerGradient(
  eventType: BjjEventType | string
): string {
  const typeValue = resolveEventType(eventType)
  switch (typeValue) {
    case BjjEventType.OpenMat:
      return 'from-primary-950/80 via-primary-900/40 to-ink-900/20'
    case BjjEventType.Camp:
      return 'from-ink-800/90 via-accent-950/40 to-ink-900/20'
    case BjjEventType.Seminar:
      return 'from-accent-950/70 via-accent-900/30 to-ink-900/20'
    case BjjEventType.Other:
    default:
      return 'from-ink-700/70 via-ink-600/30 to-ink-900/20'
  }
}

export function getEventTypeColorClasses(
  eventType: BjjEventType | string
): string {
  const typeValue = resolveEventType(eventType)
  switch (typeValue) {
    case BjjEventType.OpenMat:
      return 'bg-primary-900/50 text-primary-300 ring-1 ring-primary-700/50'
    case BjjEventType.Camp:
      return 'bg-ink-700/80 text-accent-300 ring-1 ring-accent-700/50'
    case BjjEventType.Seminar:
      return 'bg-accent-950/60 text-accent-300 ring-1 ring-accent-700/50'
    case BjjEventType.Other:
    default:
      return 'bg-ink-700/60 text-ink-300 ring-1 ring-ink-500/60'
  }
}
