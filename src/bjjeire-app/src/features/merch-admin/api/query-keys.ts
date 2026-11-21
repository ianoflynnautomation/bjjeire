/** Every product, drafts included, as the organiser's list shows them. */
export const ADMIN_PRODUCTS_KEY = ['admin-products'] as const
/** One product in the organiser's editor. */
export const adminProductKey = (id: string) => ['admin-product', id] as const
