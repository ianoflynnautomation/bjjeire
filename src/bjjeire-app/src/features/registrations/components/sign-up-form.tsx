import { useState, type JSX, type SubmitEvent } from 'react'
import { Button } from '@/components/ui/button/button'
import { uiContent } from '@/config/ui-content'
import { SignUpPageTestIds } from '@/constants/registrationDataTestIds'
import { formatEntryFee } from '@/features/tournaments/utils/tournament-format'
import type { DivisionDto, TournamentDto } from '@/types/tournaments'
import { divisionLabel } from '../utils/registration-format'

const { signUp } = uiContent.registrations

interface SignUpFormProps {
  tournament: TournamentDto
  divisions: DivisionDto[]
  isSubmitting: boolean
  error: string | null
  onSubmit: (divisionId: string) => void
}

const panelClass =
  'space-y-3 rounded-xl bg-surface-solid p-5 ring-1 ring-hairline sm:px-7'
const checkClass =
  'mt-0.5 h-4 w-4 shrink-0 rounded border-border-strong text-primary-700 focus-visible:ring-2 focus-visible:ring-ring-focus'

/**
 * Division choice, the fee, and the two consents a competitor gives before
 * paying (FR-012, FR-018). The fee shown is the tournament's; the API charges
 * the same and never takes an amount from the browser.
 */
export const SignUpForm = function SignUpForm({
  tournament,
  divisions,
  isSubmitting,
  error,
  onSubmit,
}: SignUpFormProps): JSX.Element {
  const [divisionId, setDivisionId] = useState<string>('')
  const [acceptListing, setAcceptListing] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (divisionId === '') {
      setLocalError(signUp.divisionRequired)
      return
    }
    if (!acceptListing || !acceptTerms) {
      setLocalError(signUp.consentsRequired)
      return
    }
    setLocalError(null)
    onSubmit(divisionId)
  }

  const shownError = localError ?? error

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <fieldset className={panelClass}>
        <legend className="text-lg font-bold text-fg">
          {signUp.divisionsLegend}
        </legend>
        <p className="text-sm text-fg-subtle">{signUp.divisionsHint}</p>
        <ul className="space-y-2">
          {divisions.map(division => {
            const id = `sign-up-division-${division.id ?? ''}`
            return (
              <li
                key={division.id}
                data-testid={SignUpPageTestIds.DIVISION_OPTION}
              >
                <label
                  htmlFor={id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg p-3 ring-1 ring-hairline hover:bg-muted has-checked:ring-2 has-checked:ring-primary-600"
                >
                  <input
                    id={id}
                    type="radio"
                    name="division"
                    value={division.id}
                    checked={divisionId === division.id}
                    onChange={() => setDivisionId(division.id ?? '')}
                    className="h-4 w-4 text-primary-700 focus-visible:ring-2 focus-visible:ring-ring-focus"
                  />
                  <span className="text-sm text-fg">
                    {divisionLabel(division)}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      </fieldset>

      <section className={panelClass} aria-labelledby="sign-up-fee-heading">
        <h2
          id="sign-up-fee-heading"
          className="text-sm font-semibold text-fg-subtle"
        >
          {signUp.feeLabel}
        </h2>
        <p
          className="text-2xl font-bold text-fg"
          data-testid={SignUpPageTestIds.FEE}
        >
          {formatEntryFee(tournament.entryFeeCents, tournament.currency)}
        </p>
        <p className="text-sm text-fg-subtle">{signUp.feeNote}</p>
      </section>

      <fieldset className={panelClass}>
        <legend className="text-lg font-bold text-fg">
          {signUp.consentsLegend}
        </legend>
        <label className="flex items-start gap-3 text-sm text-fg">
          <input
            type="checkbox"
            checked={acceptListing}
            onChange={event => setAcceptListing(event.target.checked)}
            className={checkClass}
            data-testid={SignUpPageTestIds.ACCEPT_LISTING}
          />
          <span>{signUp.acceptPublicListing}</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-fg">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={event => setAcceptTerms(event.target.checked)}
            className={checkClass}
            data-testid={SignUpPageTestIds.ACCEPT_TERMS}
          />
          <span>{signUp.acceptTerms}</span>
        </label>
      </fieldset>

      {shownError && (
        <p
          role="alert"
          className="rounded-lg border border-danger-500/25 bg-danger-50 p-3 text-sm text-danger-700 dark:bg-danger-950/50 dark:text-danger-300"
          data-testid={SignUpPageTestIds.FORM_ERROR}
        >
          {shownError}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        data-testid={SignUpPageTestIds.SUBMIT}
      >
        {isSubmitting ? signUp.submitting : signUp.submit}
      </Button>
    </form>
  )
}
