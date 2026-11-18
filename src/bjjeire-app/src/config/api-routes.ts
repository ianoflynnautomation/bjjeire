export const API_VERSION = 'v1'
export const API_BASE_PATH = `/api/${API_VERSION}`

export const API_RESOURCE_ROUTES = {
  gyms: '/gym',
  bjjEvents: '/bjjevent',
  competitions: '/competition',
  stores: '/store',
  featureFlags: '/featureflag',
  bjjEireCompetitions: '/bjjeire-competition',
  bjjEireCompetitionsAdmin: '/bjjeire-competition/admin',
  competitor: '/competitor',
  registration: '/registration',
  localSignIn: '/local-sign-in',
  products: '/product',
  productsAdmin: '/product/admin',
  orders: '/order',
  ordersAdmin: '/order/admin',
} as const

export const API_ROUTES = {
  gyms: `${API_BASE_PATH}${API_RESOURCE_ROUTES.gyms}`,
  bjjEvents: `${API_BASE_PATH}${API_RESOURCE_ROUTES.bjjEvents}`,
  competitions: `${API_BASE_PATH}${API_RESOURCE_ROUTES.competitions}`,
  stores: `${API_BASE_PATH}${API_RESOURCE_ROUTES.stores}`,
  featureFlags: `${API_BASE_PATH}${API_RESOURCE_ROUTES.featureFlags}`,
  bjjEireCompetitions: `${API_BASE_PATH}${API_RESOURCE_ROUTES.bjjEireCompetitions}`,
  bjjEireCompetitionsAdmin: `${API_BASE_PATH}${API_RESOURCE_ROUTES.bjjEireCompetitionsAdmin}`,
  competitor: `${API_BASE_PATH}${API_RESOURCE_ROUTES.competitor}`,
  registration: `${API_BASE_PATH}${API_RESOURCE_ROUTES.registration}`,
  localSignIn: `${API_BASE_PATH}${API_RESOURCE_ROUTES.localSignIn}`,
  products: `${API_BASE_PATH}${API_RESOURCE_ROUTES.products}`,
  productsAdmin: `${API_BASE_PATH}${API_RESOURCE_ROUTES.productsAdmin}`,
  orders: `${API_BASE_PATH}${API_RESOURCE_ROUTES.orders}`,
  ordersAdmin: `${API_BASE_PATH}${API_RESOURCE_ROUTES.ordersAdmin}`,
  donateBitcoinQr: `${API_BASE_PATH}/donate/bitcoin/qr`,
} as const
