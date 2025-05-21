export const NAVIGATION_BASE_ID = 'main-navigation'
export const BUTTON_GROUP_FILTER_BASE_ID = 'button-group-filter'
export const SELECT_FILTER_BASE_ID = 'select-filter'
export const SOCIAL_MEDIA_LINKS_BASE_ID = 'social-media-links'
export const BADGE_BASE_ID = 'badge'
export const CLOSE_ICON_BASE_ID = 'close-icon'
export const DETAIL_ITEM_BASE_ID = 'detail-item'
export const ERROR_STATE_BASE_ID = 'error-state'
export const ICON_WRAPPER_BASE_ID = 'icon-wrapper'
export const LOADING_SPINNER_BASE_ID = 'spinner'
export const LOADING_STATE_BASE_ID = 'loading-state'
export const NO_DATA_STATE_BASE_ID = 'no-data-state'
export const PAGINATION_BASE_ID = 'pagination'
export const FOOTER_BASE_ID = 'app-footer'
export const BACKGROUND_FETCHING_INDICATOR_BASE_ID ='background-fetching-indicator'

export const withTestIdSuffix = (
  baseId: string | ((id: string) => string),
  suffix: string
): string => {
  return typeof baseId === 'string' ? `${baseId}-${suffix}` : baseId(suffix)
}

export const NavigationTestIds = {
  ROOT: (id: string = '') => `${NAVIGATION_BASE_ID}${id ? `-${id}` : ''}`,
  LOGO_LINK: (id: string = '') =>
    `${NAVIGATION_BASE_ID}-logo-link${id ? `-${id}` : ''}`,
  DESKTOP: {
    LINKS: (id: string = '') =>
      `${NAVIGATION_BASE_ID}-desktop-links${id ? `-${id}` : ''}`,
    LINK: (itemId: string, id: string = '') =>
      `${NAVIGATION_BASE_ID}-desktop-link-${itemId}${id ? `-${id}` : ''}`,
  },
  MOBILE: {
    TOGGLE: (id: string = '') =>
      `${NAVIGATION_BASE_ID}-mobile-menu-toggle${id ? `-${id}` : ''}`,
    PANEL: (id: string = '') =>
      `${NAVIGATION_BASE_ID}-mobile-menu-panel${id ? `-${id}` : ''}`,
    LINK: (itemId: string, id: string = '') =>
      `${NAVIGATION_BASE_ID}-mobile-link-${itemId}${id ? `-${id}` : ''}`,
  },
  SUPPORT_BUTTON: (id: string = '') =>
    `${NAVIGATION_BASE_ID}-support-button${id ? `-${id}` : ''}`,
}

export const ButtonGroupFilterTestIds = {
  ROOT: (id: string = '') =>
    `${BUTTON_GROUP_FILTER_BASE_ID}${id ? `-${id}` : ''}`,
  LABEL: (id: string = '') =>
    `${BUTTON_GROUP_FILTER_BASE_ID}-label${id ? `-${id}` : ''}`,
  ALL_BUTTON: (id: string = '') =>
    `${BUTTON_GROUP_FILTER_BASE_ID}-all-button${id ? `-${id}` : ''}`,
  BUTTON: (value: string, id: string = '') =>
    `${BUTTON_GROUP_FILTER_BASE_ID}-button-${value}${id ? `-${id}` : ''}`,
}

export const SelectFilterTestIds = {
  ROOT: (id: string = '') => `${SELECT_FILTER_BASE_ID}${id ? `-${id}` : ''}`,
  LABEL: (id: string = '') =>
    `${SELECT_FILTER_BASE_ID}-label${id ? `-${id}` : ''}`,
  ICON: (id: string = '') =>
    `${SELECT_FILTER_BASE_ID}-icon${id ? `-${id}` : ''}`,
  SELECT: (id: string = '') =>
    `${SELECT_FILTER_BASE_ID}-select${id ? `-${id}` : ''}`,
  PLACEHOLDER_OPTION: (id: string = '') =>
    `${SELECT_FILTER_BASE_ID}-placeholder-option${id ? `-${id}` : ''}`,
  OPTION: (value: string, id: string = '') =>
    `${SELECT_FILTER_BASE_ID}-option-${value}${id ? `-${id}` : ''}`,
}

export const SocialMediaLinksTestIds = {
  ROOT: (id: string = '') =>
    `${SOCIAL_MEDIA_LINKS_BASE_ID}${id ? `-${id}` : ''}`,
  LINK: (platform: string, id: string = '') =>
    `${SOCIAL_MEDIA_LINKS_BASE_ID}-link-${platform}${id ? `-${id}` : ''}`,
  ICON: (platform: string, id: string = '') =>
    `${SOCIAL_MEDIA_LINKS_BASE_ID}-icon-${platform}${id ? `-${id}` : ''}`,
}


export const BackgroundFetchingIndicatorTestIds = {
  ROOT: (id: string = '') =>
    `${BACKGROUND_FETCHING_INDICATOR_BASE_ID}${id ? `-${id}` : ''}`,
}

