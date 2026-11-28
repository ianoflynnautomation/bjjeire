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
    // The directory keeps its Stores flag; only the visible name and address became Shop.
    flag: 'Stores',
    path: paths.shop.path,
    Component: lazyWithPreload(() => import('@/pages/ShopPage')),
  },
] as const satisfies readonly FeatureConfig[]

/**
 * Pages reached from a feature's landing page. They are never a navigation
 * entry or the default landing path. BJJ Éire competition pages sit under
 * /competitions but follow BjjEireCompetitions, not Competitions (#3015).
 * Merch pages sit under /shop and /admin/shop and follow Merch (#6026).
 */
export const featureSubRoutes = [
  {
    flag: 'Merch',
    path: paths.product.path,
    Component: lazyWithPreload(() => import('@/pages/ProductPage')),
  },
  {
    flag: 'Merch',
    path: paths.basket.path,
    Component: lazyWithPreload(() => import('@/pages/BasketPage')),
  },
  {
    flag: 'Merch',
    path: paths.checkout.path,
    Component: lazyWithPreload(() => import('@/pages/CheckoutPage')),
  },
  {
    flag: 'Merch',
    path: paths.order.path,
    Component: lazyWithPreload(() => import('@/pages/OrderPage')),
  },
  {
    flag: 'Merch',
    path: paths.adminShop.path,
    Component: lazyWithPreload(() => import('@/pages/AdminShopPage')),
  },
  {
    flag: 'Merch',
    path: paths.adminShopProduct.path,
    Component: lazyWithPreload(() => import('@/pages/AdminShopProductPage')),
  },
  {
    flag: 'BjjEireCompetitions',
    path: paths.bjjEireCompetition.path,
    Component: lazyWithPreload(() => import('@/pages/BjjEireCompetitionPage')),
  },
  {
    flag: 'BjjEireCompetitions',
    path: paths.bjjEireCompetitionSignUp.path,
    Component: lazyWithPreload(() => import('@/pages/SignUpPage')),
  },
  {
    flag: 'BjjEireCompetitions',
    path: paths.bjjEireCompetitionSignUpComplete.path,
    Component: lazyWithPreload(() => import('@/pages/SignUpCompletePage')),
  },
  {
    flag: 'BjjEireCompetitions',
    path: paths.adminBjjEireCompetitions.path,
    Component: lazyWithPreload(
      () => import('@/pages/AdminBjjEireCompetitionsPage')
    ),
  },
  {
    flag: 'BjjEireCompetitions',
    path: paths.adminBjjEireCompetition.path,
    Component: lazyWithPreload(
      () => import('@/pages/AdminBjjEireCompetitionPage')
    ),
  },
  {
    flag: 'BjjEireCompetitions',
    path: paths.accountProfile.path,
    Component: lazyWithPreload(() => import('@/pages/ProfilePage')),
  },
  {
    flag: 'BjjEireCompetitions',
    path: paths.accountSignUps.path,
    Component: lazyWithPreload(() => import('@/pages/MySignUpsPage')),
  },
] as const satisfies readonly FeatureConfig[]

export const AboutPage = lazyWithPreload(() => import('@/pages/AboutPage'))
