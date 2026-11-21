import { api } from '@/lib/api-client'
import { API_RESOURCE_ROUTES } from '@/config/api-routes'
import type { PaginatedResponse } from '@/types/common'
import type {
  AdminProductDto,
  CreateProductCommand,
  PhotoUploadResponse,
  StockCommand,
  UpdateProductCommand,
} from '@/types/products'

const { productsAdmin } = API_RESOURCE_ROUTES

/** The API's largest page: the organiser sees every product at once. */
const ADMIN_PAGE_SIZE = 100

const productPath = (id: string): string =>
  `${productsAdmin}/${encodeURIComponent(id)}`

export const getAdminProducts = (): Promise<
  PaginatedResponse<AdminProductDto>
> => api.get(productsAdmin, { params: { page: 1, pageSize: ADMIN_PAGE_SIZE } })

export const getAdminProduct = (id: string): Promise<AdminProductDto> =>
  api.get(productPath(id))

/** Saves a draft visitors cannot see (#6013). */
export const createProduct = (
  command: CreateProductCommand
): Promise<AdminProductDto> => api.post(productsAdmin, command)

export const updateProduct = (
  id: string,
  command: UpdateProductCommand
): Promise<AdminProductDto> => api.put(productPath(id), command)

/** Needs a photo and a size (#6014). */
export const publishProduct = (id: string): Promise<AdminProductDto> =>
  api.post(`${productPath(id)}/publish`)

export const hideProduct = (id: string): Promise<AdminProductDto> =>
  api.post(`${productPath(id)}/hide`)

/** Shown on Shop on the next read (#6016). */
export const setProductStock = (
  id: string,
  command: StockCommand
): Promise<AdminProductDto> => api.put(`${productPath(id)}/stock`, command)

/** Drafts only. */
export const deleteProduct = (id: string): Promise<void> =>
  api.delete(productPath(id))

/** Adds a photo to the end of the product's photos, reporting progress from 0 to 100. */
export const uploadProductPhoto = (
  id: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<PhotoUploadResponse> => {
  const body = new FormData()
  body.append('file', file)
  return api.post(`${productPath(id)}/photo`, body, {
    // Not the client's JSON default: axios would turn the form into JSON. The browser adds the boundary.
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: event => {
      if (event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    },
  })
}
