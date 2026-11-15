import { useEffect, useState, type JSX, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button/button'
import { FormField } from '@/components/ui/form/form-field'
import LoadingState from '@/components/ui/state/loading-state'
import { uiContent } from '@/config/ui-content'
import { CompetitorSignInTestIds } from '@/constants/competitorDataTestIds'
import {
  hasCompetitorSession,
  signInCompetitor,
  forgetCompetitor,
  signOutCompetitor,
  usesLocalCompetitorSignIn,
} from '@/lib/competitor-auth'
import { logger } from '@/lib/logger'
import { COMPETITOR_KEY } from '../api/query-keys'
import {
  CompetitorSessionContext,
  type CompetitorSession,
} from '../hooks/useCompetitorSession'

const { signIn } = uiContent.competitor

type GateState = 'checking' | 'signedOut' | 'signingIn' | 'signedIn'

interface CompetitorSignInGateProps {
  children: ReactNode
}

/**
 * Shows the competitor screens only to someone signed in with a competitor
 * account. Sign-in and registration both happen in the competitor tenant's
 * popup, over this page, so the visitor stays where they asked to go
 * (#5006, #5013). The API is what keeps the profile private (#5009).
 */
export const CompetitorSignInGate = function CompetitorSignInGate({
  children,
}: CompetitorSignInGateProps): JSX.Element {
  const queryClient = useQueryClient()
  const [state, setState] = useState<GateState>('checking')
  const [failed, setFailed] = useState(false)
  const [localEmail, setLocalEmail] = useState('')
  const [localEmailError, setLocalEmailError] = useState<string>()
  const local = usesLocalCompetitorSignIn()

  useEffect((): (() => void) => {
    let active = true
    hasCompetitorSession()
      .then(signedIn => {
        if (active) {
          setState(signedIn ? 'signedIn' : 'signedOut')
        }
      })
      .catch((error: unknown) => {
        logger.warn('Competitor sign-in check failed', error)
        if (active) {
          setState('signedOut')
        }
      })
    return () => {
      active = false
    }
  }, [])

  async function handleSignIn(): Promise<void> {
    if (local && !/^\S+@\S+\.\S+$/u.test(localEmail.trim())) {
      setLocalEmailError(signIn.localEmailInvalid)
      return
    }
    setLocalEmailError(undefined)
    setFailed(false)
    setState('signingIn')
    try {
      const signedIn = await signInCompetitor(localEmail.trim())
      setFailed(!signedIn)
      setState(signedIn ? 'signedIn' : 'signedOut')
    } catch (error) {
      logger.warn('Competitor sign-in did not complete', error)
      setFailed(true)
      setState('signedOut')
    }
  }

  const endSession = async (end: () => Promise<void>): Promise<void> => {
    try {
      await end()
    } finally {
      queryClient.removeQueries({ queryKey: COMPETITOR_KEY })
      setState((await hasCompetitorSession()) ? 'signedIn' : 'signedOut')
    }
  }

  const session: CompetitorSession = {
    signOut: () => endSession(signOutCompetitor),
    forget: () => endSession(forgetCompetitor),
  }

  if (state === 'checking') {
    return <LoadingState message={signIn.checking} />
  }
  if (state === 'signedIn') {
    return (
      <CompetitorSessionContext value={session}>
        {children}
      </CompetitorSessionContext>
    )
  }
  return (
    <section
      aria-labelledby="competitor-sign-in-heading"
      className="mx-auto my-10 max-w-lg rounded-xl bg-surface-solid p-6 text-center shadow-card ring-1 ring-hairline"
      data-testid={CompetitorSignInTestIds.ROOT}
    >
      <h1 id="competitor-sign-in-heading" className="text-lg font-bold text-fg">
        {signIn.heading}
      </h1>
      <p className="mt-1 text-sm text-fg-subtle">
        {local ? signIn.localMessage : signIn.message}
      </p>
      {local && (
        <div
          className="mt-4 text-left"
          data-testid={CompetitorSignInTestIds.EMAIL}
        >
          <FormField
            id="competitor-local-email"
            label={signIn.localEmailLabel}
            type="email"
            value={localEmail}
            onChange={setLocalEmail}
            error={localEmailError}
          />
        </div>
      )}
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
        data-testid={CompetitorSignInTestIds.BUTTON}
      >
        {signIn.button}
      </Button>
    </section>
  )
}
