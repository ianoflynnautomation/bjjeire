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
