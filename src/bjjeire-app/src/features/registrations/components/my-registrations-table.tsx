import { useState, type JSX } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button/button'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { MySignUpsTestIds } from '@/constants/registrationDataTestIds'
import { formatEntryFee } from '@/features/tournaments/utils/tournament-format'
import { formatDate } from '@/utils/date-utils'
import { formatDublinDateTime } from '@/utils/dublin-time'
import type { RegistrationDto } from '@/types/registrations'
import { resumeCheckout } from '../api/registration-api'
import { useCheckoutRedirect } from '../hooks/useCheckoutRedirect'
import { divisionLabel } from '../utils/registration-format'
import { RegistrationActions } from './registration-actions'

const { mine } = uiContent.registrations

interface MyRegistrationsTableProps {
  registrations: RegistrationDto[]
}

const cellClass = 'px-3 py-3 align-top text-sm text-fg'
const headClass =
  'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-fg-subtle'

/** Every sign-up of the competitor with tournament, division, amount and status (#5021). */
export const MyRegistrationsTable = function MyRegistrationsTable({
  registrations,
}: MyRegistrationsTableProps): JSX.Element {
  const resume = useCheckoutRedirect(resumeCheckout)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  return (
    <div className="space-y-3">
      {notice && (
        <p
          role="status"
          className="rounded-lg bg-surface-solid p-3 text-sm text-fg ring-1 ring-hairline"
          data-testid={MySignUpsTestIds.NOTICE}
        >
          {notice}
        </p>
      )}
      {actionError && (
        <p
          role="alert"
          className="text-sm text-danger-600 dark:text-danger-400"
          data-testid={MySignUpsTestIds.ACTION_ERROR}
        >
          {actionError}
        </p>
      )}
      {resume.received && (
        <p
          role="status"
          className="rounded-lg bg-surface-solid p-3 text-sm text-fg ring-1 ring-hairline"
        >
          {resume.received}
        </p>
      )}
      {resume.error && (
        <p
          role="alert"
          className="text-sm text-danger-600 dark:text-danger-400"
        >
          {resume.error}
        </p>
      )}
      <div className="overflow-x-auto rounded-xl bg-surface-solid ring-1 ring-hairline">
        <table className="w-full" data-testid={MySignUpsTestIds.TABLE}>
          <thead className="border-b border-hairline">
            <tr>
              <th scope="col" className={headClass}>
                {mine.tournamentColumn}
              </th>
              <th scope="col" className={headClass}>
                {mine.divisionColumn}
              </th>
              <th scope="col" className={headClass}>
                {mine.amountColumn}
              </th>
              <th scope="col" className={headClass}>
                {mine.statusColumn}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {registrations.map(registration => (
              <tr key={registration.id} data-testid={MySignUpsTestIds.ROW}>
                <td
                  className={cellClass}
                  data-testid={MySignUpsTestIds.ROW_TOURNAMENT}
                >
                  {registration.tournamentSlug ? (
                    <Link
                      to={paths.tournament.getHref(registration.tournamentSlug)}
                      className="font-semibold text-primary-700 underline-offset-2 hover:underline dark:text-primary-300"
                    >
                      {registration.tournamentName}
                    </Link>
                  ) : (
                    registration.tournamentName
                  )}
                  {registration.tournamentDate && (
                    <span className="block text-fg-subtle">
                      {formatDate(registration.tournamentDate)}
                    </span>
                  )}
                </td>
                <td
                  className={cellClass}
                  data-testid={MySignUpsTestIds.ROW_DIVISION}
                >
                  {registration.division
                    ? divisionLabel(registration.division)
                    : mine.removedDivision}
                </td>
                <td
                  className={cellClass}
                  data-testid={MySignUpsTestIds.ROW_AMOUNT}
                >
                  {formatEntryFee(
                    registration.amountCents,
                    registration.currency ?? 'EUR'
                  )}
                </td>
                <td
                  className={cellClass}
                  data-testid={MySignUpsTestIds.ROW_STATUS}
                >
                  <span className="font-semibold">
                    {mine.statuses[registration.status]}
                  </span>
                  {registration.refundStatus && (
                    <span className="block text-fg-subtle">
                      {mine.refunds[registration.refundStatus]}
                    </span>
                  )}
                  {registration.status === 'AWAITING_PAYMENT' && (
                    <>
                      {registration.holdExpiresAt && (
                        <span className="block text-fg-subtle">
                          {`${mine.unpaidNote} ${formatDublinDateTime(registration.holdExpiresAt)}`}
                        </span>
                      )}
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => resume.start(registration.id)}
                        disabled={resume.isPending}
                        data-testid={MySignUpsTestIds.ROW_RESUME}
                      >
                        {mine.resume}
                      </Button>
                    </>
                  )}
                  <RegistrationActions
                    registration={registration}
                    onNotice={message => {
                      setActionError(null)
                      setNotice(message)
                    }}
                    onError={message => {
                      setNotice(null)
                      setActionError(message)
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
