import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query'
import type { CancellationDto, RegistrationDto } from '@/types/registrations'
import {
  cancelRegistration,
  changeRegistrationDivision,
} from '../api/registration-api'
import { OWN_REGISTRATIONS_KEY } from '../api/query-keys'

/** Cancels the competitor's own sign-up, then reloads "my sign-ups" (#5022). */
export function useCancelRegistration(): UseMutationResult<
  CancellationDto,
  unknown,
  string
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelRegistration,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: OWN_REGISTRATIONS_KEY }),
  })
}

/** Moves the competitor's own sign-up to another division, then reloads "my sign-ups" (#5024). */
export function useChangeDivision(): UseMutationResult<
  RegistrationDto,
  unknown,
  { registrationId: string; divisionId: string }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ registrationId, divisionId }) =>
      changeRegistrationDivision(registrationId, { divisionId }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: OWN_REGISTRATIONS_KEY }),
  })
}
