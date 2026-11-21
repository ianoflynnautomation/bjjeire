import { useState, type JSX } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import PageLayout from '@/components/layout/page-layout'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { AdminSignInGate } from '@/features/bjjeire-competition-admin/components/admin-sign-in-gate'
import { createProduct } from '@/features/merch-admin/api/merch-admin-api'
import { ADMIN_PRODUCTS_KEY } from '@/features/merch-admin/api/query-keys'
import { AdminProductList } from '@/features/merch-admin/components/admin-product-list'
import { ProductForm } from '@/features/merch-admin/components/product-form'
import { problemMessage } from '@/features/merch-admin/utils/problem-message'
import { emptyProductForm } from '@/features/merch-admin/utils/product-form'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const copy = uiContent.merchAdmin

const AdminShop = function AdminShop(): JSX.Element {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const create = useMutation({
    mutationFn: createProduct,
    onSuccess: created => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY })
      void navigate(paths.adminShopProduct.getHref(created.id))
    },
    onError: failure => setError(problemMessage(failure)),
  })

  return (
    <div className="space-y-10">
      <h1 className="display-expanded text-3xl font-bold text-fg">
        {copy.listTitle}
      </h1>
      <AdminProductList />
      <section aria-labelledby="create-product-heading" className="space-y-4">
        <h2 id="create-product-heading" className="text-xl font-bold text-fg">
          {copy.create.heading}
        </h2>
        <p className="text-sm text-fg-subtle">{copy.create.intro}</p>
        <ProductForm
          initialValues={emptyProductForm()}
          submitLabel={copy.create.submit}
          savingLabel={copy.create.saving}
          isSaving={create.isPending}
          error={error}
          onSubmit={command => {
            setError(null)
            create.mutate(command)
          }}
        />
      </section>
    </div>
  )
}

/** The organiser's shop admin: every product, and a form for a new one (User Story 4). */
export default function AdminShopPage(): JSX.Element {
  useDocumentTitle(copy.documentTitle)
  return (
    <PageLayout>
      <AdminSignInGate message={copy.signInMessage}>
        <AdminShop />
      </AdminSignInGate>
    </PageLayout>
  )
}
