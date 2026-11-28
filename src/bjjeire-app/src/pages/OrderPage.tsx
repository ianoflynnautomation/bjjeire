import { useEffect, useState, type JSX } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import PageErrorBoundary from '@/components/error/page-error-boundary'
import PageLayout from '@/components/layout/page-layout'
import { Button } from '@/components/ui/button/button'
import ErrorState from '@/components/ui/state/error-state'
import LoadingState from '@/components/ui/state/loading-state'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { OrderPageTestIds } from '@/constants/merchDataTestIds'
import { OrderDetails } from '@/features/merch/components/order-details'
import { useOrder } from '@/features/merch/hooks/useOrder'
import { useResumeCheckout } from '@/features/merch/hooks/useResumeCheckout'
import { clearBasket } from '@/features/merch/utils/basket'
import { findOrderKey } from '@/features/merch/utils/order-key'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { buttonVariants } from '@/lib/button-variants'
import type { OrderDto } from '@/types/orders'

const { order: copy } = uiContent.merch

const HOLD_TIME = new Intl.DateTimeFormat('en-IE', {
  timeStyle: 'short',
  timeZone: 'Europe/Dublin',
})

function statusMessage(
  order: OrderDto,
  returnedFromCheckout: boolean,
  gaveUpPolling: boolean
): string {
  switch (order.status) {
    case 'AWAITING_PAYMENT':
      if (gaveUpPolling) {
        return copy.stillConfirming
      }
      return returnedFromCheckout ? copy.confirming : copy.awaiting
    case 'CONFIRMED':
      return copy.confirmed
    case 'DISPATCHED':
      return copy.dispatched(order.dispatch?.trackingReference ?? null)
    case 'EXPIRED':
      return copy.expired
    case 'REFUNDED':
      return order.refundStatus === 'REFUNDED'
        ? copy.refunded
        : copy.refundPending
  }
}

/**
 * A guest's order, read with the key from its link (#6011, FR-015). The page
 * Stripe returns to waits here for the webhook to confirm it (#6007).
 */
export default function OrderPage(): JSX.Element {
  useDocumentTitle(copy.documentTitle)
  const { id = '' } = useParams()
  const location = useLocation()
  const [key] = useState(() => findOrderKey(id, location.hash))
  const returnedFromCheckout =
    new URLSearchParams(location.search).get('checkout') === 'complete'
  const {
    order,
    isLoading,
    isNotFound,
    gaveUpPolling,
    error,
    formattedErrorMessage,
    refetch,
  } = useOrder(id, key, returnedFromCheckout)
  const resume = useResumeCheckout(id, key)
  const confirmed =
    order?.status === 'CONFIRMED' || order?.status === 'DISPATCHED'

  useEffect(() => {
    // Bought: the basket that paid for this order is spent.
    if (returnedFromCheckout && confirmed) {
      clearBasket()
    }
  }, [returnedFromCheckout, confirmed])

  let content: JSX.Element
  if (order) {
    const awaiting = order.status === 'AWAITING_PAYMENT'
    content = (
      <article className="space-y-6" data-testid={OrderPageTestIds.ROOT}>
        <div className="space-y-2">
          <h1
            className="display-expanded text-3xl font-bold text-fg"
            data-testid={OrderPageTestIds.NUMBER}
          >
            {copy.title(order.number)}
          </h1>
          <p
            className="inline-block rounded-full bg-muted px-3 py-1 text-sm font-semibold text-fg"
            data-testid={OrderPageTestIds.STATUS}
          >
            {copy.statuses[order.status]}
          </p>
        </div>
        <div
          role="status"
          className="rounded-xl bg-surface-solid p-4 ring-1 ring-hairline"
        >
          <p className="text-fg" data-testid={OrderPageTestIds.MESSAGE}>
            {statusMessage(order, returnedFromCheckout, gaveUpPolling)}
          </p>
          {awaiting && !returnedFromCheckout && order.holdExpiresAt && (
            <p className="mt-1 text-sm text-fg-subtle">
              {copy.holdUntil(HOLD_TIME.format(new Date(order.holdExpiresAt)))}
            </p>
          )}
          {awaiting && !returnedFromCheckout && (
            <Button
              className="mt-4"
              onClick={resume.resume}
              disabled={resume.isPending}
              data-testid={OrderPageTestIds.RESUME}
            >
              {resume.isPending ? copy.resuming : copy.resume}
            </Button>
          )}
          {order.status === 'EXPIRED' && (
            <Link
              to={paths.basket.getHref()}
              className={buttonVariants({
                variant: 'solid',
                className: 'mt-4',
              })}
            >
              {copy.tryAgain}
            </Link>
          )}
          {resume.error !== null && (
            <p
              role="alert"
              className="mt-3 text-sm font-semibold text-danger-600 dark:text-danger-400"
              data-testid={OrderPageTestIds.ERROR}
            >
              {resume.error}
            </p>
          )}
        </div>
        <OrderDetails order={order} />
      </article>
    )
  } else if (key === null && returnedFromCheckout) {
    // Stripe's return opened in a tab without the key, as some banks' 3-D Secure apps do.
    content = (
      <div
        role="status"
        className="my-10 rounded-xl bg-surface-solid p-6 text-center shadow-card ring-1 ring-hairline"
        data-testid={OrderPageTestIds.NO_KEY}
      >
        <p className="text-fg">{copy.noKeyAfterPayment}</p>
      </div>
    )
  } else if (isNotFound) {
    content = (
      <div
        role="status"
        className="my-10 rounded-xl bg-surface-solid p-6 text-center shadow-card ring-1 ring-hairline"
        data-testid={OrderPageTestIds.NOT_FOUND}
      >
        <h1 className="text-lg font-bold text-fg">{copy.notFound.title}</h1>
        <p className="mt-1 text-sm text-fg-subtle">{copy.notFound.message}</p>
      </div>
    )
  } else if (error && !isLoading) {
    content = (
      <ErrorState
        message={formattedErrorMessage}
        onRetry={() => void refetch()}
      />
    )
  } else {
    content = <LoadingState />
  }

  return (
    <PageErrorBoundary errorMessage={copy.loadFailed}>
      <PageLayout>{content}</PageLayout>
    </PageErrorBoundary>
  )
}
