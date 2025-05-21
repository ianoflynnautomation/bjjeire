export const GYM_CARD_BASE_ID = 'gym-card'
export const GYM_OFFERED_CLASSES_BASE_ID = 'gym-offered-classes'
export const GYM_TRIAL_OFFER_BASE_ID = 'gym-trial-offer'
export const GYMS_LIST_BASE_ID = 'gyms-list'
export const GYMS_PAGE_HEADER_BASE_ID = 'gyms-page-header'

export const GymCardTestIds = {
  ROOT: (id: string = '') => `${GYM_CARD_BASE_ID}${id ? `-${id}` : ''}`,

  HEADER: {
    ROOT: (id: string = '') =>
      `${GYM_CARD_BASE_ID}-header${id ? `-${id}` : ''}`,
    IMAGE: (id: string = '') =>
      `${GYM_CARD_BASE_ID}-header-image${id ? `-${id}` : ''}`,
    NAME: (id: string = '') =>
      `${GYM_CARD_BASE_ID}-header-name${id ? `-${id}` : ''}`,
    STATUS_BADGE: (id: string = '') =>
      `${GYM_CARD_BASE_ID}-header-status${id ? `-${id}` : ''}`,
    COUNTY: (id: string = '') =>
      `${GYM_CARD_BASE_ID}-header-county${id ? `-${id}` : ''}`,
  },

  DETAILS: {
    ROOT: (id: string = '') =>
      `${GYM_CARD_BASE_ID}-details${id ? `-${id}` : ''}`,
    ADDRESS: (id: string = '') =>
      `${GYM_CARD_BASE_ID}-details-address${id ? `-${id}` : ''}`,
    AFFILIATION: (id: string = '') =>
      `${GYM_CARD_BASE_ID}-details-affiliation${id ? `-${id}` : ''}`,
    TIMETABLE: (id: string = '') =>
      `${GYM_CARD_BASE_ID}-details-timetable${id ? `-${id}` : ''}`,
    CLASSES: (id: string = '') =>
      `${GYM_CARD_BASE_ID}-details-classes${id ? `-${id}` : ''}`,
    TRIAL: (id: string = '') =>
      `${GYM_CARD_BASE_ID}-details-trial${id ? `-${id}` : ''}`,
    SOCIAL_MEDIA: (id: string = '') =>
      `${GYM_CARD_BASE_ID}-details-social-media${id ? `-${id}` : ''}`,
  },

  FOOTER: {
    ROOT: (id: string = '') =>
      `${GYM_CARD_BASE_ID}-footer${id ? `-${id}` : ''}`,
    WEBSITE_LINK: (id: string = '') =>
      `${GYM_CARD_BASE_ID}-footer-website${id ? `-${id}` : ''}`,
  },
}

export const GymOfferedClassesTestIds = {
  ROOT: (id: string = '') =>
    `${GYM_OFFERED_CLASSES_BASE_ID}${id ? `-${id}` : ''}`,
  ITEM: (category: string, id: string = '') =>
    `${GYM_OFFERED_CLASSES_BASE_ID}-item-${category}${id ? `-${id}` : ''}`,
}

export const GymTrialOfferTestIds = {
  ROOT: (id: string = '') => `${GYM_TRIAL_OFFER_BASE_ID}${id ? `-${id}` : ''}`,
}

export const GymsListTestIds = {
  ROOT: (id: string = '') => `${GYMS_LIST_BASE_ID}${id ? `-${id}` : ''}`,
  LOADING: (id: string = '') =>
    `${GYMS_LIST_BASE_ID}-loading${id ? `-${id}` : ''}`,
  ERROR: (id: string = '') => `${GYMS_LIST_BASE_ID}-error${id ? `-${id}` : ''}`,
  EMPTY: (id: string = '') => `${GYMS_LIST_BASE_ID}-empty${id ? `-${id}` : ''}`,
  ITEM: (id: string) => `${GYMS_LIST_BASE_ID}-item-${id}`,
  SKELETON: (index: number, id: string = '') =>
    `${GYMS_LIST_BASE_ID}-skeleton-${index}${id ? `-${id}` : ''}`,
}

export const GymsPageHeaderTestIds = {
  ROOT: (id: string = '') => `${GYMS_PAGE_HEADER_BASE_ID}${id ? `-${id}` : ''}`,
  TITLE: (id: string = '') =>
    `${GYMS_PAGE_HEADER_BASE_ID}-title${id ? `-${id}` : ''}`,
  TOTAL: (id: string = '') =>
    `${GYMS_PAGE_HEADER_BASE_ID}-total${id ? `-${id}` : ''}`,
}
