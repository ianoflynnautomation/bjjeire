import type { JSX } from 'react'
import { Link, useParams } from 'react-router'
import PageErrorBoundary from '@/components/error/page-error-boundary'
import PageLayout from '@/components/layout/page-layout'
import ErrorState from '@/components/ui/state/error-state'
import LoadingState from '@/components/ui/state/loading-state'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { ProductPageTestIds } from '@/constants/merchDataTestIds'
import { ProductDetails } from '@/features/merch/components/product-details'
import { useProduct } from '@/features/merch/hooks/useProduct'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { buttonVariants } from '@/lib/button-variants'

const { product: copy, notFound } = uiContent.merch

export default function ProductPage(): JSX.Element {
  const { slug = '' } = useParams()
  const {
    product,
    isLoading,
    isNotFound,
    error,
    formattedErrorMessage,
    refetch,
  } = useProduct(slug)
  useDocumentTitle(
    product ? `${product.name} ${copy.documentTitleSuffix}` : copy.documentTitle
  )

  let content: JSX.Element
  if (product) {
    content = <ProductDetails product={product} />
  } else if (isNotFound) {
    content = (
      <div
        role="status"
        className="my-10 rounded-xl bg-surface-solid p-6 text-center shadow-card ring-1 ring-hairline"
        data-testid={ProductPageTestIds.NOT_FOUND}
      >
        <h1 className="text-lg font-bold text-fg">{notFound.title}</h1>
        <p className="mt-1 text-sm text-fg-subtle">{notFound.message}</p>
        <Link
          to={paths.shop.getHref()}
          className={buttonVariants({ variant: 'solid', className: 'mt-6' })}
        >
          {notFound.backLink}
        </Link>
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
    <PageErrorBoundary errorMessage={copy.loadOneFailed}>
      <PageLayout>{content}</PageLayout>
    </PageErrorBoundary>
  )
}
