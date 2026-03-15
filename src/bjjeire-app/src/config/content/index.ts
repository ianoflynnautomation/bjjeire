import { shared } from './shared'
import { events } from './events'
import { gyms } from './gyms'
import { brand, navigation, footer } from './layout'
import { about } from './about'
import { supportModal } from './support'

export const uiContent = {
  shared,
  events,
  gyms,
  brand,
  navigation,
  footer,
  about,
  supportModal,
} as const
