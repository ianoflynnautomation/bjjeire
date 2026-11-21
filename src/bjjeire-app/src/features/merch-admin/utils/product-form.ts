import { uiContent } from '@/config/ui-content'
import {
  SIZE_IDS,
  type AdminProductDto,
  type CreateProductCommand,
  type UpdateProductCommand,
  type ProductKind,
  type SizeId,
} from '@/types/products'

const { validation } = uiContent.merchAdmin

/** Same rule as the API: lowercase words joined by hyphens, never a route name under /product. */
const SLUG_PATTERN = /^(?!(?:admin|photo)$)[a-z0-9]+(?:-[a-z0-9]+)*$/u
const PRICE_PATTERN = /^€?\s*(\d{1,4})(?:[.,](\d{1,2}))?$/u
const STOCK_PATTERN = /^\d{1,6}$/u

export interface SizeFormValue {
  offered: boolean
  stock: string
}

export interface ProductFormValues {
  name: string
  slug: string
  kind: ProductKind
  description: string
  /** Euro as the organiser types it, such as `45` or `45.50`. */
  price: string
  sizes: Record<SizeId, SizeFormValue>
}

export type ProductFormErrors = Partial<
  Record<'name' | 'slug' | 'description' | 'price' | 'sizes' | 'stock', string>
>

function emptySizes(): Record<SizeId, SizeFormValue> {
  return Object.fromEntries(
    SIZE_IDS.map(id => [id, { offered: false, stock: '0' }])
  ) as Record<SizeId, SizeFormValue>
}

export function emptyProductForm(): ProductFormValues {
  return {
    name: '',
    slug: '',
    kind: 'RASHGUARD',
    description: '',
    price: '',
    sizes: emptySizes(),
  }
}

export function productFormFrom(product: AdminProductDto): ProductFormValues {
  const sizes = emptySizes()
  for (const size of product.sizes) {
    sizes[size.id] = { offered: true, stock: String(size.stock) }
  }
  return {
    name: product.name,
    slug: product.slug,
    kind: product.kind,
    description: product.description,
    price: (product.priceCents / 100).toFixed(2),
    sizes,
  }
}

/** Whole cents from what the organiser typed, or null when it is not a price. */
export function priceToCents(price: string): number | null {
  const match = PRICE_PATTERN.exec(price.trim())
  if (!match) {
    return null
  }
  const [, euros, fraction = ''] = match
  return Number(euros) * 100 + Number(fraction.padEnd(2, '0'))
}

export function validateProductForm(
  values: ProductFormValues
): ProductFormErrors {
  const errors: ProductFormErrors = {}
  const name = values.name.trim()
  if (name === '' || name.length > 80) {
    errors.name = validation.nameRequired
  }
  if (
    values.slug.length < 3 ||
    values.slug.length > 60 ||
    !SLUG_PATTERN.test(values.slug)
  ) {
    errors.slug = validation.slugInvalid
  }
  const description = values.description.trim()
  if (description === '' || description.length > 2000) {
    errors.description = validation.descriptionRequired
  }
  const cents = priceToCents(values.price)
  if (cents === null || cents < 100 || cents > 100000) {
    errors.price = validation.priceInvalid
  }
  const offered = SIZE_IDS.filter(id => values.sizes[id].offered)
  if (offered.length === 0) {
    errors.sizes = validation.sizesRequired
  }
  if (offered.some(id => !STOCK_PATTERN.test(values.sizes[id].stock.trim()))) {
    errors.stock = validation.stockInvalid
  }
  return errors
}

/** The command for a form that passed {@link validateProductForm}. */
export function toCreateCommand(
  values: ProductFormValues
): CreateProductCommand {
  return {
    slug: values.slug,
    name: values.name.trim(),
    kind: values.kind,
    description: values.description.trim(),
    priceCents: priceToCents(values.price) ?? 0,
    sizes: SIZE_IDS.filter(id => values.sizes[id].offered).map(id => ({
      id,
      stock: Number(values.sizes[id].stock.trim()),
    })),
  }
}

/** The full update for a stored product with a new photo order: everything else is sent back as it is. */
export function updateCommandFrom(
  product: AdminProductDto,
  photos: string[]
): UpdateProductCommand {
  return {
    slug: product.slug,
    name: product.name,
    kind: product.kind,
    description: product.description,
    priceCents: product.priceCents,
    sizes: product.sizes.map(size => ({ id: size.id, stock: size.stock })),
    photos,
    version: product.version,
  }
}
