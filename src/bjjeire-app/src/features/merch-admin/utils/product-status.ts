import type { ProductStatus } from '@/types/products'

/** Badge colours for each status, the same as the competition admin's. */
export const PRODUCT_STATUS_COLOURS = {
  DRAFT: 'amber',
  PUBLISHED: 'emerald',
  HIDDEN: 'slate',
} as const satisfies Record<ProductStatus, string>
