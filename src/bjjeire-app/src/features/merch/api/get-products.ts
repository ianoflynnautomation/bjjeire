import { api } from '@/lib/api-client'
import { API_RESOURCE_ROUTES } from '@/config/api-routes'
import type { PaginatedResponse } from '@/types/common'
import type { ProductDto, ProductSummaryDto } from '@/types/products'

export const getProducts = ({
  page,
  pageSize,
}: {
  page: number
  pageSize: number
}): Promise<PaginatedResponse<ProductSummaryDto>> =>
  api.get(API_RESOURCE_ROUTES.products, { params: { page, pageSize } })

export const getProduct = (slug: string): Promise<ProductDto> =>
  api.get(`${API_RESOURCE_ROUTES.products}/${encodeURIComponent(slug)}`)
