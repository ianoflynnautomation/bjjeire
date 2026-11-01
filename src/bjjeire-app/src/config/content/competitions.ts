export const competitions = {
  documentTitle: 'BJJ Competitions | BJJ Éire',
  pageTitle: {
    all: 'BJJ Competitions',
    foundPrefix: 'Found',
    foundSuffixSingular: 'competition.',
    foundSuffixPlural: 'competitions.',
  },
  hero: {
    tagline: 'BJJ Competitions',
    subtitle:
      'Find Brazilian Jiu-Jitsu competitions in Ireland and internationally, with links to their official websites.',
    imageAlt: 'BJJ Éire competitions banner',
  },
  search: {
    label: 'Search competitions',
    placeholder: 'Search by name',
    clearLabel: 'Clear search',
    resultsSrPrefix: 'Showing',
    resultsSrSuffix: 'competitions',
    noResultsTitle: 'No Results Found',
    noResultsMessage:
      'No competitions matched your search. Try different keywords.',
    noResultsHint: 'Check the spelling or try fewer words.',
  },
  list: {
    ariaLabel: 'Brazilian Jiu-Jitsu competitions',
  },
  errors: {
    loadFailed: 'Failed to load competitions. Please try again.',
  },
  noData: {
    title: 'No Competitions Found',
    messageLine1: 'No competitions are available right now.',
    messageLine2: 'Check back later.',
  },
  card: {
    fallbackName: 'Unnamed Competition',
    logoAlt: 'Logo for',
    dateLabel: 'Date',
    visitWebsiteButton: 'Visit Website',
    noWebsiteButton: 'Website Unavailable',
    registerButton: 'Register / Events',
    noRegisterButton: 'Registration Unavailable',
    tagsLabel: 'Tags',
  },
} as const
