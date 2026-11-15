import { createContext, use } from 'react'

export interface CompetitorSession {
  /** Signs out of the competitor tenant and shows the sign-in again. */
  signOut: () => Promise<void>
}

export const CompetitorSessionContext = createContext<CompetitorSession | null>(null)

/** The session of the competitor the gate let through. */
export function useCompetitorSession(): CompetitorSession {
  const session = use(CompetitorSessionContext)
  if (session === null) {
    throw new Error('useCompetitorSession is used outside CompetitorSignInGate')
  }
  return session
}
