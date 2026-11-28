export const paths = {
  home: {
    path: '/',
    label: 'Home',
    getHref: () => '/',
  },
  events: {
    path: '/events',
    label: 'Events',
    getHref: () => '/events',
  },
  gyms: {
    path: '/gyms',
    label: 'Gyms',
    getHref: () => '/gyms',
  },
  competitions: {
    path: '/competitions',
    label: 'Competitions',
    getHref: () => '/competitions',
  },
  shop: {
    path: '/shop',
    label: 'Shop',
    getHref: () => '/shop',
  },
  product: {
    path: '/shop/products/:slug',
    label: 'Product',
    getHref: (slug: string) => `/shop/products/${encodeURIComponent(slug)}`,
  },
  basket: {
    path: '/shop/basket',
    label: 'Basket',
    getHref: () => '/shop/basket',
  },
  checkout: {
    path: '/shop/checkout',
    label: 'Checkout',
    getHref: () => '/shop/checkout',
  },
  order: {
    path: '/shop/orders/:id',
    label: 'Order',
    getHref: (id: string) => `/shop/orders/${encodeURIComponent(id)}`,
  },
  adminShop: {
    path: '/admin/shop',
    label: 'Manage shop',
    getHref: () => '/admin/shop',
  },
  adminShopProduct: {
    path: '/admin/shop/products/:id',
    label: 'Manage product',
    getHref: (id: string) => `/admin/shop/products/${encodeURIComponent(id)}`,
  },
  bjjEireCompetition: {
    path: '/competitions/:slug',
    label: 'Competition',
    getHref: (slug: string) => `/competitions/${encodeURIComponent(slug)}`,
  },
  bjjEireCompetitionSignUp: {
    path: '/competitions/:slug/signup',
    label: 'Sign up',
    getHref: (slug: string, registrationId?: string) =>
      `/competitions/${encodeURIComponent(slug)}/signup${registrationId ? `?registration=${encodeURIComponent(registrationId)}` : ''}`,
  },
  bjjEireCompetitionSignUpComplete: {
    path: '/competitions/:slug/signup/complete',
    label: 'Sign-up payment',
    getHref: (slug: string, registrationId: string) =>
      `/competitions/${encodeURIComponent(slug)}/signup/complete?registration=${encodeURIComponent(registrationId)}`,
  },
  adminBjjEireCompetitions: {
    path: '/admin/competitions',
    label: 'Manage competitions',
    getHref: () => '/admin/competitions',
  },
  adminBjjEireCompetition: {
    path: '/admin/competitions/:id',
    label: 'Manage competition',
    getHref: (id: string) => `/admin/competitions/${encodeURIComponent(id)}`,
  },
  accountProfile: {
    path: '/account/profile',
    label: 'My profile',
    getHref: () => '/account/profile',
  },
  accountSignUps: {
    path: '/account/signups',
    label: 'My sign-ups',
    getHref: () => '/account/signups',
  },
  about: {
    path: '/about',
    label: 'About',
    getHref: () => '/about',
  },
} as const

/**
 * Old addresses that still lead somewhere. Stores became Shop (#4007), so a
 * bookmark or search result for /stores, or anything under it, lands on /shop.
 * The redirect goes through Shop's own feature gate.
 */
export const legacyRedirects = [
  { from: '/stores/*', to: paths.shop.path },
] as const
