export const SUPPORT_MODAL_BASE_ID = 'support-modal'

export const SupportModalTestIds = {
  ROOT: (id: string = '') => `${SUPPORT_MODAL_BASE_ID}${id ? `-${id}` : ''}`,
  OVERLAY: (id: string = '') =>
    `${SUPPORT_MODAL_BASE_ID}-overlay${id ? `-${id}` : ''}`,
  CONTENT: (id: string = '') =>
    `${SUPPORT_MODAL_BASE_ID}-content${id ? `-${id}` : ''}`,
  MAIN_TITLE: (id: string = '') =>
    `${SUPPORT_MODAL_BASE_ID}-main-title${id ? `-${id}` : ''}`,
  CLOSE_BUTTON: (id: string = '') =>
    `${SUPPORT_MODAL_BASE_ID}-close-button${id ? `-${id}` : ''}`,
  ADDRESS_SECTION: (id: string = '') =>
    `${SUPPORT_MODAL_BASE_ID}-address-section${id ? `-${id}` : ''}`,
  BTC_ADDRESS_DISPLAY: (id: string = '') =>
    `${SUPPORT_MODAL_BASE_ID}-btc-address${id ? `-${id}` : ''}`,
  COPY_BUTTON: (id: string = '') =>
    `${SUPPORT_MODAL_BASE_ID}-copy-button${id ? `-${id}` : ''}`,
  COPIED_CONFIRMATION: (id: string = '') =>
    `${SUPPORT_MODAL_BASE_ID}-copied-confirmation${id ? `-${id}` : ''}`,
  WARNING_MESSAGE: (id: string = '') =>
    `${SUPPORT_MODAL_BASE_ID}-warning-message${id ? `-${id}` : ''}`,
}
