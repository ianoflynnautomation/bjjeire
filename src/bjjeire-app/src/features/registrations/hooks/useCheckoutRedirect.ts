import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { uiContent } from '@/config/ui-content'
import type { RegistrationCheckoutDto } from '@/types/registrations'
import { OWN_REGISTRATIONS_KEY } from '../api/query-keys'
import { goToCheckout } from '../utils/checkout-redirect'
import {
  registrationProblemMessage,
  registrationProblemType,
} from '../utils/registration-problem'

const PAYMENT_RECEIVED = 'urn:bjjeire:payment-received'

/**
 * Runs a request that answers with a Checkout page, then leaves for it.
 * The error is a sentence for the competitor.
 */
export function useCheckoutRedirect<TInput>(
  request: (input: TInput) => Promise<RegistrationCheckoutDto>
): {
  start: (input: TInput) => void
  isPending: boolean
  error: string | null
  /** Stripe already took the payment; the webhook has not confirmed it yet. Not an error. */
  received: string | null
  clearError: () => void
} {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [received, setReceived] = useState<string | null>(null)
  const mutation = useMutation({
    mutationFn: request,
    onSuccess: checkout => {
      if (!goToCheckout(checkout.checkoutUrl)) {
        setError(uiContent.registrations.problems.fallback)
      }
    },
    onError: failure => {
      if (registrationProblemType(failure) === PAYMENT_RECEIVED) {
        setReceived(registrationProblemMessage(failure))
        // Ask again, so the sign-up shows as confirmed once the webhook lands.
        void queryClient.invalidateQueries({ queryKey: OWN_REGISTRATIONS_KEY })
        return
      }
      setError(registrationProblemMessage(failure))
    },
  })
  return {
    start: (input: TInput): void => {
      setError(null)
      setReceived(null)
      mutation.mutate(input)
    },
    // Stays pending while the browser leaves for Checkout.
    isPending: mutation.isPending || (mutation.isSuccess && error === null),
    error,
    received,
    clearError: () => setError(null),
  }
}
