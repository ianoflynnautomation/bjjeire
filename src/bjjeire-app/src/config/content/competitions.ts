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
      'Links to official websites for Brazilian Jiu-Jitsu competition organisations active in Ireland and internationally.',
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
  card: {
    fallbackName: 'Unnamed Competition',
    dateLabel: 'Date',
    visitWebsiteButton: 'Visit Website',
    noWebsiteButton: 'Website Unavailable',
    registerButton: 'Register / Events',
    noRegisterButton: 'Registration Unavailable',
    tagsLabel: 'Tags',
  },
} as const
