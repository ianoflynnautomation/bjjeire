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
  tournaments: {
    path: '/tournaments',
    label: 'Tournaments',
    getHref: () => '/tournaments',
  },
  tournament: {
    path: '/tournaments/:slug',
    label: 'Tournament',
    getHref: (slug: string) => `/tournaments/${encodeURIComponent(slug)}`,
  },
  tournamentSignUp: {
    path: '/tournaments/:slug/signup',
    label: 'Sign up',
    getHref: (slug: string, registrationId?: string) =>
      `/tournaments/${encodeURIComponent(slug)}/signup${registrationId ? `?registration=${encodeURIComponent(registrationId)}` : ''}`,
  },
  tournamentSignUpComplete: {
    path: '/tournaments/:slug/signup/complete',
    label: 'Sign-up payment',
    getHref: (slug: string, registrationId: string) =>
      `/tournaments/${encodeURIComponent(slug)}/signup/complete?registration=${encodeURIComponent(registrationId)}`,
  },
  adminTournaments: {
    path: '/admin/tournaments',
    label: 'Manage tournaments',
    getHref: () => '/admin/tournaments',
  },
  adminTournament: {
    path: '/admin/tournaments/:id',
    label: 'Manage tournament',
    getHref: (id: string) => `/admin/tournaments/${encodeURIComponent(id)}`,
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
