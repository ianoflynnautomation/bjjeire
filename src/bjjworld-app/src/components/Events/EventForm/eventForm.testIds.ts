
export const EVENT_FORM_BASE_ID = 'event-form'

export const EventFormTestIds = {
  // Main form elements
  MODAL_OVERLAY: `${EVENT_FORM_BASE_ID}-modal-overlay`,
  MODAL_CONTENT: `${EVENT_FORM_BASE_ID}-modal-content`,
  FORM_ELEMENT: `${EVENT_FORM_BASE_ID}-form-element`,
  MODAL_TITLE: `${EVENT_FORM_BASE_ID}-modal-title`,
  CLOSE_BUTTON: `${EVENT_FORM_BASE_ID}-close-button`,
  STATUS_SELECT: `${EVENT_FORM_BASE_ID}-close-status-select`,

  // Basic Info Section
  NAME_INPUT: `${EVENT_FORM_BASE_ID}-name-input`,
  TYPE_SELECT: `${EVENT_FORM_BASE_ID}-type-select`,
  REGION_INPUT: `${EVENT_FORM_BASE_ID}-region-input`,
  CITY_SELECT: `${EVENT_FORM_BASE_ID}-city-select`,

  ORGANISER_NAME_INPUT: `${EVENT_FORM_BASE_ID}-oprganiser-name-input`,
  ORGANISER_WEBSITE_INPUT: `${EVENT_FORM_BASE_ID}-oprganiser-website-input`,

  ADDRESS_INPUT: `${EVENT_FORM_BASE_ID}-address-input`,
  VENUE_INPUT: `${EVENT_FORM_BASE_ID}-venue-input`,


  INSTAGRAM_INPUT: `${EVENT_FORM_BASE_ID}-social-instagram`,
  FACEBOOK_INPUT: `${EVENT_FORM_BASE_ID}-social-facebook`,
  X_INPUT: `${EVENT_FORM_BASE_ID}-social-x`,
  YOUTUBE_INPUT: `${EVENT_FORM_BASE_ID}-social-youtube`,

  // Pricing Section
  PRICING_TYPE_SELECT: `${EVENT_FORM_BASE_ID}-pricing-type-select`,
  PRICING_AMOUNT_INPUT: `${EVENT_FORM_BASE_ID}-pricing-amount-input`,

  // Schedule Section
  SCHEDULE_SECTION_CONTAINER: `${EVENT_FORM_BASE_ID}-schedule-section`,
  SCHEDULE_TYPE_SELECT: `${EVENT_FORM_BASE_ID}-schedule-type-select`,
  START_DATE_INPUT: `${EVENT_FORM_BASE_ID}-start-date-input`,
  END_DATE_INPUT: `${EVENT_FORM_BASE_ID}-end-date-input`,

  // Hours List
  HOURS_LIST_CONTAINER: `${EVENT_FORM_BASE_ID}-hours-list`,
  ADD_HOUR_BUTTON: `${EVENT_FORM_BASE_ID}-add-hour-button`,
  getHourRowId: (key: string) => `${EVENT_FORM_BASE_ID}-hour-row-${key}`,
  getHourDateInputId: (key: string) => `${EVENT_FORM_BASE_ID}-hour-date-${key}`,
  getHourDaySelectId: (key: string) => `${EVENT_FORM_BASE_ID}-hour-day-${key}`,
  getHourOpenTimeInputId: (key: string) => `${EVENT_FORM_BASE_ID}-hour-open-${key}`,
  getHourCloseTimeInputId: (key: string) => `${EVENT_FORM_BASE_ID}-hour-close-${key}`,
  getHourRemoveButtonId: (key: string) => `${EVENT_FORM_BASE_ID}-hour-remove-${key}`,

  // Form Actions
  CANCEL_BUTTON: `${EVENT_FORM_BASE_ID}-cancel-button`,
  SUBMIT_BUTTON: `${EVENT_FORM_BASE_ID}-submit-button`,

  // Optional Sections (Add if implemented)
  // CONTACT_PERSON_INPUT: `${EVENT_FORM_BASE_ID}-contact-person-input`,
  // EVENT_URL_INPUT: `${EVENT_FORM_BASE_ID}-event-url-input`,
}
