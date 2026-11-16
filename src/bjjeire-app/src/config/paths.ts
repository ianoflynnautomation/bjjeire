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
  stores: {
    path: '/stores',
    label: 'Stores',
    getHref: () => '/stores',
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
