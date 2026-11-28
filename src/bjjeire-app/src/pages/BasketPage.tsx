import type { JSX } from 'react'
import { Link } from 'react-router'
import PageErrorBoundary from '@/components/error/page-error-boundary'
import PageLayout from '@/components/layout/page-layout'
import ErrorState from '@/components/ui/state/error-state'
import LoadingState from '@/components/ui/state/loading-state'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { BasketTestIds } from '@/constants/merchDataTestIds'
import { BasketLines } from '@/features/merch/components/basket-lines'
import { useBasketView } from '@/features/merch/hooks/useBasketView'
import { formatPrice } from '@/features/merch/utils/merch-format'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { buttonVariants } from '@/lib/button-variants'

const { basket: copy } = uiContent.merch

/** The shopper's basket (#6005, #6010). Kept in this browser; no account needed. */
export default function BasketPage(): JSX.Element {
  useDocumentTitle(copy.documentTitle)
  const view = useBasketView()

  let content: JSX.Element
  if (view.lines.length === 0) {
    content = (
      <div
        className="rounded-xl bg-surface-solid p-6 text-center shadow-card ring-1 ring-hairline"
        data-testid={BasketTestIds.EMPTY}
      >
        <p className="text-fg">{copy.empty}</p>
        <Link
          to={paths.shop.getHref()}
          className={buttonVariants({ variant: 'solid', className: 'mt-6' })}
        >
          {copy.emptyLink}
        </Link>
      </div>
    )
  } else if (view.isLoading) {
    content = <LoadingState />
  } else if (view.isError) {
    content = <ErrorState message={copy.loadFailed} onRetry={view.refetch} />
  } else {
    content = (
      <div className="rounded-xl bg-surface-solid p-6 shadow-card ring-1 ring-hairline">
        <BasketLines lines={view.lines} />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-6">
          <div>
            <p className="text-lg font-bold text-fg">
              {copy.itemsTotal}:{' '}
              <span data-testid={BasketTestIds.ITEMS_TOTAL}>
                {formatPrice(view.itemsCents)}
              </span>
            </p>
            <p className="text-sm text-fg-subtle">{copy.deliveryNote}</p>
            <p className="text-sm text-fg-subtle">{copy.limits}</p>
          </div>
          {view.canCheckout ? (
            <Link
              to={paths.checkout.getHref()}
              className={buttonVariants({ variant: 'solid', size: 'lg' })}
              data-testid={BasketTestIds.CHECKOUT}
            >
              {copy.checkout}
            </Link>
          ) : (
            <p role="status" className="text-sm font-semibold text-fg">
              {view.lines.some(line => line.problem !== null)
                ? copy.fixFirst
                : copy.lowerFirst}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <PageErrorBoundary errorMessage={copy.loadFailed}>
      <PageLayout>
        <section className="space-y-6" data-testid={BasketTestIds.ROOT}>
          <h1 className="display-expanded text-3xl font-bold text-fg">
            {copy.title}
          </h1>
          {content}
        </section>
      </PageLayout>
    </PageErrorBoundary>
  )
}
