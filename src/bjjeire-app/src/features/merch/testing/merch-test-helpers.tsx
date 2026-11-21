import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { API_ROUTES } from '@/config/api-routes'
import { paths } from '@/config/paths'
import { server } from '@/testing/msw/server'
import { renderWithProviders } from '@/testing/render-utils'
import { createListSeeds, testApiUrl } from '@/testing/seed-helpers'
import {
  createPaginatedProducts,
  createProductSummary,
} from '@/testing/factories/product.factory'
import type { ProductDto, ProductSummaryDto } from '@/types/products'
import ProductPage from '@/pages/ProductPage'

export const PRODUCTS_API = testApiUrl(API_ROUTES.products)

const seeds = createListSeeds<ProductSummaryDto>(
  PRODUCTS_API,
  createPaginatedProducts,
  () => [createProductSummary()]
)

export const seedProducts = seeds.seed
export const seedProductsError = seeds.seedError
export const seedProductsPending = seeds.seedPending

export function seedProduct(product: ProductDto): void {
  server.use(
    http.get(`${PRODUCTS_API}/${product.slug}`, () =>
      HttpResponse.json(product)
    )
  )
}

export function seedProductStatus(slug: string, status: number): void {
  server.use(
    http.get(`${PRODUCTS_API}/${slug}`, () =>
      HttpResponse.json(
        { type: 'urn:bjjeire:not-found', title: 'Resource Not Found', status },
        { status }
      )
    )
  )
}

export function renderProductPage(
  slug: string
): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(
    <Routes>
      <Route path={paths.product.path} element={<ProductPage />} />
      <Route path={paths.shop.path} element={<p>Shop</p>} />
    </Routes>,
    {
      initialRoutes: [paths.product.getHref(slug)],
      featureFlags: { Merch: true },
    }
  )
}
