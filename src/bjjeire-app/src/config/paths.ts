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
  about: {
    path: '/about',
    label: 'About',
    getHref: () => '/about',
  },
} as const
