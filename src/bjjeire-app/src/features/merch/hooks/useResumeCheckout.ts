import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { uiContent } from '@/config/ui-content'
import { goToCheckout } from '@/lib/checkout-redirect'
import { resumeOrderCheckout } from '../api/orders'
import { orderProblem, problemMessage } from '../utils/order-problem'

const { order: copy } = uiContent.merch

/** Goes back to an order's open Stripe page while its hold lasts (#6008). */
export function useResumeCheckout(
  id: string,
  key: string | null
): { resume: () => void; isPending: boolean; error: string | null } {
  const [error, setError] = useState<string | null>(null)
  const mutation = useMutation({
    mutationFn: () => resumeOrderCheckout(id, key ?? ''),
    onSuccess: checkout => {
      if (!goToCheckout(checkout.checkoutUrl)) {
        setError(copy.problems.fallback)
      }
    },
    onError: failure => {
      setError(problemMessage(copy.problems, orderProblem(failure).type))
    },
  })
  return {
    resume: (): void => {
      setError(null)
      mutation.mutate()
    },
    isPending: mutation.isPending || (mutation.isSuccess && error === null),
    error,
  }
}
