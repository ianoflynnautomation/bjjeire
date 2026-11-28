import type {
  OrderCheckoutDto,
  OrderDto,
  ShopDeliveryDto,
} from '@/types/orders'

let _orderId = 0

export function resetOrderIdCounter(): void {
  _orderId = 0
}

function nextId(): string {
  _orderId += 1
  return `0000000000000000000a${_orderId.toString(16).padStart(4, '0')}`
}

export function createDelivery(
  overrides: Partial<ShopDeliveryDto> = {}
): ShopDeliveryDto {
  return {
    deliveryFeeCents: 650,
    currency: 'EUR',
    countries: ['IE', 'GB-NIR'],
    ...overrides,
  }
}

export function createOrderCheckout(
  overrides: Partial<OrderCheckoutDto> = {}
): OrderCheckoutDto {
  return {
    orderId: nextId(),
    orderKey: 'k3y-from-the-api',
    checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_shop_1',
    holdExpiresAt: '2026-11-23T10:30:00Z',
    totalCents: 9650,
    ...overrides,
  }
}

export function createOrder(overrides: Partial<OrderDto> = {}): OrderDto {
  return {
    id: nextId(),
    number: 'BJE-20261123-ABCDEF',
    status: 'CONFIRMED',
    lines: [
      {
        productId: '0000000000000000000000a1',
        productName: 'Harp Rashguard',
        kind: 'RASHGUARD',
        sizeId: 'M',
        quantity: 2,
        unitPriceCents: 4500,
        lineCents: 9000,
        photo: null,
      },
    ],
    itemsCents: 9000,
    deliveryCents: 650,
    totalCents: 9650,
    currency: 'EUR',
    email: 'aoife@example.test',
    address: {
      name: 'Aoife Byrne',
      line1: '1 Shop Street',
      line2: null,
      town: 'Galway',
      county: 'Galway',
      postcode: 'H91 E2K3',
      country: 'IE',
      phone: null,
    },
    createdAt: '2026-11-23T10:00:00Z',
    holdExpiresAt: null,
    paidAt: '2026-11-23T10:05:00Z',
    dispatch: null,
    refundStatus: null,
    ...overrides,
  }
}
