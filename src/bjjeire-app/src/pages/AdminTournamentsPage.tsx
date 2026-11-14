import { useState, type JSX } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import PageLayout from '@/components/layout/page-layout'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { createTournament } from '@/features/tournament-admin/api/tournament-admin-api'
import { AdminSignInGate } from '@/features/tournament-admin/components/admin-sign-in-gate'
import { ADMIN_TOURNAMENTS_KEY } from '@/features/tournament-admin/api/query-keys'
import { AdminTournamentList } from '@/features/tournament-admin/components/admin-tournament-list'
import { TournamentForm } from '@/features/tournament-admin/components/tournament-form'
import { problemMessage } from '@/features/tournament-admin/utils/problem-message'
import { emptyTournamentForm } from '@/features/tournament-admin/utils/tournament-form'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const copy = uiContent.tournamentAdmin

const AdminTournaments = function AdminTournaments(): JSX.Element {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const create = useMutation({
    mutationFn: createTournament,
    onSuccess: created => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_TOURNAMENTS_KEY })
      void navigate(paths.adminTournament.getHref(created.id))
    },
    onError: failure => setError(problemMessage(failure)),
  })

  return (
    <div className="space-y-10">
      <h1 className="display-expanded text-3xl font-bold text-fg">
        {copy.listTitle}
      </h1>
      <AdminTournamentList />
      <section
        aria-labelledby="create-tournament-heading"
        className="space-y-4"
      >
        <h2
          id="create-tournament-heading"
          className="text-xl font-bold text-fg"
        >
          {copy.create.heading}
        </h2>
        <TournamentForm
          initialValues={emptyTournamentForm()}
          initialDivisions={[]}
          submitLabel={copy.create.submit}
          savingLabel={copy.create.saving}
          isSaving={create.isPending}
          error={error}
          onSubmit={command => {
            setError(null)
            create.mutate(command)
          }}
        />
      </section>
    </div>
  )
}

export default function AdminTournamentsPage(): JSX.Element {
  useDocumentTitle(copy.documentTitle)
  return (
    <PageLayout>
      <AdminSignInGate>
        <AdminTournaments />
      </AdminSignInGate>
    </PageLayout>
  )
}
