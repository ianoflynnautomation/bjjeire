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
  addToBasket: {
    button: 'Add to basket',
    chooseSize: 'Choose a size first.',
    added: (size: string): string => `Added size ${size} to your basket.`,
    basketFull:
      'Your basket already holds 20 items, the most one order can hold.',
    noneAdded: (size: string): string =>
      `Your basket already holds all of size ${size} you can buy.`,
    viewBasket: 'View basket',
  },
  basketBadge: {
    label: (units: number): string => {
      if (units === 0) {
        return 'Basket, empty'
      }
      return units === 1 ? 'Basket, 1 item' : `Basket, ${units} items`
    },
    menuLabel: (units: number): string =>
      units === 0 ? 'Basket' : `Basket (${units})`,
  },
  basket: {
    documentTitle: 'Basket | BJJ Éire',
    title: 'Your basket',
    empty: 'Your basket is empty.',
    emptyLink: 'Browse BJJ Éire merch',
    loadFailed: 'Your basket could not be loaded.',
    size: (size: string): string => `Size ${size}`,
    each: (price: string): string => `${price} each`,
    quantityLabel: (name: string, size: string): string =>
      `Quantity of ${name}, size ${size}`,
    remove: (name: string, size: string): string =>
      `Remove ${name}, size ${size}`,
    unavailable: 'No longer available. Remove it to carry on.',
    soldOut: 'Sold out. Remove it to carry on.',
    fewerLeft: (available: number): string => `Only ${available} left.`,
    itemsTotal: 'Items',
    deliveryNote: 'Delivery is added at checkout.',
    checkout: 'Go to checkout',
    fixFirst: 'Remove the items that are no longer available to carry on.',
    lowerFirst: 'Lower the quantities marked to carry on.',
    limits: 'Up to 10 of one size and 20 items in one order.',
  },
  checkout: {
    documentTitle: 'Checkout | BJJ Éire',
    title: 'Checkout',
    summaryHeading: 'Your order',
    items: 'Items',
    delivery: 'Delivery',
    total: 'Total',
    deliveryNote:
      'Flat delivery to the Republic of Ireland and Northern Ireland.',
    empty: 'Your basket is empty, so there is nothing to pay for.',
    backToBasket: 'Back to basket',
    detailsHeading: 'Your details',
    guestNote:
      'No account needed. We email your receipt and a link to your order.',
    name: 'Full name',
    email: 'Email',
    addressHeading: 'Delivery address',
    line1: 'Address line 1',
    line2: 'Address line 2 (optional)',
    town: 'Town or city',
    county: 'County',
    country: 'Country',
    countries: {
      IE: 'Republic of Ireland',
      GB: 'Northern Ireland',
    },
    postcodeIe: 'Eircode (optional)',
    postcodeNi: 'Postcode',
    postcodeNiHint: 'Northern Ireland postcodes start with BT, as in BT1 1AA.',
    phone: 'Phone (optional)',
    terms:
      'I accept the terms of sale, including the right to cancel within 14 days.',
    submit: (total: string): string => `Pay ${total}`,
    submitting: 'Going to payment…',
    secureNote:
      'You pay on Stripe’s secure page. Your card details never reach BJJ Éire.',
    changedHeading: 'Your basket changed',
    changedIntro:
      'Some items changed since you added them. Your basket has been updated; check it and pay again. Nothing was charged.',
    changes: {
      SOLD_OUT: (name: string, size: string, available: number): string =>
        available === 0
          ? `${name}, size ${size}, has sold out and was removed.`
          : `Only ${available} of ${name}, size ${size}, are left; your basket now has ${available}.`,
      PRICE_CHANGED: (name: string, size: string, price: string): string =>
        `${name}, size ${size}, now costs ${price}.`,
      UNAVAILABLE: (name: string, size: string): string =>
        `${name}, size ${size}, is no longer for sale and was removed.`,
      delivery: (fee: string): string => `Delivery now costs ${fee}.`,
    },
    unknownProduct: 'An item',
    validation: {
      name: 'Enter your name.',
      email: 'Enter an email address, such as aoife@example.ie.',
      line1: 'Enter the first line of your address.',
      town: 'Enter your town or city.',
      county: 'Enter your county.',
      postcodeIe: 'Enter an Eircode such as D02 X285, or leave it empty.',
      postcodeNi: 'Enter a Northern Ireland postcode starting with BT.',
      terms: 'Accept the terms of sale to carry on.',
    },
    problems: {
      'urn:bjjeire:size-sold-out':
        'A size in your basket just sold out. Nothing was charged; check your basket and try again.',
      'urn:bjjeire:basket-too-large':
        'An order can hold up to 10 of one size and 20 items in all.',
      'urn:bjjeire:too-many-unpaid':
        'You already have unpaid orders waiting. Pay for one, or wait 30 minutes for them to lapse.',
      'urn:bjjeire:delivery-not-available':
        'We deliver only to the Republic of Ireland and Northern Ireland (postcodes starting BT).',
      'urn:bjjeire:payment-unavailable':
        'Payment is unavailable right now. Nothing was charged; please try again shortly.',
      'urn:bjjeire:validation-error':
        'Some details are not right. Check the form and try again.',
      fallback: 'Something went wrong. Nothing was charged; please try again.',
    },
  },
  order: {
    documentTitle: 'Your order | BJJ Éire',
    title: (number: string): string => `Order ${number}`,
    loadFailed: 'Your order could not be loaded.',
    notFound: {
      title: 'Order not found',
      message:
        'Open the order with the link in your confirmation email. The link must be complete, including the part after #.',
    },
    statuses: {
      AWAITING_PAYMENT: 'Waiting for payment',
      CONFIRMED: 'Confirmed',
      DISPATCHED: 'On its way',
      EXPIRED: 'Not paid',
      REFUNDED: 'Refunded',
    },
    noKeyAfterPayment:
      'Thank you. If your payment went through, your order is confirmed and a receipt with a link to your order is on its way to your email.',
    confirming:
      'Your payment is being confirmed. This page updates by itself in a moment.',
    stillConfirming:
      'Your payment is taking longer than usual to confirm. We will email you as soon as it does; there is no need to pay again.',
    confirmed:
      'Thank you. Your order is confirmed and a receipt is on its way to your email.',
    awaiting:
      'This order is waiting for payment. Its items are held for you until the time below.',
    holdUntil: (time: string): string => `Held until ${time}.`,
    resume: 'Return to payment',
    resuming: 'Going to payment…',
    expired:
      'This order was not paid in time, so its items went back on sale. Nothing was charged.',
    tryAgain: 'Back to basket',
    refunded:
      'This order was refunded in full to your original payment method.',
    refundPending:
      'A full refund has been issued. It can take 5 to 10 days to appear.',
    dispatched: (tracking: string | null): string =>
      tracking === null
        ? 'Your order has been sent.'
        : `Your order has been sent. Tracking reference: ${tracking}.`,
    itemsHeading: 'Items',
    size: (size: string): string => `Size ${size}`,
    quantity: (quantity: number): string => `× ${quantity}`,
    items: 'Items',
    delivery: 'Delivery',
    total: 'Paid',
    totalDue: 'Total',
    addressHeading: 'Delivering to',
    emailLabel: 'Receipt sent to',
    problems: {
      'urn:bjjeire:hold-expired':
        'This order is no longer waiting for payment. Its items went back on sale; start again from your basket.',
      'urn:bjjeire:payment-received':
        'Your payment was received. Your order is being confirmed and will show as confirmed shortly.',
      'urn:bjjeire:payment-unavailable':
        'Payment is unavailable right now. Please try again shortly.',
      fallback: 'Something went wrong. Please try again.',
    },
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
