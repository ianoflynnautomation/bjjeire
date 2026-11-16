import { useState, type JSX } from 'react'
import { Button } from '@/components/ui/button/button'
import { SelectField } from '@/components/ui/form/select-field'
import { uiContent } from '@/config/ui-content'
import { MySignUpsTestIds } from '@/constants/registrationDataTestIds'
import type { RegistrationDto } from '@/types/registrations'
import { useEligibleDivisions } from '../hooks/useEligibleDivisions'
import {
  useCancelRegistration,
  useChangeDivision,
} from '../hooks/useRegistrationChanges'
import {
  cancellationOutcome,
  cancelWarning,
  isRefundable,
} from '../utils/cancellation-message'
import { divisionLabel } from '../utils/registration-format'
import {
  registrationActionMessage,
  registrationProblemMessage,
} from '../utils/registration-problem'

const { mine } = uiContent.registrations

interface RegistrationActionsProps {
  registration: RegistrationDto
  onNotice: (message: string) => void
  onError: (message: string | null) => void
}

type Mode = 'idle' | 'cancelling' | 'changing'

/**
 * Cancel and change division for one confirmed sign-up (User Story 4). The
 * competitor sees the refund outcome before confirming a cancellation, and the
 * division change is offered only while registration is open.
 */
export const RegistrationActions = function RegistrationActions({
  registration,
  onNotice,
  onError,
}: RegistrationActionsProps): JSX.Element | null {
  const [mode, setMode] = useState<Mode>('idle')
  const [divisionId, setDivisionId] = useState('')
  const cancel = useCancelRegistration()
  const change = useChangeDivision()
  const open = isRefundable(registration)
  const eligible = useEligibleDivisions(
    registration.competitionId,
    mode === 'changing'
  )

  if (registration.status !== 'CONFIRMED') {
    return null
  }

  const choices = (eligible.data ?? []).flatMap(division =>
    division.id && division.id !== registration.division?.id
      ? [{ value: division.id, label: divisionLabel(division) }]
      : []
  )

  function start(next: Mode): void {
    onError(null)
    setMode(next)
  }

  function confirmCancel(): void {
    cancel.mutate(registration.id, {
      onSuccess: outcome => {
        setMode('idle')
        onNotice(cancellationOutcome(outcome))
      },
      onError: failure => onError(registrationActionMessage(failure)),
    })
  }

  function saveDivision(): void {
    change.mutate(
      { registrationId: registration.id, divisionId },
      {
        onSuccess: () => {
          setMode('idle')
          setDivisionId('')
          onNotice(mine.changed)
        },
        onError: failure => onError(registrationActionMessage(failure)),
      }
    )
  }

  return (
    <div className="mt-2 space-y-2">
      {mode === 'idle' && (
        <div className="flex flex-wrap gap-2">
          {open && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => start('changing')}
              data-testid={MySignUpsTestIds.ROW_CHANGE}
            >
              {mine.changeDivision}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => start('cancelling')}
            data-testid={MySignUpsTestIds.ROW_CANCEL}
          >
            {mine.cancel}
          </Button>
        </div>
      )}
      {!open && (
        <p
          className="text-xs text-fg-subtle"
          data-testid={MySignUpsTestIds.CLOSED_NOTE}
        >
          {mine.closedContactOrganiser}
        </p>
      )}
      {mode === 'cancelling' && (
        <div
          role="alertdialog"
          aria-labelledby={`cancel-warning-${registration.id}`}
          className="space-y-2 rounded-lg p-3 ring-1 ring-danger-500"
        >
          <p
            id={`cancel-warning-${registration.id}`}
            className="text-sm text-fg"
            data-testid={MySignUpsTestIds.CANCEL_WARNING}
          >
            {cancelWarning(registration)}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={cancel.isPending}
              onClick={confirmCancel}
              className="bg-danger-600 hover:bg-danger-700 dark:bg-danger-600 dark:hover:bg-danger-700"
              data-testid={MySignUpsTestIds.CANCEL_CONFIRM}
            >
              {cancel.isPending ? mine.cancelling : mine.cancelConfirm}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={cancel.isPending}
              onClick={() => setMode('idle')}
              data-testid={MySignUpsTestIds.CANCEL_KEEP}
            >
              {mine.keep}
            </Button>
          </div>
        </div>
      )}
      {mode === 'changing' && (
        <div className="space-y-2 rounded-lg p-3 ring-1 ring-hairline">
          {eligible.isError && (
            <p className="text-sm text-fg-subtle">
              {registrationProblemMessage(eligible.error)}
            </p>
          )}
          {eligible.isSuccess && choices.length === 0 && (
            <p className="text-sm text-fg-subtle">{mine.changeDivisionNone}</p>
          )}
          {choices.length > 0 && (
            <SelectField
              id={`change-division-${registration.id}`}
              label={mine.changeDivisionLabel}
              placeholder={mine.changeDivisionLabel}
              value={divisionId}
              onChange={setDivisionId}
              options={choices}
              dataTestId={MySignUpsTestIds.CHANGE_SELECT}
            />
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={divisionId === '' || change.isPending}
              onClick={saveDivision}
              data-testid={MySignUpsTestIds.CHANGE_SAVE}
            >
              {mine.changeDivisionSave}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={change.isPending}
              onClick={() => setMode('idle')}
            >
              {mine.keep}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
