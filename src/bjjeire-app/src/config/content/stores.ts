export const stores = {
  pageTitle: {
    all: 'BJJ Clothing Stores',
    foundPrefix: 'Found',
    foundSuffixSingular: 'store.',
    foundSuffixPlural: 'stores.',
  },
  hero: {
    tagline: 'BJJ Clothing Stores',
    subtitle:
      'Links to official websites for Brazilian Jiu-Jitsu stores active in Ireland and internationally.',
    imageAlt: 'BJJ Éire stores banner',
  },
  search: {
    label: 'Search stores',
    placeholder: 'Search by name',
    clearLabel: 'Clear search',
    resultsSrPrefix: 'Showing',
    resultsSrSuffix: 'stores',
    noResultsTitle: 'No Results Found',
    noResultsMessage: 'No stores matched your search. Try different keywords.',
  },
  list: {
    ariaLabel: 'Brazilian Jiu-Jitsu stores',
  },
  errors: {
    loadFailed: 'Failed to load stores. Please try again.',
  },
  noData: {
    title: 'No Stores Found',
    messageLine1: 'No stores are available right now.',
    messageLine2: 'Check back later.',
  },
  card: {
    fallbackName: 'Unnamed store',
    logoAlt: 'Logo for',
    visitWebsiteButton: 'Visit Website',
    noWebsiteButton: 'Website Unavailable',
  },
} as const
