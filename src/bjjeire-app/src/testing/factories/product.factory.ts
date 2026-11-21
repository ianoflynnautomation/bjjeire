import type { PaginatedResponse } from '@/types/common'
import type {
  AdminProductDto,
  ProductDto,
  ProductSummaryDto,
} from '@/types/products'

let _productId = 0

export function resetProductIdCounter(): void {
  _productId = 0
}

function nextId(): number {
  return ++_productId
}

/** A 64-character hex hash, distinct per seed. */
export function photoHash(seed: number): string {
  return seed.toString(16).padStart(2, '0').repeat(32)
}

export function createProductSummary(
  overrides: Partial<ProductSummaryDto> = {}
): ProductSummaryDto {
  const id = nextId()
  return {
    id: id.toString(16).padStart(24, '0'),
    slug: `product-${id}`,
    name: `Test Product ${id}`,
    kind: 'RASHGUARD',
    priceCents: 4500,
    currency: 'EUR',
    photo: photoHash(id),
    soldOut: false,
    ...overrides,
  }
}

export function createProduct(overrides: Partial<ProductDto> = {}): ProductDto {
  const id = nextId()
  return {
    id: id.toString(16).padStart(24, '0'),
    slug: `product-${id}`,
    name: `Test Product ${id}`,
    kind: 'RASHGUARD',
    description: `Description for product ${id}`,
    priceCents: 4500,
    currency: 'EUR',
    photos: [photoHash(id)],
    sizes: [
      { id: 'S', available: 3, soldOut: false },
      { id: 'M', available: 2, soldOut: false },
    ],
    soldOut: false,
    ...overrides,
  }
}

export function createAdminProduct(
  overrides: Partial<AdminProductDto> = {}
): AdminProductDto {
  const id = nextId()
  return {
    id: id.toString(16).padStart(24, '0'),
    slug: `product-${id}`,
    name: `Test Product ${id}`,
    kind: 'RASHGUARD',
    description: `Description for product ${id}`,
    priceCents: 4500,
    currency: 'EUR',
    photos: [],
    sizes: [
      { id: 'S', stock: 3, held: 0, available: 3, soldOut: false },
      { id: 'M', stock: 4, held: 0, available: 4, soldOut: false },
    ],
    status: 'DRAFT',
    version: 0,
    createdOnUtc: '2026-11-19T10:00:00Z',
    updatedOnUtc: null,
    ...overrides,
  }
}

export function createPaginatedProducts<T>(
  products: T[],
  page: number,
  totalPages: number
): PaginatedResponse<T> {
  return {
    data: products,
    pagination: {
      totalItems: products.length,
      currentPage: page,
      pageSize: 100,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPageUrl: null,
      previousPageUrl: null,
    },
  }
}
