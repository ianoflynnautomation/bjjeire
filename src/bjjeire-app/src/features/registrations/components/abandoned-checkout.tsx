import type { JSX } from 'react'
import { Button } from '@/components/ui/button/button'
import { uiContent } from '@/config/ui-content'
import { SignUpPageTestIds } from '@/constants/registrationDataTestIds'
import { resumeCheckout } from '../api/registration-api'
import { useCheckoutRedirect } from '../hooks/useCheckoutRedirect'

const { signUp } = uiContent.registrations

interface AbandonedCheckoutProps {
  registrationId: string
}

/**
 * Shown when Checkout sends the competitor back without paying (#5016).
 * Nothing was charged, and the same payment page can be reopened while the
 * place is still held.
 */
export const AbandonedCheckout = function AbandonedCheckout({
  registrationId,
}: AbandonedCheckoutProps): JSX.Element {
  const resume = useCheckoutRedirect(resumeCheckout)
  return (
    <section
      role="status"
      className="space-y-3 rounded-xl border border-hairline bg-surface-solid p-5 ring-1 ring-hairline"
      data-testid={SignUpPageTestIds.ABANDONED}
    >
      <p className="text-sm text-fg">
        {resume.received ?? resume.error ?? signUp.abandoned}
      </p>
      {resume.error === null && resume.received === null && (
        <Button
          variant="outline"
          onClick={() => resume.start(registrationId)}
          disabled={resume.isPending}
          data-testid={SignUpPageTestIds.RESUME}
        >
          {signUp.resume}
        </Button>
      )}
    </section>
  )
}
