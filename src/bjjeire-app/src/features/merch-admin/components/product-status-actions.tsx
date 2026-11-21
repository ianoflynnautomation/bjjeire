import { useState, type JSX } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { Badge } from '@/components/ui/badge/badge'
import { Button } from '@/components/ui/button/button'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { MerchAdminTestIds } from '@/constants/merchDataTestIds'
import type { AdminProductDto } from '@/types/products'
import {
  deleteProduct,
  hideProduct,
  publishProduct,
} from '../api/merch-admin-api'
import { problemMessage } from '../utils/problem-message'
import { PRODUCT_STATUS_COLOURS } from '../utils/product-status'

const { actions, statuses } = uiContent.merchAdmin

interface ProductStatusActionsProps {
  product: AdminProductDto
  onSaved: (product: AdminProductDto) => void
  onDeleted: () => void
}

/** Publish, hide, show again, or delete a draft (#6014). */
export const ProductStatusActions = function ProductStatusActions({
  product,
  onSaved,
  onDeleted,
}: ProductStatusActionsProps): JSX.Element {
  const navigate = useNavigate()
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function start(): void {
    setNotice(null)
    setError(null)
  }

  const publish = useMutation({
    mutationFn: () => publishProduct(product.id),
    onSuccess: saved => {
      setNotice(actions.published)
      onSaved(saved)
    },
    onError: failure => setError(problemMessage(failure)),
  })
  const hide = useMutation({
    mutationFn: () => hideProduct(product.id),
    onSuccess: saved => {
      setNotice(actions.hidden)
      onSaved(saved)
    },
    onError: failure => setError(problemMessage(failure)),
  })
  const remove = useMutation({
    mutationFn: () => deleteProduct(product.id),
    onSuccess: () => {
      onDeleted()
      void navigate(paths.adminShop.getHref())
    },
    onError: failure => setError(problemMessage(failure)),
  })
  const busy = publish.isPending || hide.isPending || remove.isPending
  const publishLabel =
    product.status === 'HIDDEN' ? actions.show : actions.publish

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Badge
          text={statuses[product.status]}
          colorScheme={PRODUCT_STATUS_COLOURS[product.status]}
          data-testid={MerchAdminTestIds.STATUS}
        />
        {product.status === 'PUBLISHED' ? (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              start()
              hide.mutate()
            }}
          >
            {hide.isPending ? actions.hiding : actions.hide}
          </Button>
        ) : (
          <Button
            disabled={busy}
            onClick={() => {
              start()
              publish.mutate()
            }}
          >
            {publish.isPending ? actions.publishing : publishLabel}
          </Button>
        )}
        {product.status === 'DRAFT' && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              start()
              if (window.confirm(actions.deleteConfirm)) {
                remove.mutate()
              }
            }}
          >
            {remove.isPending ? actions.deleting : actions.delete}
          </Button>
        )}
      </div>
      {notice && (
        <p role="status" className="text-sm text-fg-subtle">
          {notice}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="text-sm text-danger-600 dark:text-danger-400"
          data-testid={MerchAdminTestIds.ACTION_ERROR}
        >
          {error}
        </p>
      )}
    </div>
  )
}
