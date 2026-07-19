import type { OrganizerDto } from '@/types/event'
import type { CalculatedPrice } from '@/utils/price-calculator'
import { uiContent } from '@/config/ui-content'

const { card: eventCard } = uiContent.events

function getUnitText(unit: CalculatedPrice['unit']): string {
  switch (unit) {
    case 'weekly':
      return eventCard.pricingPerWeek
    case 'perDay':
      return eventCard.pricingPerDay
    case 'perSession':
      return eventCard.pricingPerSession
    default:
      return ''
  }
}

export function formatPricingDisplay(
  calculatedPrice: CalculatedPrice | undefined
): string {
  if (!calculatedPrice) {
    return eventCard.pricingUnavailable
  }
  const labelPrefix = calculatedPrice.label ? `${calculatedPrice.label}: ` : ''
  if (calculatedPrice.unit === 'free') {
    return `${labelPrefix}${eventCard.pricingFree}`
  }
  const formattedTotal = calculatedPrice.total.toFixed(2)
  const currencyDisplay = calculatedPrice.currency
  const unitText = getUnitText(calculatedPrice.unit)
  return `${labelPrefix}${currencyDisplay ? currencyDisplay + ' ' : ''}${formattedTotal}${unitText ? ' ' + unitText : ''}`.trim()
}

function parseWebsiteHostname(website: string): string | undefined {
  for (const candidate of [website, `https://${website}`]) {
    try {
      const { hostname } = new URL(candidate)
      // Require a dot so bare strings like 'not-a-url' don't parse as hosts
      if (hostname.includes('.')) {
        return hostname.replace(/^www\./, '')
      }
    } catch {
      // try the next candidate
    }
  }
  return undefined
}

export function formatOrganiserDisplay(
  organiser?: OrganizerDto
): string | undefined {
  if (!organiser || (!organiser.name && !organiser.website)) {
    return undefined
  }
  const { website, name } = organiser
  if (website) {
    return (
      parseWebsiteHostname(website) ??
      (name || website.replace(/^https?:\/\//, '').replace(/^www\./, ''))
    )
  }
  return name
}