export const BadgeTestIds = {
  ROOT: (id: string = '') => `${BADGE_BASE_ID}${id ? `-${id}` : ''}`,
}

export const CloseIconTestIds = {
  ROOT: (id: string = '') => `${CLOSE_ICON_BASE_ID}${id ? `-${id}` : ''}`,
}

export const DetailItemTestIds = {
  ROOT: (id: string = '') => `${DETAIL_ITEM_BASE_ID}${id ? `-${id}` : ''}`,
  ICON: (id: string = '') => `${DETAIL_ITEM_BASE_ID}-icon${id ? `-${id}` : ''}`,
  CONTENT: (id: string = '') =>
    `${DETAIL_ITEM_BASE_ID}-content${id ? `-${id}` : ''}`,
}

export const ErrorStateTestIds = {
  ROOT: (id: string = '') => `${ERROR_STATE_BASE_ID}${id ? `-${id}` : ''}`,
  ICON: (id: string = '') => `${ERROR_STATE_BASE_ID}-icon${id ? `-${id}` : ''}`,
  TITLE: (id: string = '') =>
    `${ERROR_STATE_BASE_ID}-title${id ? `-${id}` : ''}`,
  MESSAGE: (id: string = '') =>
    `${ERROR_STATE_BASE_ID}-message${id ? `-${id}` : ''}`,
  RETRY_BUTTON: (id: string = '') =>
    `${ERROR_STATE_BASE_ID}-retry-button${id ? `-${id}` : ''}`,
}

export const IconWrapperTestIds = {
  ROOT: (id: string = '') => `${ICON_WRAPPER_BASE_ID}${id ? `-${id}` : ''}`,
}

export const LoadingSpinnerTestIds = {
  ROOT: (id: string = '') => `${LOADING_SPINNER_BASE_ID}${id ? `-${id}` : ''}`,
  ICON: (id: string = '') =>
    `${LOADING_SPINNER_BASE_ID}-icon${id ? `-${id}` : ''}`,
  TEXT: (id: string = '') =>
    `${LOADING_SPINNER_BASE_ID}-text${id ? `-${id}` : ''}`,
}

export const LoadingStateTestIds = {
  ROOT: (id: string = '') => `${LOADING_STATE_BASE_ID}${id ? `-${id}` : ''}`,
  SPINNER: (id: string = '') =>
    `${LOADING_STATE_BASE_ID}-spinner${id ? `-${id}` : ''}`,
}

export const NoDataStateTestIds = {
  ROOT: (id: string = '') => `${NO_DATA_STATE_BASE_ID}${id ? `-${id}` : ''}`,
  ICON: (id: string = '') =>
    `${NO_DATA_STATE_BASE_ID}-icon${id ? `-${id}` : ''}`,
  TITLE: (id: string = '') =>
    `${NO_DATA_STATE_BASE_ID}-title${id ? `-${id}` : ''}`,
  MESSAGE_LINE1: (id: string = '') =>
    `${NO_DATA_STATE_BASE_ID}-message-line1${id ? `-${id}` : ''}`,
  MESSAGE_LINE2: (id: string = '') =>
    `${NO_DATA_STATE_BASE_ID}-message-line2${id ? `-${id}` : ''}`,
  ACTION_BUTTON: (id: string = '') =>
    `${NO_DATA_STATE_BASE_ID}-action-button${id ? `-${id}` : ''}`,
}

export const PaginationTestIds = {
  ROOT: (id: string = '') => `${PAGINATION_BASE_ID}${id ? `-${id}` : ''}`,
  ITEMS_TEXT: (id: string = '') =>
    `${PAGINATION_BASE_ID}-items-text${id ? `-${id}` : ''}`,
  PREV_BUTTON: (id: string = '') =>
    `${PAGINATION_BASE_ID}-prev-button${id ? `-${id}` : ''}`,
  PAGE_INDICATOR: (id: string = '') =>
    `${PAGINATION_BASE_ID}-page-indicator${id ? `-${id}` : ''}`,
  NEXT_BUTTON: (id: string = '') =>
    `${PAGINATION_BASE_ID}-next-button${id ? `-${id}` : ''}`,
}

export const FooterTestIds = {
  ROOT: (id: string = '') => `${FOOTER_BASE_ID}${id ? `-${id}` : ''}`,
  QUICK_LINKS_SECTION: (id: string = '') =>
    `${FOOTER_BASE_ID}-quick-links-section${id ? `-${id}` : ''}`,
  QUICK_LINKS_HEADING: (id: string = '') =>
    `${FOOTER_BASE_ID}-quick-links-heading${id ? `-${id}` : ''}`,
  QUICK_LINK_ITEM: (linkName: string, id: string = '') =>
    `${FOOTER_BASE_ID}-quick-link-${linkName}${id ? `-${id}` : ''}`,
  COPYRIGHT_TEXT: (id: string = '') =>
    `${FOOTER_BASE_ID}-copyright${id ? `-${id}` : ''}`,
}
