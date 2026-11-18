import { shared } from './shared'
import { events } from './events'
import { gyms } from './gyms'
import { competitions } from './competitions'
import { shop } from './shop'
import { merch } from './merch'
import { brand, navigation, footer } from './layout'
import { about } from './about'
import { supportModal } from './support'
import {
  bjjEireCompetitions,
  bjjEireCompetitionAdmin,
} from './bjjeire-competitions'
import { competitor } from './competitor'
import { registrations } from './registrations'

export const uiContent = {
  shared,
  events,
  gyms,
  competitions,
  shop,
  merch,
  brand,
  navigation,
  footer,
  about,
  supportModal,
  bjjEireCompetitions,
  bjjEireCompetitionAdmin,
  competitor,
  registrations,
} as const
