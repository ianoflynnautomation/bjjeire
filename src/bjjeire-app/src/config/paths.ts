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
  about: {
    path: '/about',
    label: 'About',
    getHref: () => '/about',
  },
} as const
