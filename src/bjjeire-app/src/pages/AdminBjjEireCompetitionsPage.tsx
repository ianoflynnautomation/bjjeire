import { useState, type JSX } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import PageLayout from '@/components/layout/page-layout'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { createBjjEireCompetition } from '@/features/bjjeire-competition-admin/api/bjjeire-competition-admin-api'
import { AdminSignInGate } from '@/features/bjjeire-competition-admin/components/admin-sign-in-gate'
import { ADMIN_BJJEIRE_COMPETITIONS_KEY } from '@/features/bjjeire-competition-admin/api/query-keys'
import { AdminBjjEireCompetitionList } from '@/features/bjjeire-competition-admin/components/admin-bjjeire-competition-list'
import { BjjEireCompetitionForm } from '@/features/bjjeire-competition-admin/components/bjjeire-competition-form'
import { problemMessage } from '@/features/bjjeire-competition-admin/utils/problem-message'
import { emptyBjjEireCompetitionForm } from '@/features/bjjeire-competition-admin/utils/bjjeire-competition-form'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const copy = uiContent.bjjEireCompetitionAdmin

const AdminBjjEireCompetitions =
  function AdminBjjEireCompetitions(): JSX.Element {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [error, setError] = useState<string | null>(null)
    const create = useMutation({
      mutationFn: createBjjEireCompetition,
      onSuccess: created => {
        void queryClient.invalidateQueries({
          queryKey: ADMIN_BJJEIRE_COMPETITIONS_KEY,
        })
        void navigate(paths.adminBjjEireCompetition.getHref(created.id))
      },
      onError: failure => setError(problemMessage(failure)),
    })

    return (
      <div className="space-y-10">
        <h1 className="display-expanded text-3xl font-bold text-fg">
          {copy.listTitle}
        </h1>
        <AdminBjjEireCompetitionList />
        <section
          aria-labelledby="create-bjjeire-competition-heading"
          className="space-y-4"
        >
          <h2
            id="create-bjjeire-competition-heading"
            className="text-xl font-bold text-fg"
          >
            {copy.create.heading}
          </h2>
          <BjjEireCompetitionForm
            initialValues={emptyBjjEireCompetitionForm()}
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

export default function AdminBjjEireCompetitionsPage(): JSX.Element {
  useDocumentTitle(copy.documentTitle)
  return (
    <PageLayout>
      <AdminSignInGate>
        <AdminBjjEireCompetitions />
      </AdminSignInGate>
    </PageLayout>
  )
}
