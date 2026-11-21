import type { components } from '@/types/generated/api'
import type {
  AdminProductDto,
  AdminProductSizeDto,
  CreateProductCommand,
  PhotoUploadResponse,
  ProductDto,
  ProductSizeDto,
  ProductSummaryDto,
  SizeStockDto,
  StockCommand,
  UpdateProductCommand,
} from '@/types/products'

type Schemas = components['schemas']

// Exclude, not a mapped `true | never`: a key the SPA invents must fail the build.
type KeysArePublished<Frontend, Api> =
  Exclude<keyof Frontend, keyof Api> extends never ? true : never

type SummaryKeys = KeysArePublished<
  ProductSummaryDto,
  Schemas['ProductSummaryDto']
>
type ProductKeys = KeysArePublished<ProductDto, Schemas['ProductDto']>
type SizeKeys = KeysArePublished<ProductSizeDto, Schemas['ProductSizeDto']>
type AdminKeys = KeysArePublished<AdminProductDto, Schemas['AdminProductDto']>
type AdminSizeKeys = KeysArePublished<
  AdminProductSizeDto,
  Schemas['AdminProductSizeDto']
>
type CreateKeys = KeysArePublished<
  CreateProductCommand,
  Schemas['CreateProductCommand']
>
type UpdateKeys = KeysArePublished<
  UpdateProductCommand,
  Schemas['UpdateProductCommand']
>
type StockKeys = KeysArePublished<StockCommand, Schemas['StockCommand']>
type SizeStockKeys = KeysArePublished<SizeStockDto, Schemas['SizeStockDto']>
type UploadKeys = KeysArePublished<
  PhotoUploadResponse,
  Schemas['PhotoUploadResponse']
>
type KindValues =
  ProductSummaryDto['kind'] extends NonNullable<
    Schemas['ProductSummaryDto']['kind']
  >
    ? true
    : never
type StatusValues =
  AdminProductDto['status'] extends NonNullable<
    Schemas['AdminProductDto']['status']
  >
    ? true
    : never
type SizeValues =
  ProductSizeDto['id'] extends NonNullable<Schemas['ProductSizeDto']['id']>
    ? true
    : never

// Separate checks. An intersection of `true` is redundant, and the lint fixer deletes it.
export const productsContractOk = [
  true satisfies SummaryKeys,
  true satisfies ProductKeys,
  true satisfies SizeKeys,
  true satisfies AdminKeys,
  true satisfies AdminSizeKeys,
  true satisfies CreateKeys,
  true satisfies UpdateKeys,
  true satisfies StockKeys,
  true satisfies SizeStockKeys,
  true satisfies UploadKeys,
  true satisfies KindValues,
  true satisfies StatusValues,
  true satisfies SizeValues,
]
