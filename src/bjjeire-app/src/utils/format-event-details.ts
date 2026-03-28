import { PricingType } from '@/types/event'
import type { OrganizerDto } from '@/types/event'
import type { CalculatedPrice } from '@/utils/price-calculator'
import { uiContent } from '@/config/ui-content'

const { card: eventCard } = uiContent.events

export function formatPricingDisplay(
  calculatedPrice: CalculatedPrice,
  originalPricingType?: PricingType
): string {
  if (originalPricingType === PricingType.Free) {
    return eventCard.pricingFree
  }
  if (calculatedPrice.total === 0 && originalPricingType === undefined) {
    return eventCard.pricingUnavailable
  }
  const formattedTotal = calculatedPrice.total.toFixed(2)
  const currencyDisplay = calculatedPrice.currency ?? ''
  let unitText = ''
  switch (originalPricingType) {
    case PricingType.PerDay:
      unitText = eventCard.pricingPerDay
      break
    case PricingType.PerSession:
      unitText = eventCard.pricingPerSession
      break
    default:
      unitText = ''
  }
  return `${currencyDisplay ? currencyDisplay + ' ' : ''}${formattedTotal}${unitText ? ' ' + unitText : ''}`.trim()
}

export function formatOrganiserDisplay(
  organiser?: OrganizerDto
): string | undefined {
  if (!organiser || (!organiser.name && !organiser.website)) {
    return undefined
  }
  const { website, name } = organiser
  if (website) {
    try {
      const parsedUrl = new URL(website)
      return parsedUrl.hostname.replace(/^www\./, '')
    } catch {
      return name || website.replace(/^https?:\/\//, '').replace(/^www\./, '')
    }
  }
  return name
}
