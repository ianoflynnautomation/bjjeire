import { useState, type JSX } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button/button'
import { uiContent } from '@/config/ui-content'
import { TournamentAdminCancelTestIds } from '@/constants/tournamentDataTestIds'
import type { TournamentDto } from '@/types/tournaments'
import { cancelTournament } from '../api/tournament-admin-api'
import { ADMIN_TOURNAMENTS_KEY, adminRegistrationsKey } from '../api/query-keys'
import { problemMessage } from '../utils/problem-message'

const copy = uiContent.tournamentAdmin.cancelTournament

interface TournamentCancelActionProps {
  tournament: TournamentDto
  /** A cancelled tournament with a refund Stripe refused: offer to try the refunds again. */
  hasFailedRefunds: boolean
}

/** Cancels the tournament, refunding every confirmed sign-up, after a warning (#5026). */
export const TournamentCancelAction = function TournamentCancelAction({
  tournament,
  hasFailedRefunds,
}: TournamentCancelActionProps): JSX.Element | null {
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const cancel = useMutation({
    mutationFn: () => cancelTournament(tournament.id),
    onSuccess: saved => {
      queryClient.setQueryData(['admin-tournament', saved.id], saved)
      void queryClient.invalidateQueries({ queryKey: ADMIN_TOURNAMENTS_KEY })
      void queryClient.invalidateQueries({
        queryKey: adminRegistrationsKey(saved.id),
      })
      setConfirming(false)
      setNotice(
        tournament.status === 'CANCELLED' ? copy.retried : copy.cancelled
      )
    },
    onError: failure => setError(problemMessage(failure)),
  })

  const cancellable =
    tournament.status === 'DRAFT' || tournament.status === 'PUBLISHED'
  const retryable = tournament.status === 'CANCELLED' && hasFailedRefunds

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
          data-testid={TournamentAdminCancelTestIds.BUTTON}
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
          data-testid={TournamentAdminCancelTestIds.RETRY}
        >
          {copy.retry}
        </Button>
      )}
      {cancellable && confirming && (
        <div
          role="alertdialog"
          aria-labelledby="tournament-cancel-warning"
          className="space-y-3 rounded-lg p-4 ring-1 ring-danger-500"
        >
          <p
            id="tournament-cancel-warning"
            className="text-sm text-fg"
            data-testid={TournamentAdminCancelTestIds.WARNING}
          >
            {copy.warning}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={cancel.isPending}
              onClick={run}
              className="bg-danger-600 hover:bg-danger-700 dark:bg-danger-600 dark:hover:bg-danger-700"
              data-testid={TournamentAdminCancelTestIds.CONFIRM}
            >
              {cancel.isPending ? copy.cancelling : copy.confirm}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={cancel.isPending}
              onClick={() => setConfirming(false)}
              data-testid={TournamentAdminCancelTestIds.KEEP}
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
          data-testid={TournamentAdminCancelTestIds.NOTICE}
        >
          {notice}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="text-sm text-danger-600 dark:text-danger-400"
          data-testid={TournamentAdminCancelTestIds.ERROR}
        >
          {error}
        </p>
      )}
    </div>
  )
}
