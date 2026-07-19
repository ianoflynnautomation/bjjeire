export const competitions = {
  pageTitle: {
    all: 'BJJ Competition Organisations',
    foundPrefix: 'Found',
    foundSuffixSingular: 'organisation.',
    foundSuffixPlural: 'organisations.',
  },
  filters: {
    organisationLabel: 'Organisation',
    allOrganisationsOption: 'All Organisations',
  },
  hero: {
    tagline: 'BJJ Competition Organisations',
    subtitle:
      'Links to official websites for Brazilian Jiu-Jitsu active competition organisations in Ireland and internationally.',
    imageAlt: 'BJJ Éire competitions banner',
  },
  search: {
    label: 'Search competitions',
    placeholder: 'Search by name, organisation, country…',
    clearLabel: 'Clear search',
    resultsSrPrefix: 'Showing',
    resultsSrSuffix: 'competitions',
    noResultsTitle: 'No Results Found',
    noResultsMessage:
      'No competitions matched your search. Try different keywords.',
  },
  list: {
    ariaLabel: 'Brazilian Jiu-Jitsu competition organisations',
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
