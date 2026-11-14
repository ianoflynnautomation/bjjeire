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
import { TournamentAdminTestIds } from '@/constants/tournamentDataTestIds'
import {
  getAdminTournament,
  publishTournament,
  updateTournament,
} from '@/features/tournament-admin/api/tournament-admin-api'
import { AdminSignInGate } from '@/features/tournament-admin/components/admin-sign-in-gate'
import { ADMIN_TOURNAMENTS_KEY } from '@/features/tournament-admin/api/query-keys'
import { TournamentForm } from '@/features/tournament-admin/components/tournament-form'
import { problemMessage } from '@/features/tournament-admin/utils/problem-message'
import { toFormValues } from '@/features/tournament-admin/utils/tournament-form'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { TournamentCommand, TournamentDto } from '@/types/tournaments'

const copy = uiContent.tournamentAdmin
const { statuses } = uiContent.tournaments

interface EditorProps {
  tournament: TournamentDto
}

const TournamentEditor = function TournamentEditor({
  tournament,
}: EditorProps): JSX.Element {
  const queryClient = useQueryClient()
  const [dirty, setDirty] = useState(false)
  // Remounts the form with the server's copy after each save, so new divisions carry their ids.
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function stored(saved: TournamentDto, message: string): void {
    queryClient.setQueryData(['admin-tournament', saved.id], saved)
    void queryClient.invalidateQueries({ queryKey: ADMIN_TOURNAMENTS_KEY })
    setDirty(false)
    setRevision(current => current + 1)
    setNotice(message)
  }

  const save = useMutation({
    // The version this copy was loaded at: a save from a stale tab is refused, not merged.
    mutationFn: (command: TournamentCommand) =>
      updateTournament(tournament.id, {
        ...command,
        version: tournament.version,
      }),
    onSuccess: saved => stored(saved, copy.edit.saved),
    onError: failure => setError(problemMessage(failure)),
  })
  const publish = useMutation({
    mutationFn: () => publishTournament(tournament.id),
    onSuccess: published => stored(published, copy.publish.published),
    onError: failure => setError(problemMessage(failure)),
  })

  const readOnly =
    tournament.status === 'CANCELLED' || tournament.status === 'FINISHED'
  let publishHint: string | null = null
  if (dirty) {
    publishHint = copy.publish.unsavedChanges
  } else if (tournament.divisions.length === 0) {
    publishHint = copy.publish.needsDivisions
  }

  const publishAction =
    tournament.status === 'DRAFT' ? (
      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant="outline"
          disabled={publishHint !== null || publish.isPending}
          aria-describedby={publishHint ? 'tournament-publish-hint' : undefined}
          onClick={() => {
            setError(null)
            setNotice(null)
            publish.mutate()
          }}
          data-testid={TournamentAdminTestIds.PUBLISH}
        >
          {publish.isPending ? copy.publish.publishing : copy.publish.button}
        </Button>
        {publishHint && (
          <p
            id="tournament-publish-hint"
            className="text-xs text-fg-subtle"
            data-testid={TournamentAdminTestIds.PUBLISH_HINT}
          >
            {publishHint}
          </p>
        )}
      </div>
    ) : null

  return (
    <div className="space-y-8">
      <Link
        to={paths.adminTournaments.getHref()}
        className="inline-block rounded-sm text-sm font-semibold text-primary-700 underline-offset-2 hover:underline dark:text-primary-300"
      >
        {`← ${copy.backToList}`}
      </Link>
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="display-expanded text-3xl font-bold text-fg">
          {`${copy.editTitlePrefix} ${tournament.name}`}
        </h1>
        <Badge
          text={statuses[tournament.status]}
          colorScheme={tournament.status === 'DRAFT' ? 'amber' : 'emerald'}
          data-testid={TournamentAdminTestIds.STATUS}
        />
        {tournament.status !== 'DRAFT' && (
          <Link
            to={paths.tournament.getHref(tournament.slug)}
            className="text-sm font-semibold text-primary-700 underline-offset-2 hover:underline dark:text-primary-300"
          >
            {copy.list.viewLink}
          </Link>
        )}
      </header>
      {readOnly && (
        <p className="text-sm text-fg-muted">{copy.edit.readOnly}</p>
      )}
      <TournamentForm
        key={revision}
        initialValues={toFormValues(tournament)}
        initialDivisions={tournament.divisions}
        existingVenue={tournament.venue}
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
    </div>
  )
}

const AdminTournament = function AdminTournament(): JSX.Element {
  const { id = '' } = useParams()
  const { data, error, refetch } = useQuery({
    queryKey: ['admin-tournament', id],
    queryFn: () => getAdminTournament(id),
    enabled: id !== '',
  })

  if (data) {
    return <TournamentEditor tournament={data} />
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

export default function AdminTournamentPage(): JSX.Element {
  useDocumentTitle(copy.documentTitle)
  return (
    <PageLayout>
      <AdminSignInGate>
        <AdminTournament />
      </AdminSignInGate>
    </PageLayout>
  )
}
