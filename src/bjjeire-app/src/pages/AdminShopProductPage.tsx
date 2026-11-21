import { useState, type JSX } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Link, useParams } from 'react-router'
import PageLayout from '@/components/layout/page-layout'
import ErrorState from '@/components/ui/state/error-state'
import LoadingState from '@/components/ui/state/loading-state'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { AdminSignInGate } from '@/features/bjjeire-competition-admin/components/admin-sign-in-gate'
import {
  getAdminProduct,
  updateProduct,
} from '@/features/merch-admin/api/merch-admin-api'
import {
  ADMIN_PRODUCTS_KEY,
  adminProductKey,
} from '@/features/merch-admin/api/query-keys'
import { PhotoManager } from '@/features/merch-admin/components/photo-manager'
import { ProductForm } from '@/features/merch-admin/components/product-form'
import { ProductStatusActions } from '@/features/merch-admin/components/product-status-actions'
import { StockGrid } from '@/features/merch-admin/components/stock-grid'
import { problemMessage } from '@/features/merch-admin/utils/problem-message'
import { productFormFrom } from '@/features/merch-admin/utils/product-form'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { AdminProductDto } from '@/types/products'

const copy = uiContent.merchAdmin

const linkClass =
  'rounded-sm text-sm font-semibold text-primary-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus dark:text-primary-300'

/** The sizes and their stock as stored. */
function stockSignature(product: AdminProductDto): string {
  return product.sizes.map(size => `${size.id}:${size.stock}`).join(',')
}

/** Everything the details form holds, as stored. */
function detailsSignature(product: AdminProductDto): string {
  return JSON.stringify([
    product.slug,
    product.name,
    product.kind,
    product.description,
    product.priceCents,
    stockSignature(product),
  ])
}

interface ProductEditorProps {
  product: AdminProductDto
  onSaved: (product: AdminProductDto) => void
  onReload: () => void
  onDeleted: () => void
}

const ProductEditor = function ProductEditor({
  product,
  onSaved,
  onReload,
  onDeleted,
}: ProductEditorProps): JSX.Element {
  const [error, setError] = useState<string | null>(null)
  const save = useMutation({
    mutationFn: (command: Parameters<typeof updateProduct>[1]) =>
      updateProduct(product.id, command),
    onSuccess: onSaved,
    onError: failure => setError(problemMessage(failure)),
  })

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <Link to={paths.adminShop.getHref()} className={linkClass}>
          {copy.backLink}
        </Link>
        <h1 className="display-expanded text-3xl font-bold text-fg">
          {product.name}
        </h1>
        <ProductStatusActions
          product={product}
          onSaved={onSaved}
          onDeleted={onDeleted}
        />
      </div>

      <PhotoManager product={product} onSaved={onSaved} onUploaded={onReload} />

      {/* Refills itself when the stored stock changes, and keeps its own message. */}
      <StockGrid key={product.id} product={product} onSaved={onSaved} />

      {/*
        Keyed on what it holds, not the version: a photo or status save leaves
        unsaved typing alone. A stock-grid save refills it, because it holds the
        stock too and must never send a stale count back. It reads the latest
        version from props when it saves.
      */}
      <ProductForm
        key={detailsSignature(product)}
        initialValues={productFormFrom(product)}
        held={Object.fromEntries(
          product.sizes.map(size => [size.id, size.held])
        )}
        submitLabel={copy.form.save}
        savingLabel={copy.form.saving}
        isSaving={save.isPending}
        error={error}
        onSubmit={command => {
          setError(null)
          save.mutate({
            ...command,
            photos: product.photos,
            version: product.version,
          })
        }}
      />
    </div>
  )
}

const AdminShopProduct = function AdminShopProduct(): JSX.Element {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: adminProductKey(id),
    queryFn: () => getAdminProduct(id),
    enabled: id !== '',
  })

  function saved(product: AdminProductDto): void {
    queryClient.setQueryData(adminProductKey(id), product)
    void queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY })
  }

  if (data) {
    return (
      <ProductEditor
        product={data}
        onSaved={saved}
        onReload={() => void refetch()}
        onDeleted={() => {
          queryClient.removeQueries({ queryKey: adminProductKey(id) })
          void queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY })
        }}
      />
    )
  }
  if (isLoading) {
    return <LoadingState />
  }
  const notFound = isAxiosError(error) && error.response?.status === 404
  return (
    <ErrorState
      message={notFound ? copy.errors.notFound : copy.errors.loadFailed}
      onRetry={() => void refetch()}
    />
  )
}

/** One product's editor: status, photos, stock and details (User Story 4). */
export default function AdminShopProductPage(): JSX.Element {
  useDocumentTitle(copy.productDocumentTitle)
  return (
    <PageLayout>
      <AdminSignInGate message={copy.signInMessage}>
        <AdminShopProduct />
      </AdminSignInGate>
    </PageLayout>
  )
}
