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
] as const satisfies readonly FeatureConfig[]

export const AboutPage = lazyWithPreload(() => import('@/pages/AboutPage'))
