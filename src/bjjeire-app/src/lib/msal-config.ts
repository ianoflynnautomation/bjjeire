import { PublicClientApplication, type Configuration } from '@azure/msal-browser'
import { env } from '@/config/env'

const msalConfig: Configuration = {
  auth: {
    clientId: env.MSAL_CLIENT_ID,
    authority: env.MSAL_AUTHORITY,
    redirectUri: window.location.origin,
  },
  cache: { cacheLocation: 'sessionStorage' },
}

export const msalInstance = new PublicClientApplication(msalConfig)

export const loginRequest = {
  scopes: [env.MSAL_API_SCOPE],
}
