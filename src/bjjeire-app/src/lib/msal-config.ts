import {
  PublicClientApplication,
  type Configuration,
} from '@azure/msal-browser'
import { env } from '@/config/env'

const msalConfig: Configuration = {
  auth: {
    clientId: env.MSAL_CLIENT_ID,
    // Omit authority when no tenant is configured so MSAL falls back to
    // its default instead of receiving an invalid empty string
    ...(env.MSAL_TENANT_ID
      ? {
          authority: `https://login.microsoftonline.com/${env.MSAL_TENANT_ID}`,
        }
      : {}),
    redirectUri: globalThis.location.origin,
  },
  cache: { cacheLocation: 'memoryStorage' },
}

export const msalInstance = new PublicClientApplication(msalConfig)

export const loginRequest = {
  scopes: [env.MSAL_API_SCOPE],
}
