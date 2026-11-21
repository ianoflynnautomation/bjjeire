// BJJ Éire merch products (specs/stc/shop/contract.yaml). Enum values are
// UPPER_SNAKE, as the API publishes them (ADR-0016).

export type ProductKind = 'RASHGUARD' | 'SHORTS' | 'T_SHIRT'
export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'HIDDEN'
export type SizeId = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'

export const PRODUCT_KINDS: readonly ProductKind[] = [
  'RASHGUARD',
  'SHORTS',
  'T_SHIRT',
]
/** Display order: a product lists its sizes XS first. */
export const SIZE_IDS: readonly SizeId[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

/** The most photos a product shows, and the largest one the API accepts. */
export const MAX_PRODUCT_PHOTOS = 6
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024

export interface ProductSummaryDto {
  id: string
  slug: string
  name: string
  kind: ProductKind
  priceCents: number
  currency: string
  /** The first photo's SHA-256, or null when the product has none. */
  photo?: string | null
  /** True when no size can be bought. */
  soldOut: boolean
}

export interface ProductSizeDto {
  id: SizeId
  available: number
  soldOut: boolean
}

export interface ProductDto {
  id: string
  slug: string
  name: string
  kind: ProductKind
  description: string
  priceCents: number
  currency: string
  photos: string[]
  sizes: ProductSizeDto[]
  soldOut: boolean
}

export interface AdminProductSizeDto {
  id: SizeId
  stock: number
  /** In unpaid checkouts. Stock can never be set below it. */
  held: number
  available: number
  soldOut: boolean
}

export interface AdminProductDto {
  id: string
  slug: string
  name: string
  kind: ProductKind
  description: string
  priceCents: number
  currency: string
  photos: string[]
  sizes: AdminProductSizeDto[]
  status: ProductStatus
  version: number
  createdOnUtc?: string | null
  updatedOnUtc?: string | null
}

export interface SizeStockDto {
  id: SizeId
  stock: number
}

export interface CreateProductCommand {
  slug: string
  name: string
  kind: ProductKind
  description: string
  priceCents: number
  sizes: SizeStockDto[]
}

export interface UpdateProductCommand extends CreateProductCommand {
  /** Every photo the product keeps, in display order. */
  photos: string[]
  version: number
}

export interface StockCommand {
  sizes: SizeStockDto[]
  version: number
}

export interface PhotoUploadResponse {
  sha256: string
}
