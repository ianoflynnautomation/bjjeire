import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { RegistrationDto } from '@/types/registrations'
import { getOwnRegistrations } from '../api/registration-api'
import { OWN_REGISTRATIONS_KEY } from '../api/query-keys'

export const CONFIRMATION_POLL_MS = 2000
/** About a minute of waiting for Stripe's webhook before the page stops asking. */
export const CONFIRMATION_POLL_LIMIT = 30

/** The signed-in competitor's sign-ups. */
export function useOwnRegistrations(): UseQueryResult<RegistrationDto[]> {
  return useQuery({
    queryKey: OWN_REGISTRATIONS_KEY,
    queryFn: getOwnRegistrations,
  })
}

/**
 * The competitor's sign-ups, asked for again while one of them is still
 * awaiting payment, until the webhook has confirmed or ended it (FR-018).
 * The browser returning from Checkout never confirms anything itself.
 */
export function useAwaitedRegistration(registrationId: string): {
  query: UseQueryResult<RegistrationDto[]>
  registration: RegistrationDto | undefined
} {
  const query = useQuery({
    queryKey: OWN_REGISTRATIONS_KEY,
    queryFn: getOwnRegistrations,
    refetchInterval: current => {
      const found = current.state.data?.find(item => item.id === registrationId)
      return found?.status === 'AWAITING_PAYMENT' &&
        current.state.dataUpdateCount < CONFIRMATION_POLL_LIMIT
        ? CONFIRMATION_POLL_MS
        : false
    },
  })
  return {
    query,
    registration: query.data?.find(item => item.id === registrationId),
  }
}
