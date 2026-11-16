import { useState, type JSX } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button/button'
import Pagination from '@/components/ui/grid/pagination'
import ErrorState from '@/components/ui/state/error-state'
import LoadingState from '@/components/ui/state/loading-state'
import { uiContent } from '@/config/ui-content'
import { BjjEireCompetitionAdminSignUpsTestIds } from '@/constants/bjjEireCompetitionDataTestIds'
import { divisionLabel } from '@/features/registrations/utils/registration-format'
import { formatEntryFee } from '@/features/bjjeire-competitions/utils/bjjeire-competition-format'
import type { AdminRegistrationDto } from '@/types/registrations'
import type { BjjEireCompetitionDto } from '@/types/bjjeire-competitions'
import { exportBjjEireCompetitionRegistrations } from '../api/bjjeire-competition-admin-api'
import { useAdminRegistrations } from '../hooks/useAdminRegistrations'
import { downloadCsv } from '../utils/download-csv'
import { problemMessage } from '../utils/problem-message'
import { SignUpRowActions } from './sign-up-row-actions'
import { TeamMergeForm } from './team-merge-form'

const copy = uiContent.bjjEireCompetitionAdmin.signUps
const { statuses, refunds } = uiContent.registrations.mine
const { genders, belts } = uiContent.registrations

interface AdminSignUpsProps {
  bjjEireCompetition: BjjEireCompetitionDto
}

const cellClass = 'px-3 py-3 align-top text-sm text-fg'
const headClass =
  'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-fg-subtle'

