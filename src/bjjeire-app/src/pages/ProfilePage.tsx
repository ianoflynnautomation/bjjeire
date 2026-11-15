import { useState, type JSX } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import PageLayout from '@/components/layout/page-layout'
import ErrorState from '@/components/ui/state/error-state'
import LoadingState from '@/components/ui/state/loading-state'
import { uiContent } from '@/config/ui-content'
import { CompetitorProfileTestIds } from '@/constants/competitorDataTestIds'
import { saveOwnProfile } from '@/features/competitor/api/competitor-api'
import { OWN_PROFILE_KEY } from '@/features/competitor/api/query-keys'
import { AccountActions } from '@/features/competitor/components/account-actions'
import { CompetitorSignInGate } from '@/features/competitor/components/competitor-sign-in-gate'
import { MedalHistory } from '@/features/competitor/components/medal-history'
import { ProfileForm } from '@/features/competitor/components/profile-form'
import { useOwnProfile } from '@/features/competitor/hooks/useOwnProfile'
import {
  emptyProfileForm,
  profileFormFrom,
} from '@/features/competitor/utils/profile-form'
import { competitorProblemMessage } from '@/features/competitor/utils/problem-message'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const { profile } = uiContent.competitor

const Profile = function Profile(): JSX.Element {
  const queryClient = useQueryClient()
  const own = useOwnProfile()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)
  const save = useMutation({
    mutationFn: saveOwnProfile,
    onSuccess: saved => {
      queryClient.setQueryData(OWN_PROFILE_KEY, saved)
      setSavedCount(count => count + 1)
      setNotice(profile.saved)
    },
    onError: failure => setError(competitorProblemMessage(failure)),
  })

  if (own.isPending) {
    return <LoadingState />
  }
  if (own.isError) {
    return (
      <ErrorState
        message={profile.loadFailed}
        onRetry={() => void own.refetch()}
      />
    )
  }

  const existing = own.data
  return (
    <div className="space-y-10" data-testid={CompetitorProfileTestIds.ROOT}>
      <header className="space-y-2">
        <h1 className="display-expanded text-3xl font-bold text-fg">
          {existing ? profile.heading : profile.createHeading}
        </h1>
        <p className="text-sm text-fg-subtle">{profile.intro}</p>
        {existing?.email && (
          <p className="text-sm text-fg-muted" data-testid={CompetitorProfileTestIds.EMAIL}>
            {profile.emailLabel} {existing.email}
          </p>
        )}
        {existing && !existing.profileComplete && (
          <p
            className="rounded-lg border border-danger-500/25 bg-danger-50 p-3 text-sm text-danger-700 dark:bg-danger-950/50 dark:text-danger-300"
            data-testid={CompetitorProfileTestIds.INCOMPLETE}
          >
            {profile.incomplete}
          </p>
        )}
      </header>
      <ProfileForm
        // A fresh form after each save, so it shows what the API stored (trimmed, gym name).
        key={existing ? `saved-${savedCount}` : 'new'}
        initialValues={existing ? profileFormFrom(existing) : emptyProfileForm()}
        isSaving={save.isPending}
        error={error}
        notice={notice}
        onSubmit={command => {
          setError(null)
          setNotice(null)
          save.mutate(command)
        }}
      />
      <MedalHistory />
      <AccountActions />
    </div>
  )
}

export default function ProfilePage(): JSX.Element {
  useDocumentTitle(uiContent.competitor.documentTitle)
  return (
    <PageLayout>
      <CompetitorSignInGate>
        <Profile />
      </CompetitorSignInGate>
    </PageLayout>
  )
}
