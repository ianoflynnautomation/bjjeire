// src/constants/dataTestIds.ts (or a more specific path like src/features/SupportModal/supportModal.testIds.ts)

/**
 * Base test ID for the Support Modal component.
 * Other test IDs within the modal can be prefixed with this.
 */
export const SUPPORT_MODAL_BASE_ID = 'support-modal';

/**
 * Data test IDs for elements within the SupportModal component.
 */
export const SupportModalTestIds = {
  // Root elements of the modal
  OVERLAY: `${SUPPORT_MODAL_BASE_ID}-overlay`,
  CONTENT: `${SUPPORT_MODAL_BASE_ID}-content`,

  // Header elements
  MAIN_TITLE: `${SUPPORT_MODAL_BASE_ID}-main-title`, // The "Support BJJ World" h2
  CLOSE_BUTTON: `${SUPPORT_MODAL_BASE_ID}-close-button`,

  // Body elements
  ADDRESS_SECTION: `${SUPPORT_MODAL_BASE_ID}-address-section`,
  BTC_ADDRESS_DISPLAY: `${SUPPORT_MODAL_BASE_ID}-btc-address`, // The <code> element
  COPY_BUTTON: `${SUPPORT_MODAL_BASE_ID}-copy-button`,
  COPIED_CONFIRMATION: `${SUPPORT_MODAL_BASE_ID}-copied-confirmation`, // The "Address copied!" paragraph

  // Warning message
  WARNING_MESSAGE: `${SUPPORT_MODAL_BASE_ID}-warning-message`,

  // --- Functions to generate dynamic IDs if needed ---
  // Example (not used in current SupportModal but demonstrates pattern):
  // getListItemId: (itemId: string | number) => `${SUPPORT_MODAL_BASE_ID}-item-${itemId}`,
};

// You could also define constants for other components here,
// or have separate files for each major component/feature.
// For example:
// export const NAVIGATION_BASE_ID = 'main-navigation';
// export const NavigationTestIds = {
//   LOGO_LINK: `${NAVIGATION_BASE_ID}-logo-link`,
//   // ... other navigation test ids
// };

// How to use in your component:
// import { SupportModalTestIds } from './path/to/dataTestIds';
// <div data-testid={SupportModalTestIds.OVERLAY}>...</div>

// How to use in your Playwright tests:
// import { SupportModalTestIds } from '../path/to/dataTestIds'; // Adjust path relative to test file
// const overlay = page.getByTestId(SupportModalTestIds.OVERLAY);
