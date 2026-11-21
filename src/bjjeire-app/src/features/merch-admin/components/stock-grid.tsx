import { useState, type JSX, type SyntheticEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button/button'
import { uiContent } from '@/config/ui-content'
import { MerchAdminTestIds } from '@/constants/merchDataTestIds'
import type { AdminProductDto, SizeId } from '@/types/products'
import { setProductStock } from '../api/merch-admin-api'
import { problemMessage } from '../utils/problem-message'

const { stock: copy, form, validation } = uiContent.merchAdmin

const STOCK_PATTERN = /^\d{1,6}$/u

function storedStock(product: AdminProductDto): {
  values: Partial<Record<SizeId, string>>
  signature: string
} {
  return {
    values: Object.fromEntries(
      product.sizes.map(size => [size.id, String(size.stock)])
    ),
    signature: product.sizes.map(size => `${size.id}:${size.stock}`).join(','),
  }
}

interface StockGridProps {
  product: AdminProductDto
  onSaved: (product: AdminProductDto) => void
}

/** Each size's stock, what checkouts hold and what is left to sell (#6016). */
export const StockGrid = function StockGrid({
  product,
  onSaved,
}: StockGridProps): JSX.Element {
  const stored = storedStock(product)
  const [stock, setStock] = useState<Partial<Record<SizeId, string>>>(
    () => stored.values
  )
  // A stock saved anywhere on the page refills the grid, so it never sends a stale count back.
  const [shown, setShown] = useState(stored.signature)
  if (shown !== stored.signature) {
    setShown(stored.signature)
    setStock(stored.values)
  }
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: () =>
      setProductStock(product.id, {
        sizes: product.sizes.map(size => ({
          id: size.id,
          stock: Number(stock[size.id]),
        })),
        version: product.version,
      }),
    onSuccess: saved => {
      setMessage(copy.saved)
      onSaved(saved)
    },
    onError: failure => setError(problemMessage(failure)),
  })

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>): void {
    event.preventDefault()
    setMessage(null)
    setError(null)
    if (
      product.sizes.some(
        size => !STOCK_PATTERN.test((stock[size.id] ?? '').trim())
      )
    ) {
      setError(validation.stockInvalid)
      return
    }
    save.mutate()
  }

  return (
    <section
      aria-labelledby="product-stock-heading"
      className="space-y-3"
      data-testid={MerchAdminTestIds.STOCK}
    >
      <h2 id="product-stock-heading" className="text-lg font-bold text-fg">
        {copy.heading}
      </h2>
      <p className="text-sm text-fg-subtle">{copy.intro}</p>
      <form noValidate onSubmit={handleSubmit} className="space-y-3">
        <table className="w-full max-w-xl text-left text-sm">
          <thead className="text-fg-muted">
            <tr>
              <th scope="col" className="py-2 pr-4">
                {copy.size}
              </th>
              <th scope="col" className="py-2 pr-4">
                {copy.stock}
              </th>
              <th scope="col" className="py-2 pr-4">
                {copy.held}
              </th>
              <th scope="col" className="py-2">
                {copy.available}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline text-fg">
            {product.sizes.map(size => (
              <tr key={size.id}>
                <th scope="row" className="py-2 pr-4 font-semibold">
                  {size.id}
                </th>
                <td className="py-2 pr-4">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={stock[size.id] ?? ''}
                    onChange={event =>
                      setStock({ ...stock, [size.id]: event.target.value })
                    }
                    aria-label={form.stockFor(size.id)}
                    disabled={save.isPending}
                    className="w-24 rounded-lg border border-hairline bg-surface-solid px-3 py-1.5 text-fg focus:outline-none focus:ring-2 focus:ring-ring-focus"
                  />
                </td>
                <td className="py-2 pr-4">{size.held}</td>
                <td className="py-2">{size.available}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? copy.saving : copy.save}
        </Button>
      </form>
      {message && (
        <p role="status" className="text-sm text-fg-subtle">
          {message}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="text-sm text-danger-600 dark:text-danger-400"
          data-testid={MerchAdminTestIds.STOCK_ERROR}
        >
          {error}
        </p>
      )}
    </section>
  )
}
