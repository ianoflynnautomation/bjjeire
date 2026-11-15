import { useEffect, useState, type JSX, type ReactNode } from 'react'
import { Button } from '@/components/ui/button/button'
import LoadingState from '@/components/ui/state/loading-state'
import { uiContent } from '@/config/ui-content'
import { TournamentAdminTestIds } from '@/constants/tournamentDataTestIds'
import { hasAdminSession, signInAdmin, usesLocalSignIn } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'

const { signIn } = uiContent.tournamentAdmin

type GateState = 'checking' | 'signedOut' | 'signingIn' | 'signedIn'

interface AdminSignInGateProps {
  children: ReactNode
}

/**
 * Shows the organiser screens only to someone signed in with the workforce
 * account. The API is what refuses everyone else (#5004); this keeps the
 * screens from loading data they cannot have.
 */
export const AdminSignInGate = function AdminSignInGate({
  children,
}: AdminSignInGateProps): JSX.Element {
  const [state, setState] = useState<GateState>('checking')
  const [failed, setFailed] = useState(false)

  useEffect((): (() => void) => {
    let active = true
    hasAdminSession()
      .then(signedIn => {
        if (active) {
          setState(signedIn ? 'signedIn' : 'signedOut')
        }
      })
      .catch((error: unknown) => {
        logger.warn('Organiser sign-in check failed', error)
        if (active) {
          setState('signedOut')
        }
      })
    return () => {
      active = false
    }
  }, [])

  async function handleSignIn(): Promise<void> {
    setFailed(false)
    setState('signingIn')
    try {
      const signedIn = await signInAdmin()
      setFailed(!signedIn)
      setState(signedIn ? 'signedIn' : 'signedOut')
    } catch (error) {
      logger.warn('Organiser sign-in did not complete', error)
      setFailed(true)
      setState('signedOut')
    }
  }

  if (state === 'checking') {
    return <LoadingState message={signIn.checking} />
  }
  if (state === 'signedIn') {
    return <>{children}</>
  }
  return (
    <section
      aria-labelledby="admin-sign-in-heading"
      className="mx-auto my-10 max-w-lg rounded-xl bg-surface-solid p-6 text-center shadow-card ring-1 ring-hairline"
      data-testid={TournamentAdminTestIds.SIGN_IN}
    >
      <h1 id="admin-sign-in-heading" className="text-lg font-bold text-fg">
        {signIn.heading}
      </h1>
      <p className="mt-1 text-sm text-fg-subtle">
        {usesLocalSignIn() ? signIn.localMessage : signIn.message}
      </p>
      {failed && (
        <p
          role="alert"
          className="mt-3 text-sm text-danger-600 dark:text-danger-400"
        >
          {signIn.failed}
        </p>
      )}
      <Button
        className="mt-6"
        onClick={() => void handleSignIn()}
        disabled={state === 'signingIn'}
        data-testid={TournamentAdminTestIds.SIGN_IN_BUTTON}
      >
        {signIn.button}
      </Button>
    </section>
  )
}
