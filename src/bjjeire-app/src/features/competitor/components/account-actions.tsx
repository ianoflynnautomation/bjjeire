import { useState, type JSX } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button/button'
import { uiContent } from '@/config/ui-content'
import { CompetitorProfileTestIds } from '@/constants/competitorDataTestIds'
import { deleteOwnAccount } from '../api/competitor-api'
import {
  competitorProblemMessage,
  isActiveRegistrationConflict,
} from '../utils/problem-message'
import { useCompetitorSession } from '../hooks/useCompetitorSession'

const { account } = uiContent.competitor

/** Sign out, and delete the account after a confirmation (#5012). */
export const AccountActions = function AccountActions(): JSX.Element {
  const { signOut } = useCompetitorSession()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const remove = useMutation({
    mutationFn: deleteOwnAccount,
    onSuccess: () => signOut(),
    onError: failure =>
      setError(
        isActiveRegistrationConflict(failure)
          ? account.hasActiveRegistration
          : competitorProblemMessage(failure)
      ),
  })

  return (
    <section aria-labelledby="competitor-account-heading" className="space-y-4">
      <h2 id="competitor-account-heading" className="text-lg font-bold text-fg">
        {account.heading}
      </h2>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => void signOut()}
          data-testid={CompetitorProfileTestIds.SIGN_OUT}
        >
          {account.signOut}
        </Button>
        {!confirming && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setError(null)
              setConfirming(true)
            }}
            data-testid={CompetitorProfileTestIds.DELETE}
          >
            {account.delete}
          </Button>
        )}
      </div>
      {confirming && (
        <div
          role="alertdialog"
          aria-labelledby="competitor-delete-warning"
          className="space-y-3 rounded-lg p-4 ring-1 ring-danger-500"
        >
          <p id="competitor-delete-warning" className="text-sm text-fg">
            {account.deleteWarning}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
              className="bg-danger-600 hover:bg-danger-700 dark:bg-danger-600 dark:hover:bg-danger-700"
              data-testid={CompetitorProfileTestIds.DELETE_CONFIRM}
            >
              {remove.isPending ? account.deleting : account.deleteConfirm}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={remove.isPending}
              onClick={() => setConfirming(false)}
              data-testid={CompetitorProfileTestIds.DELETE_CANCEL}
            >
              {account.deleteCancel}
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="text-sm text-danger-600 dark:text-danger-400"
          data-testid={CompetitorProfileTestIds.DELETE_ERROR}
        >
          {error}
        </p>
      )}
    </section>
  )
}
