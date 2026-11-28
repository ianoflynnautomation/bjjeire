import type { JSX } from 'react'
import { uiContent } from '@/config/ui-content'
import { OrderPageTestIds } from '@/constants/merchDataTestIds'
import type { OrderDto } from '@/types/orders'
import { formatPrice } from '../utils/merch-format'

const { order: copy, checkout } = uiContent.merch

interface OrderDetailsProps {
  order: OrderDto
}

/** What was bought, what it cost and where it goes (#6011). */
export const OrderDetails = function OrderDetails({
  order,
}: OrderDetailsProps): JSX.Element {
  const paid = order.paidAt !== null && order.paidAt !== undefined
  const { address } = order
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-xl bg-surface-solid p-6 shadow-card ring-1 ring-hairline">
        <h2 className="text-lg font-bold text-fg">{copy.itemsHeading}</h2>
        <ul className="mt-3 divide-y divide-hairline">
          {order.lines.map(line => (
            <li
              key={`${line.productId}-${line.sizeId}`}
              className="flex justify-between gap-4 py-2 text-sm"
              data-testid={OrderPageTestIds.LINE}
            >
              <span className="text-fg">
                {line.productName}, {copy.size(line.sizeId)}{' '}
                {copy.quantity(line.quantity)}
              </span>
              <span className="font-semibold text-fg">
                {formatPrice(line.lineCents, order.currency)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-hairline pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-fg-subtle">{copy.items}</dt>
            <dd className="text-fg" data-testid={OrderPageTestIds.ITEMS}>
              {formatPrice(order.itemsCents, order.currency)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-fg-subtle">{copy.delivery}</dt>
            <dd className="text-fg" data-testid={OrderPageTestIds.DELIVERY}>
              {formatPrice(order.deliveryCents, order.currency)}
            </dd>
          </div>
          <div className="flex justify-between text-base font-bold">
            <dt className="text-fg">{paid ? copy.total : copy.totalDue}</dt>
            <dd className="text-fg" data-testid={OrderPageTestIds.TOTAL}>
              {formatPrice(order.totalCents, order.currency)}
            </dd>
          </div>
        </dl>
      </section>
      <section className="h-fit rounded-xl bg-surface-solid p-6 shadow-card ring-1 ring-hairline">
        <h2 className="text-lg font-bold text-fg">{copy.addressHeading}</h2>
        <address
          className="mt-3 text-sm whitespace-pre-line text-fg not-italic"
          data-testid={OrderPageTestIds.ADDRESS}
        >
          {[
            address.name,
            address.line1,
            address.line2,
            `${address.town}, ${address.county}`,
            address.postcode,
            address.country === 'GB'
              ? checkout.countries.GB
              : checkout.countries.IE,
          ]
            .filter(Boolean)
            .join('\n')}
        </address>
        {paid && (
          <p className="mt-4 text-sm text-fg-subtle">
            {copy.emailLabel}: {order.email}
          </p>
        )}
      </section>
    </div>
  )
}
