// BJJ Éire merch guest orders (specs/stc/shop/contract.yaml). Enum values are
// UPPER_SNAKE, as the API publishes them (ADR-0016).
import type { ProductKind, SizeId } from './products'

export type OrderStatus =
  'AWAITING_PAYMENT' | 'CONFIRMED' | 'DISPATCHED' | 'EXPIRED' | 'REFUNDED'

export type OrderRefundStatus = 'PENDING' | 'REFUNDED' | 'FAILED'

export type BasketChangeReason = 'SOLD_OUT' | 'PRICE_CHANGED' | 'UNAVAILABLE'

/** Where BJJ Éire delivers: Ireland, and Northern Ireland as GB with a BT postcode. */
export type DeliveryCountry = 'IE' | 'GB'

export interface DeliveryAddressDto {
  name: string
  line1: string
  line2?: string | null
  town: string
  county: string
  postcode?: string | null
  country: string
  phone?: string | null
}

export interface OrderLineCommand {
  productId: string
  sizeId: SizeId
  quantity: number
  /** The price the shopper was shown; a different current price is refused (#6010). */
  unitPriceCents: number
}

export interface CreateOrderCommand {
  lines: OrderLineCommand[]
  email: string
  address: DeliveryAddressDto
  /** The delivery fee the shopper was shown. */
  deliveryCents: number
  acceptTerms: boolean
}

export interface OrderCheckoutDto {
  orderId: string
  /** Returned once, when the order is made. */
  orderKey?: string | null
  checkoutUrl: string
  holdExpiresAt: string
  totalCents: number
}

export interface OrderLineDto {
  productId: string
  productName: string
  kind: ProductKind
  sizeId: SizeId
  quantity: number
  unitPriceCents: number
  lineCents: number
  photo?: string | null
}

export interface OrderDispatchDto {
  dispatchedAt: string
  trackingReference?: string | null
}

export interface OrderDto {
  id: string
  number: string
  status: OrderStatus
  lines: OrderLineDto[]
  itemsCents: number
  deliveryCents: number
  totalCents: number
  currency: string
  email: string
  address: DeliveryAddressDto
  createdAt: string
  holdExpiresAt?: string | null
  paidAt?: string | null
  dispatch?: OrderDispatchDto | null
  refundStatus?: OrderRefundStatus | null
}

export interface ShopDeliveryDto {
  deliveryFeeCents: number
  currency: string
  countries: string[]
}

/** One line listed in a 409 basket-changed problem. */
export interface BasketChangeDto {
  productId: string
  sizeId: SizeId
  reason: BasketChangeReason
  nowAvailable?: number | null
  nowPriceCents?: number | null
}