/** Every sign-up of a competition with the organiser's tools (FR-006, FR-007). */
export const AdminSignUps = function AdminSignUps({
  bjjEireCompetition,
}: AdminSignUpsProps): JSX.Element {
  const list = useAdminRegistrations(bjjEireCompetition.id)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const exportCsv = useMutation({
    mutationFn: () =>
      exportBjjEireCompetitionRegistrations(bjjEireCompetition.id),
    onSuccess: csv =>
      downloadCsv(
        csv,
        `${copy.exportFilePrefix}${bjjEireCompetition.id}${copy.exportFileSuffix}`
      ),
    onError: failure =>
      setError(`${copy.exportFailed} ${problemMessage(failure)}`),
  })
  const rows: AdminRegistrationDto[] = list.data ?? []

  let body: JSX.Element
  if (list.isLoading) {
    body = <LoadingState />
  } else if (list.error) {
    body = (
      <ErrorState
        message={copy.loadFailed}
        onRetry={() => void list.refetch()}
      />
    )
  } else if (rows.length === 0) {
    body = (
      <p
        className="text-sm text-fg-subtle"
        data-testid={BjjEireCompetitionAdminSignUpsTestIds.EMPTY}
      >
        {copy.empty}
      </p>
    )
  } else {
    body = (
      <div className="overflow-x-auto rounded-xl bg-surface-solid ring-1 ring-hairline">
        <table
          className="w-full"
          data-testid={BjjEireCompetitionAdminSignUpsTestIds.TABLE}
        >
          <thead className="border-b border-hairline">
            <tr>
              <th scope="col" className={headClass}>
                {copy.nameColumn}
              </th>
              <th scope="col" className={headClass}>
                {copy.contactColumn}
              </th>
              <th scope="col" className={headClass}>
                {copy.teamColumn}
              </th>
              <th scope="col" className={headClass}>
                {copy.divisionColumn}
              </th>
              <th scope="col" className={headClass}>
                {copy.statusColumn}
              </th>
              <th scope="col" className={headClass}>
                {copy.actionsColumn}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {rows.map(row => (
              <tr
                key={row.registrationId}
                data-testid={BjjEireCompetitionAdminSignUpsTestIds.ROW}
              >
                <td
                  className={cellClass}
                  data-testid={BjjEireCompetitionAdminSignUpsTestIds.ROW_NAME}
                >
                  <span className="font-semibold">{row.displayName}</span>
                  {row.gender && row.belt && (
                    <span className="block text-fg-subtle">
                      {`${genders[row.gender]} · ${belts[row.belt]}`}
                    </span>
                  )}
                  {row.dateOfBirth && (
                    <span className="block text-fg-subtle">
                      {row.dateOfBirth}
                    </span>
                  )}
                </td>
                <td
                  className={cellClass}
                  data-testid={
                    BjjEireCompetitionAdminSignUpsTestIds.ROW_CONTACT
                  }
                >
                  {row.email}
                  {row.phone && (
                    <span className="block text-fg-subtle">{row.phone}</span>
                  )}
                </td>
                <td className={cellClass}>
                  {row.academy ?? copy.noAcademy}
                  {row.affiliation && (
                    <span className="block text-fg-subtle">
                      {row.affiliation}
                    </span>
                  )}
                </td>
                <td
                  className={cellClass}
                  data-testid={
                    BjjEireCompetitionAdminSignUpsTestIds.ROW_DIVISION
                  }
                >
                  {row.division
                    ? divisionLabel(row.division)
                    : copy.removedDivision}
                  {row.profileMismatch && (
                    <span
                      className="block font-semibold text-danger-600 dark:text-danger-400"
                      data-testid={
                        BjjEireCompetitionAdminSignUpsTestIds.ROW_MISMATCH
                      }
                    >
                      {copy.profileMismatch}
                    </span>
                  )}
                </td>
                <td
                  className={cellClass}
                  data-testid={BjjEireCompetitionAdminSignUpsTestIds.ROW_STATUS}
                >
                  <span className="font-semibold">{statuses[row.status]}</span>
                  <span className="block text-fg-subtle">
                    {formatEntryFee(row.amountCents, 'EUR')}
                    {row.paymentStatus &&
                      ` · ${copy.payments[row.paymentStatus]}`}
                  </span>
                  {row.refundStatus && (
                    <span className="block text-fg-subtle">
                      {refunds[row.refundStatus]}
                    </span>
                  )}
                  {row.paymentUnconfirmed && (
                    <span
                      className="block font-semibold text-danger-600 dark:text-danger-400"
                      data-testid={
                        BjjEireCompetitionAdminSignUpsTestIds.ROW_UNCONFIRMED
                      }
                    >
                      {copy.paymentUnconfirmed}
                    </span>
                  )}
                </td>
                <td className={cellClass}>
                  <SignUpRowActions
                    competitionId={bjjEireCompetition.id}
                    registration={row}
                    divisions={bjjEireCompetition.divisions}
                    onNotice={message => {
                      setError(null)
                      setNotice(message)
                    }}
                    onError={message => {
                      setNotice(null)
                      setError(message)
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <section
      aria-labelledby="admin-sign-ups-heading"
      className="space-y-4"
      data-testid={BjjEireCompetitionAdminSignUpsTestIds.ROOT}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="admin-sign-ups-heading" className="text-lg font-bold text-fg">
            {copy.heading}
          </h2>
          <p className="text-sm text-fg-subtle">{copy.intro}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={exportCsv.isPending}
          onClick={() => {
            setError(null)
            exportCsv.mutate()
          }}
          data-testid={BjjEireCompetitionAdminSignUpsTestIds.EXPORT}
        >
          {exportCsv.isPending ? copy.exporting : copy.export}
        </Button>
      </div>
      {notice && (
        <p
          role="status"
          className="text-sm text-fg"
          data-testid={BjjEireCompetitionAdminSignUpsTestIds.NOTICE}
        >
          {notice}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="text-sm text-danger-600 dark:text-danger-400"
          data-testid={BjjEireCompetitionAdminSignUpsTestIds.ERROR}
        >
          {error}
        </p>
      )}
      {body}
      {list.pagination && (
        <Pagination
          currentPage={list.currentPage}
          pagination={list.pagination}
          onPageChange={list.handlePageChange}
          data-testid={BjjEireCompetitionAdminSignUpsTestIds.PAGINATION}
        />
      )}
      {rows.length > 0 && (
        <TeamMergeForm
          competitionId={bjjEireCompetition.id}
          registrations={rows}
        />
      )}
    </section>
  )
}
