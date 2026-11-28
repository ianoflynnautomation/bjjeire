import { http, HttpResponse, type JsonBodyType } from 'msw'
import { Route, Routes } from 'react-router'
import { API_ROUTES } from '@/config/api-routes'
import { paths } from '@/config/paths'
import { server } from '@/testing/msw/server'
import { renderWithProviders } from '@/testing/render-utils'
import { testApiUrl } from '@/testing/seed-helpers'
import { createPaginatedProducts } from '@/testing/factories/product.factory'
import { createDelivery } from '@/testing/factories/order.factory'
import type {
  CreateOrderCommand,
  OrderCheckoutDto,
  OrderDto,
} from '@/types/orders'
import type { ProductDto, ProductSummaryDto } from '@/types/products'
import BasketPage from '@/pages/BasketPage'
import CheckoutPage from '@/pages/CheckoutPage'
import OrderPage from '@/pages/OrderPage'
import ProductPage from '@/pages/ProductPage'
import { PRODUCTS_API } from './merch-test-helpers'

export const ORDERS_API = testApiUrl(API_ROUTES.orders)

function summaryOf(product: ProductDto): ProductSummaryDto {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    kind: product.kind,
    priceCents: product.priceCents,
    currency: product.currency,
    photo: product.photos[0] ?? null,
    soldOut: product.soldOut,
  }
}

/** The published catalogue the basket reads its names, prices and availability from. */
export function seedCatalogue(products: ProductDto[]): void {
  server.use(
    http.get(PRODUCTS_API, () =>
      HttpResponse.json(createPaginatedProducts(products.map(summaryOf), 1, 1))
    ),
    ...products.map(product =>
      http.get(`${PRODUCTS_API}/${product.slug}`, () =>
        HttpResponse.json(product)
      )
    )
  )
}

export function seedDelivery(deliveryFeeCents = 650): void {
  server.use(
    http.get(`${ORDERS_API}/delivery`, () =>
      HttpResponse.json(createDelivery({ deliveryFeeCents }))
    )
  )
}

/** Answers POST /order; returns what each request sent and its headers. */
export function captureCreateOrder(
  respond: () => { status: number; body: JsonBodyType }
): {
  bodies: () => CreateOrderCommand[]
  authorizations: () => (string | null)[]
} {
  const bodies: CreateOrderCommand[] = []
  const authorizations: (string | null)[] = []
  server.use(
    http.post(ORDERS_API, async ({ request }) => {
      bodies.push((await request.json()) as CreateOrderCommand)
      authorizations.push(request.headers.get('Authorization'))
      const { status, body } = respond()
      return HttpResponse.json(body, { status })
    })
  )
  return {
    bodies: (): CreateOrderCommand[] => bodies,
    authorizations: (): (string | null)[] => authorizations,
  }
}

export function orderCreated(
  checkout: OrderCheckoutDto
): () => { status: number; body: JsonBodyType } {
  return () => ({ status: 201, body: { ...checkout } })
}

export function problem(
  status: number,
  type: string,
  extra: Record<string, JsonBodyType> = {}
): () => { status: number; body: JsonBodyType } {
  return () => ({
    status,
    body: { type, title: 'Conflict', status, detail: 'Refused.', ...extra },
  })
}

/**
 * Answers GET /order/{id} only when X-Order-Key is {@code key}; 404 otherwise,
 * as the API does. Successive reads return the orders in turn, then the last.
 */
export function seedOrder(
  key: string,
  ...orders: OrderDto[]
): { reads: () => number; keys: () => (string | null)[] } {
  const keys: (string | null)[] = []
  const id = orders[0]?.id ?? ''
  server.use(
    http.get(`${ORDERS_API}/${id}`, ({ request }) => {
      const sent = request.headers.get('X-Order-Key')
      keys.push(sent)
      if (sent !== key) {
        return HttpResponse.json(
          { type: 'urn:bjjeire:not-found', title: 'Resource Not Found' },
          { status: 404 }
        )
      }
      const order = orders[Math.min(keys.length - 1, orders.length - 1)]
      return HttpResponse.json({ ...order })
    })
  )
  return {
    reads: (): number => keys.length,
    keys: (): (string | null)[] => keys,
  }
}

/** Answers POST /order/{id}/checkout. */
export function captureResumeCheckout(
  id: string,
  respond: () => { status: number; body: JsonBodyType }
): { keys: () => (string | null)[] } {
  const keys: (string | null)[] = []
  server.use(
    http.post(`${ORDERS_API}/${id}/checkout`, ({ request }) => {
      keys.push(request.headers.get('X-Order-Key'))
      const { status, body } = respond()
      return HttpResponse.json(body, { status })
    })
  )
  return { keys: (): (string | null)[] => keys }
}

/** The shop's guest pages, as the app routes them, with merch switched on. */
export function renderShopRoute(
  route: string
): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(
    <Routes>
      <Route path={paths.product.path} element={<ProductPage />} />
      <Route path={paths.basket.path} element={<BasketPage />} />
      <Route path={paths.checkout.path} element={<CheckoutPage />} />
      <Route path={paths.order.path} element={<OrderPage />} />
      <Route path={paths.shop.path} element={<p>Shop</p>} />
    </Routes>,
    { initialRoutes: [route], featureFlags: { Merch: true } }
  )
}
