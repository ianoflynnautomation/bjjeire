// BJJ Éire merch on the Shop page (specs/003-bjjeire-merch-shop). Shown only
// while the Merch flag is on; filled in as each merch slice ships.
export const merch = {
  section: {
    title: 'BJJ Éire merch',
    intro: 'Rashguards, shorts and t-shirts from BJJ Éire.',
    ariaLabel: 'BJJ Éire merch',
  },
  kinds: {
    RASHGUARD: 'Rashguard',
    SHORTS: 'Shorts',
    T_SHIRT: 'T-shirt',
  },
  card: {
    priceLabel: 'Price',
    kindLabel: 'Kind',
    outOfStock: 'Out of stock',
    viewButton: 'View product',
  },
  product: {
    documentTitle: 'BJJ Éire merch | BJJ Éire',
    documentTitleSuffix: '| BJJ Éire merch',
    backLink: 'Back to Shop',
    photosLabel: 'Photos',
    photoAlt: (name: string, position: number, total: number): string =>
      total === 1 ? name : `${name}, photo ${position} of ${total}`,
    sizesLegend: 'Size',
    soldOut: 'Sold out',
    soldOutSize: (size: string): string => `${size}, sold out`,
    allSoldOut: 'Every size is sold out.',
    loadOneFailed: 'This product could not be loaded.',
  },
  notFound: {
    title: 'Product not found',
    message: 'It may have sold out for good or been taken off sale.',
    backLink: 'Back to Shop',
  },
} as const

// The organiser's shop admin (User Story 4). Organiser-only screens.
export const merchAdmin = {
  documentTitle: 'Manage shop | BJJ Éire',
  productDocumentTitle: 'Manage product | BJJ Éire',
  listTitle: 'Shop products',
  signInMessage: 'Sign in with the organiser account to manage the shop.',
  backLink: 'All products',
  statuses: {
    DRAFT: 'Draft',
    PUBLISHED: 'Published',
    HIDDEN: 'Hidden',
  },
  list: {
    ariaLabel: 'Products',
    empty: 'No products yet. Add the first one below.',
    loadFailed: 'The products could not be loaded.',
    editLink: 'Manage',
    stockSummary: (available: number): string => `${available} available`,
  },
  create: {
    heading: 'Add a product',
    intro:
      'A new product is saved as a draft. Add its photos next, then publish it.',
    submit: 'Save draft',
    saving: 'Saving…',
  },
  form: {
    name: 'Name',
    slug: 'Address name',
    slugHint:
      'Lowercase letters, digits and hyphens, as in harp-rashguard. It becomes the product’s page address.',
    kind: 'Kind',
    description: 'Description',
    price: 'Price (€)',
    priceHint: 'Including VAT, between €1 and €1,000.',
    sizesLegend: 'Sizes and stock',
    sizesHint: 'Tick each size the product comes in and set its stock.',
    sizeOffered: (size: string): string => `Sold in ${size}`,
    stockFor: (size: string): string => `Stock of ${size}`,
    heldNote: (held: number): string => `${held} held in checkouts`,
    save: 'Save changes',
    saving: 'Saving…',
  },
  validation: {
    nameRequired: 'Enter a name of up to 80 characters.',
    slugInvalid:
      'Use 3 to 60 lowercase letters, digits and hyphens, not “admin” or “photo”.',
    descriptionRequired: 'Enter a description of up to 2,000 characters.',
    priceInvalid: 'Enter a price between €1.00 and €1,000.00.',
    sizesRequired: 'Choose at least one size.',
    stockInvalid: 'Stock must be a whole number of 0 or more.',
  },
  photos: {
    heading: 'Photos',
    intro:
      'JPEG, PNG or WebP, up to 5 MB each and 6 in all. The first photo is the one the shop shows.',
    none: 'No photos yet. A product needs one before it can be published.',
    upload: 'Add a photo',
    uploading: 'Uploading…',
    uploadProgress: (percent: number): string => `Uploading… ${percent}%`,
    tooLarge: 'That photo is over 5 MB. Choose a smaller one.',
    unsupported: 'That file is not a JPEG, PNG or WebP image.',
    full: 'A product can show at most 6 photos. Remove one first.',
    moveEarlier: (position: number): string => `Move photo ${position} earlier`,
    moveLater: (position: number): string => `Move photo ${position} later`,
    remove: (position: number): string => `Remove photo ${position}`,
    alt: (position: number): string => `Photo ${position}`,
  },
  stock: {
    heading: 'Stock',
    intro:
      'What is on the shelf for each size. Visitors see a size as sold out when nothing is left beyond what checkouts hold.',
    size: 'Size',
    stock: 'Stock',
    held: 'Held',
    available: 'Available',
    save: 'Save stock',
    saving: 'Saving…',
    saved: 'Stock saved.',
  },
  actions: {
    publish: 'Publish',
    publishing: 'Publishing…',
    hide: 'Hide from sale',
    hiding: 'Hiding…',
    show: 'Show again',
    delete: 'Delete draft',
    deleting: 'Deleting…',
    deleteConfirm: 'Delete this draft and its photos? This cannot be undone.',
    published: 'Visitors can now see and buy this product.',
    hidden: 'Visitors can no longer see or buy this product.',
  },
  errors: {
    generic: 'Something went wrong. Please try again.',
    signedOut: 'Your sign-in has ended. Sign in again and retry.',
    stale:
      'Someone else changed this product while you were editing. Reload it to see their change, then try again.',
    loadFailed: 'This product could not be loaded.',
    notFound: 'There is no product with this id.',
  },
} as const
