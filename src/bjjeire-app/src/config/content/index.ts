import { shared } from './shared'
import { events } from './events'
import { gyms } from './gyms'
import { competitions } from './competitions'
import { stores } from './stores'
import { brand, navigation, footer } from './layout'
import { about } from './about'
import { supportModal } from './support'
import { tournaments, tournamentAdmin } from './tournaments'

export const uiContent = {
  shared,
  events,
  gyms,
  competitions,
  stores,
  brand,
  navigation,
  footer,
  about,
  supportModal,
  tournaments,
  tournamentAdmin,
} as const
