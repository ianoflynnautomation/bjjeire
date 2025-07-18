export const GYM_CARD_BASE_ID = 'gym-card'
export const GYM_OFFERED_CLASSES_BASE_ID = 'gym-offered-classes'
export const GYM_TRIAL_OFFER_BASE_ID = 'gym-trial-offer'
export const GYMS_LIST_BASE_ID = 'gyms-list'
export const GYMS_PAGE_HEADER_BASE_ID = 'gyms-page-header'

export const GymCardTestIds = {
  ROOT: 'gym-list-item',

  HEADER: {
    ROOT: 'gym-item-header',
    IMAGE: 'gym-item-header-image',
    NAME: 'gym-item-header-name',
    STATUS_BADGE: 'gym-item-header-status',
    COUNTY: 'gym-item-header-county',
  },
  DETAILS: {
    ROOT: 'gym-item-details',
    ADDRESS: 'gym-item-details-address',
    AFFILIATION: 'gym-item-details-affiliation',
    TIMETABLE: 'gym-item-details-timetable',
    CLASSES: 'gym-item-details-classes',
    TRIAL: 'gym-item-details-trial',
    SOCIAL_MEDIA: 'gym-item-details-social-media',
  },
  FOOTER: {
    ROOT: 'gym-item-footer',
    WEBSITE_LINK: 'gym-item-footer-website',
  },
};

export const GymOfferedClassesTestIds = {
  ROOT: 'gym-offered-classes',
  ITEM: 'gym-offered-classes-item', 
};

export const GymTrialOfferTestIds = {
  ROOT: 'gym-trial-offer',
};

export const GymsListTestIds = {
  ROOT: 'gyms-list',
  
  LOADING: 'gyms-list-loading',
  ERROR: 'gyms-list-error',
  EMPTY: 'gyms-list-empty',
  // The 'ITEM' locator is handled by GymCardTestIds.ROOT
};

export const GymsPageHeaderTestIds = {
  ROOT: 'gyms-page-header',
  TITLE: 'gyms-page-header-title',
  TOTAL: 'gyms-page-header-total',
};
