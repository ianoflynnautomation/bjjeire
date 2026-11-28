// Test ids for BJJ Éire merch (specs/003-bjjeire-merch-shop). bjjeire-tests
// selects by these values, so renaming one is a breaking change there.
export const MerchFeaturedTestIds = {
  SECTION: 'merch-featured',
  LIST: 'merch-featured-list',
  CARD: 'merch-featured-card',
} as const

export const MerchCardTestIds = {
  IMAGE: 'merch-card-image',
  NAME: 'merch-card-name',
  KIND: 'merch-card-kind',
  PRICE: 'merch-card-price',
  OUT_OF_STOCK: 'merch-card-out-of-stock',
  LINK: 'merch-card-link',
} as const

export const ProductPageTestIds = {
  ROOT: 'product-page',
  NAME: 'product-page-name',
  KIND: 'product-page-kind',
  PRICE: 'product-page-price',
  DESCRIPTION: 'product-page-description',
  PHOTOS: 'product-page-photos',
  PHOTO: 'product-page-photo',
  SIZES: 'product-page-sizes',
  SIZE: 'product-page-size',
  NOT_FOUND: 'product-page-not-found',
} as const

export const MerchAdminTestIds = {
  LIST: 'merch-admin-list',
  LIST_ITEM: 'merch-admin-list-item',
  LIST_ITEM_STATUS: 'merch-admin-list-item-status',
  FORM: 'merch-admin-product-form',
  FORM_ERROR: 'merch-admin-product-form-error',
  PHOTOS: 'merch-admin-photos',
  PHOTO: 'merch-admin-photo',
  PHOTO_INPUT: 'merch-admin-photo-input',
  PHOTO_ERROR: 'merch-admin-photo-error',
  STOCK: 'merch-admin-stock',
  STOCK_ERROR: 'merch-admin-stock-error',
  STATUS: 'merch-admin-product-status',
  ACTION_ERROR: 'merch-admin-action-error',
} as const

export const BasketTestIds = {
  BADGE: 'basket-badge',
  BADGE_COUNT: 'basket-badge-count',
  MENU_LINK: 'basket-menu-link',
  ADD: 'product-add-to-basket',
  ADD_MESSAGE: 'product-add-to-basket-message',
  ROOT: 'basket-page',
  EMPTY: 'basket-empty',
  LINE: 'basket-line',
  LINE_NAME: 'basket-line-name',
  LINE_SIZE: 'basket-line-size',
  LINE_PRICE: 'basket-line-price',
  LINE_TOTAL: 'basket-line-total',
  LINE_QUANTITY: 'basket-line-quantity',
  LINE_REMOVE: 'basket-line-remove',
  LINE_PROBLEM: 'basket-line-problem',
  ITEMS_TOTAL: 'basket-items-total',
  CHECKOUT: 'basket-checkout',
} as const

export const CheckoutTestIds = {
  ROOT: 'checkout-page',
  EMPTY: 'checkout-empty',
  ITEMS: 'checkout-items-total',
  DELIVERY: 'checkout-delivery',
  TOTAL: 'checkout-total',
  FORM: 'checkout-form',
  SUBMIT: 'checkout-submit',
  ERROR: 'checkout-error',
  CHANGES: 'checkout-changes',
  CHANGE: 'checkout-change',
} as const

export const OrderPageTestIds = {
  ROOT: 'order-page',
  NUMBER: 'order-number',
  STATUS: 'order-status',
  MESSAGE: 'order-message',
  LINE: 'order-line',
  ITEMS: 'order-items-total',
  DELIVERY: 'order-delivery',
  TOTAL: 'order-total',
  ADDRESS: 'order-address',
  RESUME: 'order-resume',
  ERROR: 'order-error',
  NOT_FOUND: 'order-not-found',
  NO_KEY: 'order-no-key',
} as const
