// The organiser's token, from Entra through MSAL, or in local development from
// the API's local sign-in (ADR-0014). `VITE_APP_LOCAL_SIGN_IN` is baked in at
// build time (ADR-0006) and set only by the local compose override. A build
// that has it by mistake still gets nothing: only the local API issues tokens.
import { env } from '@/config/env'
import { API_ROUTES } from '@/config/api-routes'
import { logger } from '@/lib/logger'

export const LOCAL_SESSION_KEY = 'bjjeire.localOrganiserSession'

interface LocalSession {
  accessToken: string
  expiresAt: string
}

function isLocalSession(value: unknown): value is LocalSession {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const { accessToken, expiresAt } = value as Record<string, unknown>
  return typeof accessToken === 'string' && typeof expiresAt === 'string'
}

function readLocalSession(): LocalSession | null {
  const raw = sessionStorage.getItem(LOCAL_SESSION_KEY)
  if (raw === null) {
    return null
  }
  try {
    const session: unknown = JSON.parse(raw)
    if (isLocalSession(session) && Date.parse(session.expiresAt) > Date.now()) {
      return session
    }
  } catch {
    // Unreadable: treat as signed out.
  }
  sessionStorage.removeItem(LOCAL_SESSION_KEY)
  return null
}

async function signInLocally(): Promise<boolean> {
  try {
    const response = await fetch(`${env.API_URL}${API_ROUTES.localSignIn}`, {
      method: 'POST',
    })
    if (!response.ok) {
      logger.warn('Local sign-in refused', { status: response.status })
      return false
    }
    const session: unknown = await response.json()
    if (!isLocalSession(session)) {
      return false
    }
    sessionStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session))
    return true
  } catch (error) {
    logger.warn('Local sign-in failed', error)
    return false
  }
}

/** Whether `signInAdmin` uses local sign-in rather than Microsoft. */
export function usesLocalSignIn(): boolean {
  return env.LOCAL_SIGN_IN
}

/** Whether an organiser is signed in. */
export async function hasAdminSession(): Promise<boolean> {
  if (usesLocalSignIn()) {
    return readLocalSession() !== null
  }
  // Loaded on demand: public pages never fetch MSAL.
  const { msalInstance } = await import('@/lib/msal-config')
  await msalInstance.initialize()
  return msalInstance.getAllAccounts().length > 0
}

/** Signs the organiser in. Resolves false when they are still signed out. */
export async function signInAdmin(): Promise<boolean> {
  if (usesLocalSignIn()) {
    return signInLocally()
  }
  const { msalInstance, loginRequest } = await import('@/lib/msal-config')
  await msalInstance.initialize()
  await msalInstance.loginPopup(loginRequest)
  return msalInstance.getAllAccounts().length > 0
}

/**
 * The organiser's bearer token, or null when nobody is signed in.
 * Rejects when a Microsoft session exists but no token can be had, so a write
 * is never sent unauthenticated by mistake.
 */
export async function getAdminToken(): Promise<string | null> {
  if (usesLocalSignIn()) {
    return readLocalSession()?.accessToken ?? null
  }
  const { msalInstance, loginRequest } = await import('@/lib/msal-config')
  await msalInstance.initialize()
  const accounts = msalInstance.getAllAccounts()
  if (accounts.length === 0) {
    return null
  }
  const result = await msalInstance.acquireTokenSilent({
    ...loginRequest,
    account: accounts[0],
  })
  return result.accessToken
}
