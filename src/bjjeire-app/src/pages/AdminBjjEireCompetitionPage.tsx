import { useState, type JSX } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Link, useParams } from 'react-router'
import PageLayout from '@/components/layout/page-layout'
import { Badge } from '@/components/ui/badge/badge'
import { Button } from '@/components/ui/button/button'
import ErrorState from '@/components/ui/state/error-state'
import LoadingState from '@/components/ui/state/loading-state'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { BjjEireCompetitionAdminTestIds } from '@/constants/bjjEireCompetitionDataTestIds'
import {
  getAdminBjjEireCompetition,
  publishBjjEireCompetition,
  updateBjjEireCompetition,
} from '@/features/bjjeire-competition-admin/api/bjjeire-competition-admin-api'
import { AdminSignInGate } from '@/features/bjjeire-competition-admin/components/admin-sign-in-gate'
import { AdminSignUps } from '@/features/bjjeire-competition-admin/components/admin-sign-ups'
import { BjjEireCompetitionCancelAction } from '@/features/bjjeire-competition-admin/components/bjjeire-competition-cancel-action'
import { BjjEireCompetitionFinishAction } from '@/features/bjjeire-competition-admin/components/bjjeire-competition-finish-action'
import { DivisionResults } from '@/features/bjjeire-competition-admin/components/division-results'
import { useAdminRegistrations } from '@/features/bjjeire-competition-admin/hooks/useAdminRegistrations'
import { ADMIN_BJJEIRE_COMPETITIONS_KEY } from '@/features/bjjeire-competition-admin/api/query-keys'
import { BjjEireCompetitionForm } from '@/features/bjjeire-competition-admin/components/bjjeire-competition-form'
import { problemMessage } from '@/features/bjjeire-competition-admin/utils/problem-message'
import { toFormValues } from '@/features/bjjeire-competition-admin/utils/bjjeire-competition-form'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type {
  BjjEireCompetitionCommand,
  BjjEireCompetitionDto,
} from '@/types/bjjeire-competitions'

const copy = uiContent.bjjEireCompetitionAdmin
const { statuses } = uiContent.bjjEireCompetitions

interface EditorProps {
  bjjEireCompetition: BjjEireCompetitionDto
}

