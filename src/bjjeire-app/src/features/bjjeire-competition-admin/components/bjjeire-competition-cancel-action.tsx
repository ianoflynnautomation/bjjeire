import { useState, type JSX } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button/button'
import { uiContent } from '@/config/ui-content'
import { BjjEireCompetitionAdminCancelTestIds } from '@/constants/bjjEireCompetitionDataTestIds'
import type { BjjEireCompetitionDto } from '@/types/bjjeire-competitions'
import { cancelBjjEireCompetition } from '../api/bjjeire-competition-admin-api'
import {
  ADMIN_BJJEIRE_COMPETITIONS_KEY,
  adminRegistrationsKey,
} from '../api/query-keys'
import { problemMessage } from '../utils/problem-message'

const copy = uiContent.bjjEireCompetitionAdmin.cancelBjjEireCompetition

interface BjjEireCompetitionCancelActionProps {
  bjjEireCompetition: BjjEireCompetitionDto
  /** A cancelled competition with a refund Stripe refused: offer to try the refunds again. */
  hasFailedRefunds: boolean
}

/** Cancels the competition, refunding every confirmed sign-up, after a warning (#5026). */
export const BjjEireCompetitionCancelAction =
  function BjjEireCompetitionCancelAction({
    bjjEireCompetition,
    hasFailedRefunds,
  }: BjjEireCompetitionCancelActionProps): JSX.Element | null {
    const queryClient = useQueryClient()
    const [confirming, setConfirming] = useState(false)
    const [notice, setNotice] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const cancel = useMutation({
      mutationFn: () => cancelBjjEireCompetition(bjjEireCompetition.id),
      onSuccess: saved => {
        queryClient.setQueryData(['admin-bjjeire-competition', saved.id], saved)
        void queryClient.invalidateQueries({
          queryKey: ADMIN_BJJEIRE_COMPETITIONS_KEY,
        })
        void queryClient.invalidateQueries({
          queryKey: adminRegistrationsKey(saved.id),
        })
        setConfirming(false)
        setNotice(
          bjjEireCompetition.status === 'CANCELLED'
            ? copy.retried
            : copy.cancelled
        )
      },
      onError: failure => setError(problemMessage(failure)),
    })

    const cancellable =
      bjjEireCompetition.status === 'DRAFT' ||
      bjjEireCompetition.status === 'PUBLISHED'
    const retryable =
      bjjEireCompetition.status === 'CANCELLED' && hasFailedRefunds

    function run(): void {
      setError(null)
      setNotice(null)
      cancel.mutate()
    }

    return (
      <div className="space-y-3">
        {cancellable && !confirming && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setError(null)
              setConfirming(true)
            }}
            data-testid={BjjEireCompetitionAdminCancelTestIds.BUTTON}
          >
            {copy.button}
          </Button>
        )}
        {retryable && (
          <Button
            type="button"
            variant="outline"
            disabled={cancel.isPending}
            onClick={run}
            data-testid={BjjEireCompetitionAdminCancelTestIds.RETRY}
          >
            {copy.retry}
          </Button>
        )}
        {cancellable && confirming && (
          <div
            role="alertdialog"
            aria-labelledby="bjjeire-competition-cancel-warning"
            className="space-y-3 rounded-lg p-4 ring-1 ring-danger-500"
          >
            <p
              id="bjjeire-competition-cancel-warning"
              className="text-sm text-fg"
              data-testid={BjjEireCompetitionAdminCancelTestIds.WARNING}
            >
              {copy.warning}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                disabled={cancel.isPending}
                onClick={run}
                className="bg-danger-600 hover:bg-danger-700 dark:bg-danger-600 dark:hover:bg-danger-700"
                data-testid={BjjEireCompetitionAdminCancelTestIds.CONFIRM}
              >
                {cancel.isPending ? copy.cancelling : copy.confirm}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={cancel.isPending}
                onClick={() => setConfirming(false)}
                data-testid={BjjEireCompetitionAdminCancelTestIds.KEEP}
              >
                {copy.keep}
              </Button>
            </div>
          </div>
        )}
        {notice && (
          <p
            role="status"
            className="text-sm text-fg"
            data-testid={BjjEireCompetitionAdminCancelTestIds.NOTICE}
          >
            {notice}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="text-sm text-danger-600 dark:text-danger-400"
            data-testid={BjjEireCompetitionAdminCancelTestIds.ERROR}
          >
            {error}
          </p>
        )}
      </div>
    )
  }
