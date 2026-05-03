export const API_VERSION = 'v1'
export const API_BASE_PATH = `/api/${API_VERSION}`

export const API_RESOURCE_ROUTES = {
  gyms: '/gym',
  bjjEvents: '/bjjevent',
  competitions: '/competition',
  stores: '/store',
  featureFlags: '/featureflag',
} as const

export const API_ROUTES = {
  gyms: `${API_BASE_PATH}${API_RESOURCE_ROUTES.gyms}`,
  bjjEvents: `${API_BASE_PATH}${API_RESOURCE_ROUTES.bjjEvents}`,
  competitions: `${API_BASE_PATH}${API_RESOURCE_ROUTES.competitions}`,
  stores: `${API_BASE_PATH}${API_RESOURCE_ROUTES.stores}`,
  featureFlags: `${API_BASE_PATH}${API_RESOURCE_ROUTES.featureFlags}`,
  donateBitcoinQr: `${API_BASE_PATH}/donate/bitcoin/qr`,
} as const