const BjjEireCompetitionEditor = function BjjEireCompetitionEditor({
  bjjEireCompetition,
}: EditorProps): JSX.Element {
  const queryClient = useQueryClient()
  const [dirty, setDirty] = useState(false)
  // Remounts the form with the server's copy after each save, so new divisions carry their ids.
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function stored(saved: BjjEireCompetitionDto, message: string): void {
    queryClient.setQueryData(['admin-bjjeire-competition', saved.id], saved)
    void queryClient.invalidateQueries({
      queryKey: ADMIN_BJJEIRE_COMPETITIONS_KEY,
    })
    setDirty(false)
    setRevision(current => current + 1)
    setNotice(message)
  }

  const save = useMutation({
    // The version this copy was loaded at: a save from a stale tab is refused, not merged.
    mutationFn: (command: BjjEireCompetitionCommand) =>
      updateBjjEireCompetition(bjjEireCompetition.id, {
        ...command,
        version: bjjEireCompetition.version,
      }),
    onSuccess: saved => stored(saved, copy.edit.saved),
    onError: failure => setError(problemMessage(failure)),
  })
  const publish = useMutation({
    mutationFn: () => publishBjjEireCompetition(bjjEireCompetition.id),
    onSuccess: published => stored(published, copy.publish.published),
    onError: failure => setError(problemMessage(failure)),
  })

  const readOnly =
    bjjEireCompetition.status === 'CANCELLED' ||
    bjjEireCompetition.status === 'FINISHED'
  // Shares the sign-up list's cache: a refund Stripe refused can be retried from here.
  const registrations = useAdminRegistrations(bjjEireCompetition.id)
  const hasFailedRefunds = (registrations.data ?? []).some(
    row => row.refundStatus === 'FAILED'
  )
  let publishHint: string | null = null
  if (dirty) {
    publishHint = copy.publish.unsavedChanges
  } else if (bjjEireCompetition.divisions.length === 0) {
    publishHint = copy.publish.needsDivisions
  }

  const publishAction =
    bjjEireCompetition.status === 'DRAFT' ? (
      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant="outline"
          disabled={publishHint !== null || publish.isPending}
          aria-describedby={
            publishHint ? 'bjjeire-competition-publish-hint' : undefined
          }
          onClick={() => {
            setError(null)
            setNotice(null)
            publish.mutate()
          }}
          data-testid={BjjEireCompetitionAdminTestIds.PUBLISH}
        >
          {publish.isPending ? copy.publish.publishing : copy.publish.button}
        </Button>
        {publishHint && (
          <p
            id="bjjeire-competition-publish-hint"
            className="text-xs text-fg-subtle"
            data-testid={BjjEireCompetitionAdminTestIds.PUBLISH_HINT}
          >
            {publishHint}
          </p>
        )}
      </div>
    ) : null

  return (
    <div className="space-y-8">
      <Link
        to={paths.adminBjjEireCompetitions.getHref()}
        className="inline-block rounded-sm text-sm font-semibold text-primary-700 underline-offset-2 hover:underline dark:text-primary-300"
      >
        {`← ${copy.backToList}`}
      </Link>
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="display-expanded text-3xl font-bold text-fg">
          {`${copy.editTitlePrefix} ${bjjEireCompetition.name}`}
        </h1>
        <Badge
          text={statuses[bjjEireCompetition.status]}
          colorScheme={
            bjjEireCompetition.status === 'DRAFT' ? 'amber' : 'emerald'
          }
          data-testid={BjjEireCompetitionAdminTestIds.STATUS}
        />
        {bjjEireCompetition.status !== 'DRAFT' && (
          <Link
            to={paths.bjjEireCompetition.getHref(bjjEireCompetition.slug)}
            className="text-sm font-semibold text-primary-700 underline-offset-2 hover:underline dark:text-primary-300"
          >
            {copy.list.viewLink}
          </Link>
        )}
      </header>
      {readOnly && (
        <p className="text-sm text-fg-muted">{copy.edit.readOnly}</p>
      )}
      <div className="flex flex-wrap items-start gap-3">
        <BjjEireCompetitionFinishAction
          bjjEireCompetition={bjjEireCompetition}
        />
        <BjjEireCompetitionCancelAction
          bjjEireCompetition={bjjEireCompetition}
          hasFailedRefunds={hasFailedRefunds}
        />
      </div>
      <BjjEireCompetitionForm
        key={revision}
        initialValues={toFormValues(bjjEireCompetition)}
        initialDivisions={bjjEireCompetition.divisions}
        existingVenue={bjjEireCompetition.venue}
        readOnly={readOnly}
        submitLabel={copy.edit.submit}
        savingLabel={copy.edit.saving}
        isSaving={save.isPending}
        error={error}
        notice={notice}
        onDirty={() => {
          setDirty(true)
          setNotice(null)
        }}
        onSubmit={command => {
          setError(null)
          setNotice(null)
          save.mutate(command)
        }}
        actions={publishAction}
      />
      {(bjjEireCompetition.status === 'PUBLISHED' ||
        bjjEireCompetition.status === 'FINISHED') && (
        <DivisionResults bjjEireCompetition={bjjEireCompetition} />
      )}
      {bjjEireCompetition.status !== 'DRAFT' && (
        <AdminSignUps bjjEireCompetition={bjjEireCompetition} />
      )}
    </div>
  )
}

const AdminBjjEireCompetition =
  function AdminBjjEireCompetition(): JSX.Element {
    const { id = '' } = useParams()
    const { data, error, refetch } = useQuery({
      queryKey: ['admin-bjjeire-competition', id],
      queryFn: () => getAdminBjjEireCompetition(id),
      enabled: id !== '',
    })

    if (data) {
      return <BjjEireCompetitionEditor bjjEireCompetition={data} />
    }
    if (isAxiosError(error) && error.response?.status === 404) {
      return (
        <p role="status" className="text-sm text-fg-muted">
          {copy.edit.notFound}
        </p>
      )
    }
    if (error) {
      return (
        <ErrorState
          message={copy.edit.loadFailed}
          onRetry={() => void refetch()}
        />
      )
    }
    return <LoadingState />
  }

export default function AdminBjjEireCompetitionPage(): JSX.Element {
  useDocumentTitle(copy.documentTitle)
  return (
    <PageLayout>
      <AdminSignInGate>
        <AdminBjjEireCompetition />
      </AdminSignInGate>
    </PageLayout>
  )
}
