import { useState, type JSX } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button/button'
import { SelectField } from '@/components/ui/form/select-field'
import { uiContent } from '@/config/ui-content'
import { TournamentAdminSignUpsTestIds } from '@/constants/tournamentDataTestIds'
import { divisionLabel } from '@/features/registrations/utils/registration-format'
import type { AdminRegistrationDto } from '@/types/registrations'
import type { DivisionDto } from '@/types/tournaments'
import {
  cancelTournamentRegistration,
  moveTournamentRegistration,
} from '../api/tournament-admin-api'
import { adminRegistrationsKey } from '../api/query-keys'
import { problemMessage } from '../utils/problem-message'

const copy = uiContent.tournamentAdmin.signUps

interface SignUpRowActionsProps {
  tournamentId: string
  registration: AdminRegistrationDto
  divisions: DivisionDto[]
  onNotice: (message: string) => void
  onError: (message: string | null) => void
}

type Mode = 'idle' | 'moving' | 'cancelling'

/** Move or cancel one confirmed sign-up (FR-007). */
export const SignUpRowActions = function SignUpRowActions({
  tournamentId,
  registration,
  divisions,
  onNotice,
  onError,
}: SignUpRowActionsProps): JSX.Element | null {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<Mode>('idle')
  const [divisionId, setDivisionId] = useState('')
  const [refund, setRefund] = useState(true)
  const id = registration.registrationId

  function done(message: string): void {
    setMode('idle')
    onNotice(message)
    void queryClient.invalidateQueries({
      queryKey: adminRegistrationsKey(tournamentId),
    })
  }

  const move = useMutation({
    mutationFn: () => moveTournamentRegistration(tournamentId, id, { divisionId }),
    onSuccess: () => done(copy.moved),
    onError: failure => onError(problemMessage(failure)),
  })
  const cancel = useMutation({
    mutationFn: () => cancelTournamentRegistration(tournamentId, id, { refund }),
    onSuccess: outcome =>
      done(outcome.refunded ? copy.cancelledRefunded : copy.cancelledNoRefund),
    onError: failure => onError(problemMessage(failure)),
  })

  if (registration.status !== 'CONFIRMED') {
    return null
  }
  const targets = divisions.flatMap(division =>
    division.id && division.id !== registration.division?.id
      ? [{ value: division.id, label: divisionLabel(division) }]
      : []
  )

  function start(next: Mode): void {
    onError(null)
    setMode(next)
  }

  return (
    <div className="space-y-2">
      {mode === 'idle' && (
        <div className="flex flex-wrap gap-2">
          {targets.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => start('moving')}
              data-testid={TournamentAdminSignUpsTestIds.ROW_MOVE}
            >
              {copy.move}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => start('cancelling')}
            data-testid={TournamentAdminSignUpsTestIds.ROW_CANCEL}
          >
            {copy.cancel}
          </Button>
        </div>
      )}
      {mode === 'moving' && (
        <div className="space-y-2">
          <SelectField
            id={`move-${id}`}
            label={copy.moveLabel}
            placeholder={copy.moveLabel}
            value={divisionId}
            onChange={setDivisionId}
            options={targets}
            dataTestId={TournamentAdminSignUpsTestIds.MOVE_SELECT}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={divisionId === '' || move.isPending}
              onClick={() => move.mutate()}
              data-testid={TournamentAdminSignUpsTestIds.MOVE_CONFIRM}
            >
              {copy.moveConfirm}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setMode('idle')}>
              {copy.keep}
            </Button>
          </div>
        </div>
      )}
      {mode === 'cancelling' && (
        <div
          role="alertdialog"
          aria-labelledby={`admin-cancel-${id}`}
          className="space-y-2 rounded-lg p-3 ring-1 ring-danger-500"
        >
          <p id={`admin-cancel-${id}`} className="text-sm text-fg">
            {copy.cancelWarning}
          </p>
          <label className="flex items-center gap-2 text-sm text-fg">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary-600"
              checked={refund}
              onChange={event => setRefund(event.target.checked)}
              data-testid={TournamentAdminSignUpsTestIds.CANCEL_REFUND}
            />
            {copy.refundLabel}
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate()}
              className="bg-danger-600 hover:bg-danger-700 dark:bg-danger-600 dark:hover:bg-danger-700"
              data-testid={TournamentAdminSignUpsTestIds.CANCEL_CONFIRM}
            >
              {copy.cancelConfirm}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setMode('idle')}>
              {copy.keep}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
