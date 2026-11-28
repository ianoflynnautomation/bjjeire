import type { JSX } from 'react'
import { Link } from 'react-router'
import PageErrorBoundary from '@/components/error/page-error-boundary'
import PageLayout from '@/components/layout/page-layout'
import ErrorState from '@/components/ui/state/error-state'
import LoadingState from '@/components/ui/state/loading-state'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { CheckoutTestIds } from '@/constants/merchDataTestIds'
import { CheckoutForm } from '@/features/merch/components/checkout-form'
import { useBasketView } from '@/features/merch/hooks/useBasketView'
import { useCheckout } from '@/features/merch/hooks/useCheckout'
import { useDelivery } from '@/features/merch/hooks/useDelivery'
import {
  toAddress,
  type CheckoutDetails,
} from '@/features/merch/utils/checkout-details'
import { formatPrice } from '@/features/merch/utils/merch-format'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { buttonVariants } from '@/lib/button-variants'

const { checkout: copy, basket } = uiContent.merch

/** A guest pays for the basket: the full amount and delivery details first (#6006, #6012). */
export default function CheckoutPage(): JSX.Element {
  useDocumentTitle(copy.documentTitle)
  const view = useBasketView()
  const { delivery, ...deliveryQuery } = useDelivery()
  const checkout = useCheckout()

  const pay = (details: CheckoutDetails): void => {
    if (delivery === undefined) {
      return
    }
    checkout.start({
      command: {
        lines: view.lines.map(line => ({
          productId: line.productId,
          sizeId: line.sizeId,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents ?? 0,
        })),
        email: details.email.trim(),
        address: toAddress(details),
        deliveryCents: delivery.deliveryFeeCents,
        acceptTerms: details.acceptTerms,
      },
      names: new Map(
        view.lines.flatMap(line =>
          line.name === null ? [] : [[line.productId, line.name] as const]
        )
      ),
    })
  }

  const changes =
    checkout.changes.length > 0 ? (
      <div
        role="alert"
        className="rounded-xl bg-surface-solid p-4 ring-1 ring-hairline"
        data-testid={CheckoutTestIds.CHANGES}
      >
        <h2 className="font-bold text-fg">{copy.changedHeading}</h2>
        <p className="text-sm text-fg-subtle">{copy.changedIntro}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-fg">
          {checkout.changes.map(change => (
            <li key={change} data-testid={CheckoutTestIds.CHANGE}>
              {change}
            </li>
          ))}
        </ul>
      </div>
    ) : null

  let content: JSX.Element
  if (view.lines.length === 0) {
    content = (
      <div
        className="rounded-xl bg-surface-solid p-6 text-center shadow-card ring-1 ring-hairline"
        data-testid={CheckoutTestIds.EMPTY}
      >
        <p className="text-fg">{copy.empty}</p>
        <Link
          to={paths.shop.getHref()}
          className={buttonVariants({ variant: 'solid', className: 'mt-6' })}
        >
          {basket.emptyLink}
        </Link>
      </div>
    )
  } else if (view.isLoading || deliveryQuery.isLoading) {
    content = <LoadingState />
  } else if (view.isError || deliveryQuery.isError || delivery === undefined) {
    content = (
      <ErrorState
        message={basket.loadFailed}
        onRetry={() => {
          view.refetch()
          void deliveryQuery.refetch()
        }}
      />
    )
  } else if (!view.canCheckout) {
    content = (
      <div className="rounded-xl bg-surface-solid p-6 shadow-card ring-1 ring-hairline">
        <p role="status" className="text-fg">
          {view.lines.some(line => line.problem !== null)
            ? basket.fixFirst
            : basket.lowerFirst}
        </p>
        <Link
          to={paths.basket.getHref()}
          className={buttonVariants({ variant: 'solid', className: 'mt-6' })}
        >
          {copy.backToBasket}
        </Link>
      </div>
    )
  } else {
    const total = view.itemsCents + delivery.deliveryFeeCents
    content = (
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl bg-surface-solid p-6 shadow-card ring-1 ring-hairline">
          <CheckoutForm
            submitLabel={copy.submit(formatPrice(total))}
            isSubmitting={checkout.isPending}
            onSubmit={pay}
          />
          {checkout.error !== null && (
            <p
              role="alert"
              className="mt-4 text-sm font-semibold text-danger-600 dark:text-danger-400"
              data-testid={CheckoutTestIds.ERROR}
            >
              {checkout.error}
            </p>
          )}
        </div>
        <aside className="h-fit rounded-xl bg-surface-solid p-6 shadow-card ring-1 ring-hairline">
          <h2 className="text-lg font-bold text-fg">{copy.summaryHeading}</h2>
          <ul className="mt-3 space-y-1 text-sm text-fg-subtle">
            {view.lines.map(line => (
              <li key={`${line.productId}-${line.sizeId}`}>
                {line.name}, {basket.size(line.sizeId)} × {line.quantity}
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-hairline pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-fg-subtle">{copy.items}</dt>
              <dd className="text-fg" data-testid={CheckoutTestIds.ITEMS}>
                {formatPrice(view.itemsCents)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-fg-subtle">{copy.delivery}</dt>
              <dd className="text-fg" data-testid={CheckoutTestIds.DELIVERY}>
                {formatPrice(delivery.deliveryFeeCents)}
              </dd>
            </div>
            <div className="flex justify-between text-base font-bold">
              <dt className="text-fg">{copy.total}</dt>
              <dd className="text-fg" data-testid={CheckoutTestIds.TOTAL}>
                {formatPrice(total)}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-fg-subtle">{copy.deliveryNote}</p>
        </aside>
      </div>
    )
  }

  return (
    <PageErrorBoundary errorMessage={basket.loadFailed}>
      <PageLayout>
        <section className="space-y-6" data-testid={CheckoutTestIds.ROOT}>
          <h1 className="display-expanded text-3xl font-bold text-fg">
            {copy.title}
          </h1>
          {changes}
          {content}
        </section>
      </PageLayout>
    </PageErrorBoundary>
  )
}
