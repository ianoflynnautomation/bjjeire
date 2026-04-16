import { lazy } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'
import { paths } from '@/config/paths'

export interface FeatureConfig {
  flag: string
  path: string
  Component: LazyExoticComponent<ComponentType>
}

export const features = [
  {
    flag: 'BjjEvents',
    path: paths.events.path,
    Component: lazy(() => import('@/pages/EventsPage')),
  },
  {
    flag: 'Gyms',
    path: paths.gyms.path,
    Component: lazy(() => import('@/pages/GymsPage')),
  },
  {
    flag: 'Competitions',
    path: paths.competitions.path,
    Component: lazy(() => import('@/pages/CompetitionsPage')),
  },
  {
    flag: 'Stores',
    path: paths.stores.path,
    Component: lazy(() => import('@/pages/StoresPage')),
  },
] as const satisfies readonly FeatureConfig[]

export type FeatureFlagName = (typeof features)[number]['flag']
