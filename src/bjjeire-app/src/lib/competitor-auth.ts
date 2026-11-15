// The competitor's token, from the competitor tenant through MSAL, or in
// local development from the API's local competitor sign-in (ADR-0014).
// Kept apart from the organiser's session in `admin-auth.ts`: one person can
// hold both, and neither token is ever sent on the other's routes.
import { env } from '@/config/env'
import { API_ROUTES } from '@/config/api-routes'
import { logger } from '@/lib/logger'

export const LOCAL_COMPETITOR_SESSION_KEY = 'bjjeire.localCompetitorSession'

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
  const raw = sessionStorage.getItem(LOCAL_COMPETITOR_SESSION_KEY)
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
  sessionStorage.removeItem(LOCAL_COMPETITOR_SESSION_KEY)
  return null
}

async function signInLocally(email: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${env.API_URL}${API_ROUTES.localSignIn}/competitor`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }
    )
    if (!response.ok) {
      logger.warn('Local competitor sign-in refused', {
        status: response.status,
      })
      return false
    }
    const session: unknown = await response.json()
    if (!isLocalSession(session)) {
      return false
    }
    sessionStorage.setItem(
      LOCAL_COMPETITOR_SESSION_KEY,
      JSON.stringify(session)
    )
    return true
  } catch (error) {
    logger.warn('Local competitor sign-in failed', error)
    return false
  }
}

/** Whether `signInCompetitor` uses local sign-in, which needs a typed email. */
export function usesLocalCompetitorSignIn(): boolean {
  return env.LOCAL_SIGN_IN
}

/** Whether a competitor is signed in. */
export async function hasCompetitorSession(): Promise<boolean> {
  if (usesLocalCompetitorSignIn()) {
    return readLocalSession() !== null
  }
  // Loaded on demand: public pages never fetch MSAL.
  const { competitorMsalInstance } =
    await import('@/lib/competitor-msal-config')
  await competitorMsalInstance.initialize()
  return competitorMsalInstance.getAllAccounts().length > 0
}

/**
 * Signs the competitor in, or lets them register, in a popup over the page
 * they are on, so they return to it afterwards (#5006, #5013).
 * Resolves false when they are still signed out.
 *
 * @param localEmail who to sign in as; used only by local sign-in
 */
export async function signInCompetitor(localEmail = ''): Promise<boolean> {
  if (usesLocalCompetitorSignIn()) {
    return signInLocally(localEmail)
  }
  const { competitorMsalInstance, competitorLoginRequest } =
    await import('@/lib/competitor-msal-config')
  await competitorMsalInstance.initialize()
  await competitorMsalInstance.loginPopup(competitorLoginRequest)
  return competitorMsalInstance.getAllAccounts().length > 0
}

/** Signs the competitor out of this site and of the competitor tenant. */
export async function signOutCompetitor(): Promise<void> {
  if (usesLocalCompetitorSignIn()) {
    sessionStorage.removeItem(LOCAL_COMPETITOR_SESSION_KEY)
    return
  }
  const { competitorMsalInstance } =
    await import('@/lib/competitor-msal-config')
  await competitorMsalInstance.initialize()
  const accounts = competitorMsalInstance.getAllAccounts()
  if (accounts.length === 0) {
    return
  }
  await competitorMsalInstance.logoutPopup({
    account: accounts[0],
    mainWindowRedirectUri: globalThis.location.href,
  })
}

/**
 * Makes this site forget the signed-in competitor without opening a popup.
 * Used after the account is deleted: the identity is already gone, and a
 * popup opened after an await, not from a click, may be blocked (#5012).
 */
export async function forgetCompetitor(): Promise<void> {
  if (usesLocalCompetitorSignIn()) {
    sessionStorage.removeItem(LOCAL_COMPETITOR_SESSION_KEY)
    return
  }
  const { competitorMsalInstance } =
    await import('@/lib/competitor-msal-config')
  await competitorMsalInstance.initialize()
  const accounts = competitorMsalInstance.getAllAccounts()
  if (accounts.length === 0) {
    return
  }
  await competitorMsalInstance.clearCache({ account: accounts[0] })
}

/**
 * The competitor's bearer token, or null when nobody is signed in. Rejects
 * when an account exists but no token can be had, so a competitor request is
 * never sent unauthenticated by mistake.
 */
export async function getCompetitorToken(): Promise<string | null> {
  if (usesLocalCompetitorSignIn()) {
    return readLocalSession()?.accessToken ?? null
  }
  const { competitorMsalInstance, competitorLoginRequest } =
    await import('@/lib/competitor-msal-config')
  await competitorMsalInstance.initialize()
  const accounts = competitorMsalInstance.getAllAccounts()
  if (accounts.length === 0) {
    return null
  }
  const result = await competitorMsalInstance.acquireTokenSilent({
    ...competitorLoginRequest,
    account: accounts[0],
  })
  return result.accessToken
}
