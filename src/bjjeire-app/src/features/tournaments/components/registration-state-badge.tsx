import type { JSX } from 'react'
import { Badge } from '@/components/ui/badge/badge'
import { uiContent } from '@/config/ui-content'
import type { RegistrationState, TournamentStatus } from '@/types/tournaments'

const { registration, statuses } = uiContent.tournaments

const STATE_COLOURS = {
  NOT_OPEN: 'blue',
  OPEN: 'emerald',
  CLOSED: 'slate',
  FULL: 'amber',
} as const

interface RegistrationStateBadgeProps {
  status: TournamentStatus
  registrationState: RegistrationState
  dataTestId?: string
}

/** A cancelled or finished tournament shows that status; otherwise the registration state. */
export const RegistrationStateBadge = function RegistrationStateBadge({
  status,
  registrationState,
  dataTestId,
}: RegistrationStateBadgeProps): JSX.Element {
  if (status === 'CANCELLED') {
    return (
      <Badge
        text={statuses.CANCELLED}
        colorScheme="red"
        data-testid={dataTestId}
      />
    )
  }
  if (status === 'FINISHED') {
    return (
      <Badge
        text={statuses.FINISHED}
        colorScheme="slate"
        data-testid={dataTestId}
      />
    )
  }
  return (
    <Badge
      text={registration.labels[registrationState]}
      colorScheme={STATE_COLOURS[registrationState]}
      data-testid={dataTestId}
    />
  )
}
