export const uiContent = {
  shared: {
    countySuffix: 'County',
  },
  events: {
    pageTitle: {
      all: 'All BJJ Events',
      prefix: 'BJJ Events in',
    },
    card: {
      fallbackName: 'Unnamed Event',
      fallbackRef: 'this event',
      viewOnMap: 'View on map',
      organisedByLabel: 'Organised by',
      moreInfoButton: 'More Information',
      noInfoButton: 'Information Unavailable',
      pricingFree: 'Free',
      pricingUnavailable: 'Pricing details unavailable',
      pricingPerDay: 'per day',
      pricingPerSession: 'per session',
    },
    schedule: {
      fixedDatesTitle: 'Event Dates & Times',
      weeklyTitle: 'Weekly Schedule',
      noScheduleMessage: 'No schedule information provided for this event.',
      noTimingsMessage: 'Timings not specified. Check event page for details.',
      noHoursMessage: 'Schedule hours not yet specified.',
      endsPrefix: 'Ends',
    },
    filters: {
      countyLabel: 'Select County',
      eventTypeLabel: 'Event Type',
      allCountiesOption: 'All Counties',
      allTypesOption: 'All Types',
    },
    hero: {
      tagline: 'Find BJJ Events Across Ireland',
      subtitle:
        'Discover tournaments, seminars, open mats, and camps near you.',
      imageAlt: 'BJJ Éire logo',
    },
  },
  gyms: {
    pageTitle: {
      all: 'All BJJ Gyms',
      prefix: 'BJJ Gyms in',
    },
    filters: {
      countyLabel: 'Select County',
      allCountiesOption: 'All Counties',
    },
    hero: {
      tagline: 'Find BJJ Gyms Across Ireland',
      subtitle: 'Browse clubs, academies, and training centres near you.',
      imageAlt: 'BJJ Éire gym banner',
    },
    card: {
      fallbackName: 'Unnamed Gym',
      fallbackRef: 'this gym',
      affiliatedWithLabel: 'Affiliated with',
      viewTimetableLink: 'View Timetable',
      offeredClassesLabel: 'Offered Classes',
      visitWebsiteButton: 'Visit Website',
      noWebsiteButton: 'Website Unavailable',
      trialOfferFallback: 'Trial offer available (details not specified)',
    },
  },
  brand: {
    name: 'BJJ Eire',
    displayName: 'BJJ Éire',
  },
  navigation: {
    supportButtonLabel: 'Support',
    openMobileMenuLabel: 'Open main menu',
    githubLinkLabel: 'Contribute on GitHub',
  },
  footer: {
    quickLinksTitle: 'Quick Links',
    copyrightSuffix: 'All rights reserved.',
    githubTitle: 'Contribute',
    githubLinkLabel: 'View on GitHub',
    githubStarsLabel: 'stars',
  },
  about: {
    title: 'About BJJ Eire',
    subtitle:
      'A community-first directory for Brazilian Jiu-Jitsu gyms and events across Ireland.',
    missionTitle: 'What We Do',
    missionParagraph1:
      'BJJ Eire helps practitioners discover gyms, seminars, tournaments, camps, and open mats in a single place. The project aims to make finding accurate local training information fast and simple.',
    missionParagraph2:
      'We focus on clear listings, practical filtering, and links that take people directly to gym and event sources for up-to-date details.',
    principlesTitle: 'Project Principles',
    principles: [
      'Keep data easy to browse and compare.',
      'Prioritize accessibility across devices and input methods.',
      'Make contribution and correction workflows straightforward.',
    ],
    contactTitle: 'Contact',
    contactPrefix: 'For updates, corrections, or partnership requests, email',
  },
  supportModal: {
    title: 'Support BJJ Eire',
    closeLabel: 'Close support modal',
    description:
      'Support the BJJ Eire project by donating Bitcoin. Your contribution helps us maintain and improve the platform.',
    addressLabel: 'Bitcoin Address:',
    copyButtonText: 'Copy Address',
    copiedButtonText: 'Copied!',
    copiedConfirmation: 'Address copied to clipboard!',
    warning:
      'Please double-check the address before sending any funds. We cannot recover funds sent to incorrect addresses.',
  },
} as const
