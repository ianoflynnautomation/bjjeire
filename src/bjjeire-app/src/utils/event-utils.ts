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
      return 'bg-primary-100 text-primary-800 ring-1 ring-primary-700/20 dark:bg-primary-900/50 dark:text-primary-300 dark:ring-primary-400/20'
    case BjjEventType.Camp:
      return 'bg-accent-100 text-accent-800 ring-1 ring-accent-600/20 dark:bg-ink-800 dark:text-accent-300 dark:ring-accent-500/25'
    case BjjEventType.Seminar:
      return 'bg-accent-50 text-accent-800 ring-1 ring-accent-500/20 dark:bg-accent-950/60 dark:text-accent-300 dark:ring-accent-500/25'
    case BjjEventType.Other:
    default:
      return 'bg-muted text-fg-muted ring-1 ring-hairline dark:bg-ink-800 dark:text-ink-300'
  }
}
