import { useState, type ChangeEvent, type JSX } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  TrashIcon,
} from '@heroicons/react/20/solid'
import { uiContent } from '@/config/ui-content'
import { MerchAdminTestIds } from '@/constants/merchDataTestIds'
import { productPhotoUrl } from '@/features/merch/utils/merch-format'
import {
  MAX_PHOTO_BYTES,
  MAX_PRODUCT_PHOTOS,
  type AdminProductDto,
} from '@/types/products'
import { updateProduct, uploadProductPhoto } from '../api/merch-admin-api'
import { updateCommandFrom } from '../utils/product-form'
import { problemMessage, problemType } from '../utils/problem-message'

const { photos: copy } = uiContent.merchAdmin

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** The organiser's wording for the upload refusals the API names by type. */
const UPLOAD_PROBLEMS: Record<string, string | undefined> = {
  'urn:bjjeire:unsupported-image': copy.unsupported,
  'urn:bjjeire:payload-too-large': copy.tooLarge,
  'urn:bjjeire:too-many-photos': copy.full,
}

const iconButton =
  'rounded-md bg-surface-solid p-1.5 text-fg shadow-card ring-1 ring-hairline hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus disabled:opacity-40'

interface PhotoManagerProps {
  product: AdminProductDto
  /** Called with the stored product after a reorder or removal. */
  onSaved: (product: AdminProductDto) => void
  /** Called after an upload; the product is read again to show the photo. */
  onUploaded: () => void
}

/** Upload, order and remove a product's photos (#6013). The first is the one the shop shows. */
export const PhotoManager = function PhotoManager({
  product,
  onSaved,
  onUploaded,
}: PhotoManagerProps): JSX.Element {
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const photos = product.photos
  const full = photos.length >= MAX_PRODUCT_PHOTOS

  const upload = useMutation({
    mutationFn: (file: File) =>
      uploadProductPhoto(product.id, file, setProgress),
    onSuccess: () => {
      setProgress(null)
      onUploaded()
    },
    onError: failure => {
      setProgress(null)
      setError(
        UPLOAD_PROBLEMS[problemType(failure) ?? ''] ?? problemMessage(failure)
      )
    },
  })

  const reorder = useMutation({
    mutationFn: (next: string[]) =>
      updateProduct(product.id, updateCommandFrom(product, next)),
    onSuccess: onSaved,
    onError: failure => setError(problemMessage(failure)),
  })

  function handleFile(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }
    setError(null)
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(copy.unsupported)
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError(copy.tooLarge)
      return
    }
    setProgress(0)
    upload.mutate(file)
  }

  function move(from: number, to: number): void {
    const next = [...photos]
    const [photo] = next.splice(from, 1)
    next.splice(to, 0, photo)
    setError(null)
    reorder.mutate(next)
  }

  function remove(index: number): void {
    setError(null)
    reorder.mutate(photos.filter((_, position) => position !== index))
  }

  const busy = upload.isPending || reorder.isPending

  return (
    <section
      aria-labelledby="product-photos-heading"
      className="space-y-3"
      data-testid={MerchAdminTestIds.PHOTOS}
    >
      <h2 id="product-photos-heading" className="text-lg font-bold text-fg">
        {copy.heading}
      </h2>
      <p className="text-sm text-fg-subtle">{copy.intro}</p>
      {photos.length === 0 ? (
        <p className="text-sm text-fg-muted">{copy.none}</p>
      ) : (
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {photos.map((photo, index) => (
            <li
              key={photo}
              className="space-y-2 rounded-lg bg-ink-50 p-2 ring-1 ring-hairline"
              data-testid={MerchAdminTestIds.PHOTO}
            >
              <img
                src={productPhotoUrl(photo)}
                alt={copy.alt(index + 1)}
                className="aspect-square w-full object-contain"
              />
              <div className="flex justify-between gap-1">
                <button
                  type="button"
                  className={iconButton}
                  disabled={busy || index === 0}
                  onClick={() => move(index, index - 1)}
                  aria-label={copy.moveEarlier(index + 1)}
                >
                  <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={iconButton}
                  disabled={busy || index === photos.length - 1}
                  onClick={() => move(index, index + 1)}
                  aria-label={copy.moveLater(index + 1)}
                >
                  <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={iconButton}
                  disabled={busy}
                  onClick={() => remove(index)}
                  aria-label={copy.remove(index + 1)}
                >
                  <TrashIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div>
        <label
          htmlFor="product-photo-upload"
          className="text-sm font-semibold text-fg-muted"
        >
          {copy.upload}
        </label>
        <input
          id="product-photo-upload"
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          disabled={busy || full}
          onChange={handleFile}
          className="mt-1 block w-full text-sm text-fg file:mr-3 file:rounded-md file:border-0 file:bg-primary-600 file:px-3 file:py-2 file:font-semibold file:text-white disabled:opacity-60"
          data-testid={MerchAdminTestIds.PHOTO_INPUT}
        />
        {full && <p className="mt-1 text-xs text-fg-subtle">{copy.full}</p>}
      </div>
      {progress !== null && (
        <p role="status" className="text-sm text-fg-subtle">
          {copy.uploadProgress(progress)}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="text-sm text-danger-600 dark:text-danger-400"
          data-testid={MerchAdminTestIds.PHOTO_ERROR}
        >
          {error}
        </p>
      )}
    </section>
  )
}
