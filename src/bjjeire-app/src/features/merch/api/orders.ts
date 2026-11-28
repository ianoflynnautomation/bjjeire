import { api } from '@/lib/api-client'
import { API_RESOURCE_ROUTES } from '@/config/api-routes'
import type {
  CreateOrderCommand,
  OrderCheckoutDto,
  OrderDto,
  ShopDeliveryDto,
} from '@/types/orders'

/** Read with the key from the order's link; a wrong or missing key answers 404 (#6011). */
const ORDER_KEY_HEADER = 'X-Order-Key'

export const getDelivery = (): Promise<ShopDeliveryDto> =>
  api.get(`${API_RESOURCE_ROUTES.orders}/delivery`)

export const createOrder = (
  command: CreateOrderCommand
): Promise<OrderCheckoutDto> => api.post(API_RESOURCE_ROUTES.orders, command)

export const getOrder = (id: string, key: string): Promise<OrderDto> =>
  api.get(`${API_RESOURCE_ROUTES.orders}/${encodeURIComponent(id)}`, {
    headers: { [ORDER_KEY_HEADER]: key },
  })

export const resumeOrderCheckout = (
  id: string,
  key: string
): Promise<OrderCheckoutDto> =>
  api.post(
    `${API_RESOURCE_ROUTES.orders}/${encodeURIComponent(id)}/checkout`,
    undefined,
    { headers: { [ORDER_KEY_HEADER]: key } }
  )
