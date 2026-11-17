import { useState, type JSX } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button/button'
import { uiContent } from '@/config/ui-content'
import { BjjEireCompetitionAdminFinishTestIds as TestIds } from '@/constants/bjjEireCompetitionDataTestIds'
import { bjjEireCompetitionLeaderboardKey } from '@/features/bjjeire-competitions/hooks/useBjjEireCompetitionLeaderboard'
import type { BjjEireCompetitionDto } from '@/types/bjjeire-competitions'
import { finishBjjEireCompetition } from '../api/bjjeire-competition-admin-api'
import { ADMIN_BJJEIRE_COMPETITIONS_KEY } from '../api/query-keys'
import { problemMessage } from '../utils/problem-message'

const copy = uiContent.bjjEireCompetitionAdmin.finish

interface BjjEireCompetitionFinishActionProps {
  bjjEireCompetition: BjjEireCompetitionDto
}

/** Marks a published competition finished, which names the winners (#5041), after a warning. */
export const BjjEireCompetitionFinishAction =
  function BjjEireCompetitionFinishAction({
    bjjEireCompetition,
  }: BjjEireCompetitionFinishActionProps): JSX.Element {
    const queryClient = useQueryClient()
    const [confirming, setConfirming] = useState(false)
    const [notice, setNotice] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const finish = useMutation({
      mutationFn: () => finishBjjEireCompetition(bjjEireCompetition.id),
      onSuccess: saved => {
        queryClient.setQueryData(['admin-bjjeire-competition', saved.id], saved)
        void queryClient.invalidateQueries({
          queryKey: ADMIN_BJJEIRE_COMPETITIONS_KEY,
        })
        void queryClient.invalidateQueries({
          queryKey: bjjEireCompetitionLeaderboardKey(saved.id),
        })
        setConfirming(false)
        setNotice(copy.finished)
      },
      onError: failure => setError(problemMessage(failure)),
    })
    const finishable = bjjEireCompetition.status === 'PUBLISHED'

    return (
      <div className="space-y-3">
        {finishable && !confirming && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setError(null)
              setConfirming(true)
            }}
            data-testid={TestIds.BUTTON}
          >
            {copy.button}
          </Button>
        )}
        {finishable && confirming && (
          <div
            role="alertdialog"
            aria-labelledby="bjjeire-competition-finish-warning"
            className="space-y-3 rounded-lg p-4 ring-1 ring-hairline"
          >
            <p
              id="bjjeire-competition-finish-warning"
              className="text-sm text-fg"
              data-testid={TestIds.WARNING}
            >
              {copy.warning}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                disabled={finish.isPending}
                onClick={() => {
                  setError(null)
                  finish.mutate()
                }}
                data-testid={TestIds.CONFIRM}
              >
                {finish.isPending ? copy.finishing : copy.confirm}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={finish.isPending}
                onClick={() => setConfirming(false)}
                data-testid={TestIds.KEEP}
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
            data-testid={TestIds.NOTICE}
          >
            {notice}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="text-sm text-danger-600 dark:text-danger-400"
            data-testid={TestIds.ERROR}
          >
            {error}
          </p>
        )}
      </div>
    )
  }
