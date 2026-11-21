import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge/badge'
import ErrorState from '@/components/ui/state/error-state'
import LoadingState from '@/components/ui/state/loading-state'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { MerchAdminTestIds } from '@/constants/merchDataTestIds'
import { formatPrice } from '@/features/merch/utils/merch-format'
import { ADMIN_PRODUCTS_KEY } from '../api/query-keys'
import { getAdminProducts } from '../api/merch-admin-api'
import { PRODUCT_STATUS_COLOURS } from '../utils/product-status'

const { list, statuses } = uiContent.merchAdmin
const { kinds } = uiContent.merch

export const AdminProductList = function AdminProductList(): JSX.Element {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ADMIN_PRODUCTS_KEY,
    queryFn: getAdminProducts,
  })

  if (isLoading) {
    return <LoadingState />
  }
  if (error) {
    return (
      <ErrorState message={list.loadFailed} onRetry={() => void refetch()} />
    )
  }
  const products = data?.data ?? []
  if (products.length === 0) {
    return <p className="text-sm text-fg-subtle">{list.empty}</p>
  }
  return (
    <ul
      aria-label={list.ariaLabel}
      className="divide-y divide-hairline overflow-hidden rounded-xl bg-surface-solid ring-1 ring-hairline"
      data-testid={MerchAdminTestIds.LIST}
    >
      {products.map(product => (
        <li
          key={product.id}
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          data-testid={MerchAdminTestIds.LIST_ITEM}
        >
          <div>
            <p className="font-semibold text-fg">{product.name}</p>
            <p className="text-sm text-fg-subtle">
              {`${kinds[product.kind]} · ${formatPrice(product.priceCents, product.currency)} · ${list.stockSummary(
                product.sizes.reduce((sum, size) => sum + size.available, 0)
              )}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              text={statuses[product.status]}
              colorScheme={PRODUCT_STATUS_COLOURS[product.status]}
              data-testid={MerchAdminTestIds.LIST_ITEM_STATUS}
            />
            <Link
              to={paths.adminShopProduct.getHref(product.id)}
              aria-label={`${list.editLink}: ${product.name}`}
              className="rounded-sm text-sm font-semibold text-primary-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus dark:text-primary-300"
            >
              {list.editLink}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  )
}
