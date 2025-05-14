export const paths = {
  home: {
    path: "/",
    getHref: () => "/",
  },

  app: {
    root: {
      path: "/app",
      getHref: () => "/app",
    },
    events: {
      path: 'events',
      getHref: () => '/app/events',
    },
    gyms: {
      path: 'gyms',
      getHref: () => '/app/gyms',
    },
    contact: {
      path: 'contact',
      getHref: () => '/app/contact',
    }
  },
} as const;
