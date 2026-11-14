import { paths } from '@/config/paths'
import type { FeatureFlagName } from '@/features/feature-flags/definitions'
import {
  lazyWithPreload,
  type PreloadableComponent,
} from '@/lib/lazy-with-preload'

export interface FeatureConfig {
  flag: FeatureFlagName
  path: string
  Component: PreloadableComponent
}

export const features = [
  {
    flag: 'BjjEvents',
    path: paths.events.path,
    Component: lazyWithPreload(() => import('@/pages/EventsPage')),
  },
  {
    flag: 'Gyms',
    path: paths.gyms.path,
    Component: lazyWithPreload(() => import('@/pages/GymsPage')),
  },
  {
    flag: 'Competitions',
    path: paths.competitions.path,
    Component: lazyWithPreload(() => import('@/pages/CompetitionsPage')),
  },
  {
    flag: 'Stores',
    path: paths.stores.path,
    Component: lazyWithPreload(() => import('@/pages/StoresPage')),
  },
  {
    flag: 'Tournaments',
    path: paths.tournaments.path,
    Component: lazyWithPreload(() => import('@/pages/TournamentsPage')),
  },
] as const satisfies readonly FeatureConfig[]

/**
 * Pages reached from a feature's landing page. They sit behind the same flag
 * but are never a navigation entry or the default landing path.
 */
export const featureSubRoutes = [
  {
    flag: 'Tournaments',
    path: paths.tournament.path,
    Component: lazyWithPreload(() => import('@/pages/TournamentPage')),
  },
  {
    flag: 'Tournaments',
    path: paths.adminTournaments.path,
    Component: lazyWithPreload(() => import('@/pages/AdminTournamentsPage')),
  },
  {
    flag: 'Tournaments',
    path: paths.adminTournament.path,
    Component: lazyWithPreload(() => import('@/pages/AdminTournamentPage')),
  },
] as const satisfies readonly FeatureConfig[]

export const AboutPage = lazyWithPreload(() => import('@/pages/AboutPage'))
