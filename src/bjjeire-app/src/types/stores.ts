import type { BaseApiEntityModel } from './common'

export interface StoreDto extends BaseApiEntityModel {
  name: string
  description?: string
  websiteUrl: string
  logoUrl?: string
  isActive: boolean
}

export interface GetStorePaginationQuery {
  page?: number
  pageSize?: number
}
