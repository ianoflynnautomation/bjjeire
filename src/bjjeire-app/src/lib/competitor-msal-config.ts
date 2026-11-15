// The competitor tenant (Entra External ID, ADR-0012): a separate MSAL
// instance from the organiser's, with its own client id and authority.
// `VITE_APP_COMPETITOR_*` values are baked in at build time (ADR-0006).
import {
  PublicClientApplication,
  type Configuration,
} from '@azure/msal-browser'
import { env } from '@/config/env'

const competitorMsalConfig: Configuration = {
  auth: {
    clientId: env.COMPETITOR_CLIENT_ID,
    ...(env.COMPETITOR_AUTHORITY
      ? { authority: env.COMPETITOR_AUTHORITY }
      : {}),
    redirectUri: globalThis.location.origin,
  },
  cache: { cacheLocation: 'memoryStorage' },
}

export const competitorMsalInstance = new PublicClientApplication(
  competitorMsalConfig
)

export const competitorLoginRequest = {
  scopes: [env.COMPETITOR_SCOPE],
}
