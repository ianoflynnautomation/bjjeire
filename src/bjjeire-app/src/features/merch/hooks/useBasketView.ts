import { useQueries, useQuery } from '@tanstack/react-query'
import { getProduct, getProducts } from '../api/get-products'
import { MERCH_STALE_TIME_MS } from './merch-query-options'
import { useBasket } from './useBasket'
import type { BasketLine } from '../utils/basket'
import type { ProductDto, ProductSummaryDto } from '@/types/products'

/** Why a basket line cannot be bought as it is (#6010). */
export type BasketLineProblem = 'UNAVAILABLE' | 'SOLD_OUT' | null

export interface BasketLineView extends BasketLine {
  name: string | null
  slug: string | null
  photo: string | null
  /** The current price, read fresh from the catalogue. */
  unitPriceCents: number | null
  /** How many of this size can be bought now, or null while unknown. */
  available: number | null
  problem: BasketLineProblem
}

export interface BasketView {
  lines: BasketLineView[]
  itemsCents: number
  isLoading: boolean
  isError: boolean
  /** Every line can be bought as it is. */
  canCheckout: boolean
  refetch: () => void
}

/** The whole published catalogue fits in one page (tens of products). */
const CATALOGUE = { page: 1, pageSize: 100 }

function viewOf(
  line: BasketLine,
  summary: ProductSummaryDto | undefined,
  product: ProductDto | undefined
): BasketLineView {
  const size = product?.sizes.find(entry => entry.id === line.sizeId)
  let problem: BasketLineProblem = null
  if (summary === undefined || (product !== undefined && size === undefined)) {
    problem = 'UNAVAILABLE'
  } else if (size !== undefined && size.available === 0) {
    problem = 'SOLD_OUT'
  }
  return {
    ...line,
    name: summary?.name ?? null,
    slug: summary?.slug ?? null,
    photo: summary?.photo ?? null,
    unitPriceCents: product?.priceCents ?? summary?.priceCents ?? null,
    available: size?.available ?? null,
    problem,
  }
}

/**
 * The basket with each line's name, current price and availability. The
 * basket holds no prices (research R8), so they come from the catalogue.
 */
export function useBasketView(): BasketView {
  const lines = useBasket()
  const catalogue = useQuery({
    queryKey: ['merch', 'products', CATALOGUE],
    queryFn: () => getProducts(CATALOGUE),
    staleTime: MERCH_STALE_TIME_MS,
    enabled: lines.length > 0,
  })
  const summaries = new Map(
    (catalogue.data?.data ?? []).map(summary => [summary.id, summary])
  )
  const slugs = [
    ...new Set(
      lines.flatMap(line => {
        const slug = summaries.get(line.productId)?.slug
        return slug === undefined ? [] : [slug]
      })
    ),
  ]
  const products = useQueries({
    queries: slugs.map(slug => ({
      queryKey: ['merch', 'product', slug],
      queryFn: (): Promise<ProductDto> => getProduct(slug),
      staleTime: MERCH_STALE_TIME_MS,
    })),
  })
  const bySlug = new Map<string, ProductDto>()
  products.forEach(query => {
    if (query.data) {
      bySlug.set(query.data.slug, query.data)
    }
  })

  const views = lines.map(line => {
    const summary = summaries.get(line.productId)
    return viewOf(
      line,
      summary,
      summary === undefined ? undefined : bySlug.get(summary.slug)
    )
  })
  const isLoading =
    lines.length > 0 &&
    (catalogue.isLoading || products.some(query => query.isLoading))
  return {
    lines: views,
    itemsCents: views.reduce(
      (sum, line) =>
        line.problem === null && line.unitPriceCents !== null
          ? sum + line.unitPriceCents * line.quantity
          : sum,
      0
    ),
    isLoading,
    isError: catalogue.isError || products.some(query => query.isError),
    refetch: (): void => {
      void catalogue.refetch()
      products.forEach(query => void query.refetch())
    },
    canCheckout:
      views.length > 0 &&
      !isLoading &&
      views.every(
        line =>
          line.problem === null &&
          line.unitPriceCents !== null &&
          (line.available === null || line.quantity <= line.available)
      ),
  }
}
