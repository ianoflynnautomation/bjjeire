import type { JSX } from 'react'
import { uiContent } from '@/config/ui-content'
import { cn } from '@/lib/cn'
import type { ProductSizeDto, SizeId } from '@/types/products'

const { product: copy } = uiContent.merch

interface SizePickerProps {
  sizes: ProductSizeDto[]
  value: SizeId | null
  onChange: (size: SizeId) => void
  dataTestId?: string
  sizeTestId?: string
  className?: string
}

/** Every size the product comes in. A sold-out size is shown, marked and cannot be chosen (#6002). */
export const SizePicker = function SizePicker({
  sizes,
  value,
  onChange,
  dataTestId,
  sizeTestId,
  className,
}: SizePickerProps): JSX.Element {
  return (
    <fieldset className={cn('space-y-2', className)} data-testid={dataTestId}>
      <legend className="text-sm font-semibold text-fg">
        {copy.sizesLegend}
      </legend>
      <div className="flex flex-wrap gap-2">
        {sizes.map(size => (
          <label
            key={size.id}
            data-testid={sizeTestId}
            className={cn(
              'flex min-w-14 cursor-pointer flex-col items-center rounded-lg px-3 py-2 text-sm font-semibold ring-1 ring-hairline',
              'has-checked:bg-primary-600 has-checked:text-white has-checked:ring-primary-600',
              'has-focus-visible:ring-2 has-focus-visible:ring-ring-focus',
              size.soldOut
                ? 'cursor-not-allowed text-fg-muted'
                : 'text-fg hover:ring-primary-500'
            )}
          >
            <input
              type="radio"
              name="size"
              value={size.id}
              checked={value === size.id}
              disabled={size.soldOut}
              onChange={() => onChange(size.id)}
              aria-label={size.soldOut ? copy.soldOutSize(size.id) : size.id}
              className="sr-only"
            />
            {/* Only the size is struck through: a child cannot undo a parent's line-through. */}
            <span className={cn(size.soldOut && 'line-through')}>
              {size.id}
            </span>
            {size.soldOut && (
              <span className="text-xs font-normal">{copy.soldOut}</span>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
