import type { components } from '@/types/generated/api'
import type {
  CreateOrderCommand,
  DeliveryAddressDto,
  OrderCheckoutDto,
  OrderDispatchDto,
  OrderDto,
  OrderLineCommand,
  OrderLineDto,
  ShopDeliveryDto,
} from '@/types/orders'

type Schemas = components['schemas']

// Exclude, not a mapped `true | never`: a key the SPA invents must fail the build.
type KeysArePublished<Frontend, Api> =
  Exclude<keyof Frontend, keyof Api> extends never ? true : never

type CreateKeys = KeysArePublished<
  CreateOrderCommand,
  Schemas['CreateOrderCommand']
>
type LineCommandKeys = KeysArePublished<
  OrderLineCommand,
  Schemas['OrderLineCommand']
>
type AddressKeys = KeysArePublished<
  DeliveryAddressDto,
  Schemas['DeliveryAddressDto']
>
type CheckoutKeys = KeysArePublished<
  OrderCheckoutDto,
  Schemas['OrderCheckoutDto']
>
type OrderKeys = KeysArePublished<OrderDto, Schemas['OrderDto']>
type LineKeys = KeysArePublished<OrderLineDto, Schemas['OrderLineDto']>
type DispatchKeys = KeysArePublished<
  OrderDispatchDto,
  Schemas['OrderDispatchDto']
>
type DeliveryKeys = KeysArePublished<
  ShopDeliveryDto,
  Schemas['ShopDeliveryDto']
>
type StatusValues =
  OrderDto['status'] extends NonNullable<Schemas['OrderDto']['status']>
    ? true
    : never
type RefundValues =
  NonNullable<OrderDto['refundStatus']> extends NonNullable<
    Schemas['OrderDto']['refundStatus']
  >
    ? true
    : never

// Separate checks. An intersection of `true` is redundant, and the lint fixer deletes it.
export const ordersContractOk = [
  true satisfies CreateKeys,
  true satisfies LineCommandKeys,
  true satisfies AddressKeys,
  true satisfies CheckoutKeys,
  true satisfies OrderKeys,
  true satisfies LineKeys,
  true satisfies DispatchKeys,
  true satisfies DeliveryKeys,
  true satisfies StatusValues,
  true satisfies RefundValues,
]
