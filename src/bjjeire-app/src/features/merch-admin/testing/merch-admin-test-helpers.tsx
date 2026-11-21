import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { API_ROUTES } from '@/config/api-routes'
import { paths } from '@/config/paths'
import { server } from '@/testing/msw/server'
import { renderWithProviders } from '@/testing/render-utils'
import { testApiUrl } from '@/testing/seed-helpers'
import { createPaginatedProducts } from '@/testing/factories/product.factory'
import type {
  AdminProductDto,
  CreateProductCommand,
  StockCommand,
  UpdateProductCommand,
} from '@/types/products'
import AdminShopPage from '@/pages/AdminShopPage'
import AdminShopProductPage from '@/pages/AdminShopProductPage'

export const PRODUCTS_ADMIN_API = testApiUrl(API_ROUTES.productsAdmin)
export const ADMIN_PRODUCT_PROBE = 'admin-product-probe'

export interface Captured<T> {
  calls: T[]
  authorization: (string | null)[]
}

function capture<T>(): Captured<T> {
  return { calls: [], authorization: [] }
}

export function seedAdminProducts(products: AdminProductDto[]): Captured<null> {
  const captured = capture<null>()
  server.use(
    http.get(PRODUCTS_ADMIN_API, ({ request }) => {
      captured.calls.push(null)
      captured.authorization.push(request.headers.get('Authorization'))
      return HttpResponse.json(createPaginatedProducts(products, 1, 1))
    })
  )
  return captured
}

/** Answers each read of one product with the next copy, then keeps repeating the last. */
export function seedAdminProduct(...copies: AdminProductDto[]): Captured<null> {
  const captured = capture<null>()
  let read = 0
  server.use(
    http.get(`${PRODUCTS_ADMIN_API}/${copies[0].id}`, ({ request }) => {
      captured.calls.push(null)
      captured.authorization.push(request.headers.get('Authorization'))
      const copy = copies[Math.min(read, copies.length - 1)]
      read++
      return HttpResponse.json(copy)
    })
  )
  return captured
}

export function seedCreateProduct(
  respond: (command: CreateProductCommand) => AdminProductDto
): Captured<CreateProductCommand> {
  const captured = capture<CreateProductCommand>()
  server.use(
    http.post(PRODUCTS_ADMIN_API, async ({ request }) => {
      const command = (await request.json()) as CreateProductCommand
      captured.calls.push(command)
      captured.authorization.push(request.headers.get('Authorization'))
      return HttpResponse.json(respond(command), { status: 201 })
    })
  )
  return captured
}

export function seedUpdateProduct(
  id: string,
  respond: (command: UpdateProductCommand) => AdminProductDto
): Captured<UpdateProductCommand> {
  const captured = capture<UpdateProductCommand>()
  server.use(
    http.put(`${PRODUCTS_ADMIN_API}/${id}`, async ({ request }) => {
      const command = (await request.json()) as UpdateProductCommand
      captured.calls.push(command)
      captured.authorization.push(request.headers.get('Authorization'))
      return HttpResponse.json(respond(command))
    })
  )
  return captured
}

export function seedSetStock(
  id: string,
  respond: (command: StockCommand) => AdminProductDto
): Captured<StockCommand> {
  const captured = capture<StockCommand>()
  server.use(
    http.put(`${PRODUCTS_ADMIN_API}/${id}/stock`, async ({ request }) => {
      const command = (await request.json()) as StockCommand
      captured.calls.push(command)
      captured.authorization.push(request.headers.get('Authorization'))
      return HttpResponse.json(respond(command))
    })
  )
  return captured
}

export function seedProductAction(
  id: string,
  action: 'publish' | 'hide',
  respond: () => AdminProductDto
): Captured<null> {
  const captured = capture<null>()
  server.use(
    http.post(`${PRODUCTS_ADMIN_API}/${id}/${action}`, ({ request }) => {
      captured.calls.push(null)
      captured.authorization.push(request.headers.get('Authorization'))
      return HttpResponse.json(respond())
    })
  )
  return captured
}

export function seedDeleteProduct(id: string): Captured<null> {
  const captured = capture<null>()
  server.use(
    http.delete(`${PRODUCTS_ADMIN_API}/${id}`, ({ request }) => {
      captured.calls.push(null)
      captured.authorization.push(request.headers.get('Authorization'))
      return new HttpResponse(null, { status: 204 })
    })
  )
  return captured
}

export function seedUploadPhoto(id: string, sha256: string): Captured<null> {
  const captured = capture<null>()
  server.use(
    http.post(`${PRODUCTS_ADMIN_API}/${id}/photo`, ({ request }) => {
      captured.calls.push(null)
      captured.authorization.push(request.headers.get('Authorization'))
      return HttpResponse.json({ sha256 }, { status: 201 })
    })
  )
  return captured
}

/** A refused write: `method` is the route's method and `path` what follows the product id. */
export function seedProductProblem(
  method: 'post' | 'put',
  path: string,
  status: number,
  problem: { type: string; detail: string }
): void {
  server.use(
    http[method](`${PRODUCTS_ADMIN_API}${path}`, () =>
      HttpResponse.json({ ...problem, status }, { status })
    )
  )
}

const FLAGS = { Merch: true }

export function renderAdminShopPage(): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(
    <Routes>
      <Route path={paths.adminShop.path} element={<AdminShopPage />} />
      <Route
        path={paths.adminShopProduct.path}
        element={<p data-testid={ADMIN_PRODUCT_PROBE} />}
      />
    </Routes>,
    { initialRoutes: [paths.adminShop.path], featureFlags: FLAGS }
  )
}

export function renderAdminShopProductPage(
  id: string
): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(
    <Routes>
      <Route
        path={paths.adminShopProduct.path}
        element={<AdminShopProductPage />}
      />
      <Route
        path={paths.adminShop.path}
        element={<p data-testid={ADMIN_PRODUCT_PROBE} />}
      />
    </Routes>,
    { initialRoutes: [paths.adminShopProduct.getHref(id)], featureFlags: FLAGS }
  )
}
