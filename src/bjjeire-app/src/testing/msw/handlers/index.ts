import { sharedHandlers } from './shared'
import { featureFlagsHandlers } from './feature-flags'
import { gymsHandlers } from './gyms'
import { bjjEventsHandlers } from './bjj-events'
import { competitionsHandlers } from './competitions'
import { tournamentsHandlers } from './tournaments'
import { competitorHandlers } from './competitor'

export { optionsPassthrough, sharedHandlers } from './shared'
export { defaultFeatureFlags, featureFlagsHandlers } from './feature-flags'
export { gymsHandlers } from './gyms'
export { bjjEventsHandlers } from './bjj-events'
export { competitionsHandlers } from './competitions'
export { tournamentsHandlers } from './tournaments'
export { competitorHandlers } from './competitor'

export const handlers = [
  ...sharedHandlers,
  ...featureFlagsHandlers,
  ...gymsHandlers,
  ...bjjEventsHandlers,
  ...competitionsHandlers,
  ...tournamentsHandlers,
  ...competitorHandlers,
]
