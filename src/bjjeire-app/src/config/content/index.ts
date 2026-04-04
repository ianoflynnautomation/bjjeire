import { shared } from './shared'
import { events } from './events'
import { gyms } from './gyms'
import { competitions } from './competitions'
import { brand, navigation, footer } from './layout'
import { about } from './about'
import { supportModal } from './support'

export const uiContent = {
  shared,
  events,
  gyms,
  competitions,
  brand,
  navigation,
  footer,
  about,
  supportModal,
} as const
