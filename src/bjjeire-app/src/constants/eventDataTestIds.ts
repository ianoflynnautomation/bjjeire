export const EVENT_CARD_BASE_ID = 'event-card'
export const EVENT_FILTERS_BASE_ID = 'event-filters'
export const EVENTS_LIST_BASE_ID = 'events-list'
export const EVENTS_PAGE_HEADER_BASE_ID = 'events-page-header'

export const EventCardTestIds = {
  ROOT: (id: string = '') => `${EVENT_CARD_BASE_ID}${id ? `-${id}` : ''}`,
  HEADER: {
    ROOT: (id: string = '') =>
      `${EVENT_CARD_BASE_ID}-header${id ? `-${id}` : ''}`,
    NAME: (id: string = '') =>
      `${EVENT_CARD_BASE_ID}-header-name${id ? `-${id}` : ''}`,
    TYPE: (id: string = '') =>
      `${EVENT_CARD_BASE_ID}-header-type${id ? `-${id}` : ''}`,
  },
  DETAILS: {
    ROOT: (id: string = '') =>
      `${EVENT_CARD_BASE_ID}-details${id ? `-${id}` : ''}`,
    CONTENT: (id: string = '') =>
      `${EVENT_CARD_BASE_ID}-details-content${id ? `-${id}` : ''}`,
    ADDRESS: (id: string = '') =>
      `${EVENT_CARD_BASE_ID}-details-address${id ? `-${id}` : ''}`,
    ORGANISER: (id: string = '') =>
      `${EVENT_CARD_BASE_ID}-details-organiser${id ? `-${id}` : ''}`,
    PRICING: (id: string = '') =>
      `${EVENT_CARD_BASE_ID}-details-pricing${id ? `-${id}` : ''}`,
    SOCIAL_MEDIA: (id: string = '') =>
      `${EVENT_CARD_BASE_ID}-details-social-media${id ? `-${id}` : ''}`,
  },
  SCHEDULE: {
    ROOT: (id: string = '') =>
      `${EVENT_CARD_BASE_ID}-schedule${id ? `-${id}` : ''}`,
    CONTENT: (id: string = '') =>
      `${EVENT_CARD_BASE_ID}-schedule-content${id ? `-${id}` : ''}`,
  },
  FOOTER: {
    ROOT: (id: string = '') =>
      `${EVENT_CARD_BASE_ID}-footer${id ? `-${id}` : ''}`,
    LINK: (id: string = '') =>
      `${EVENT_CARD_BASE_ID}-footer-link${id ? `-${id}` : ''}`,
  },
}

export const EventFiltersTestIds = {
  ROOT: (id: string = '') => `${EVENT_FILTERS_BASE_ID}${id ? `-${id}` : ''}`,
  CITY_SELECT: (id: string = '') =>
    `${EVENT_FILTERS_BASE_ID}-city-select${id ? `-${id}` : ''}`,
  TYPE_GROUP: (id: string = '') =>
    `${EVENT_FILTERS_BASE_ID}-type-group${id ? `-${id}` : ''}`,
}

export const EventsListTestIds = {
  ROOT: (id: string = '') => `${EVENTS_LIST_BASE_ID}${id ? `-${id}` : ''}`,
  ITEM: (id: string) => `${EVENTS_LIST_BASE_ID}-item-${id}`,
}

export const EventsPageHeaderTestIds = {
  ROOT: (id: string = '') =>
    `${EVENTS_PAGE_HEADER_BASE_ID}${id ? `-${id}` : ''}`,
  TITLE: (id: string = '') =>
    `${EVENTS_PAGE_HEADER_BASE_ID}-title${id ? `-${id}` : ''}`,
  TOTAL: (id: string = '') =>
    `${EVENTS_PAGE_HEADER_BASE_ID}-total${id ? `-${id}` : ''}`,
}
