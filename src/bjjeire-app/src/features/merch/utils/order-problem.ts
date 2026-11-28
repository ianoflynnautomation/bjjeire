import { isAxiosError } from 'axios'
import type { BasketChangeDto } from '@/types/orders'

export const BASKET_CHANGED = 'urn:bjjeire:basket-changed'

interface OrderProblem {
  type: string | null
  lines: BasketChangeDto[]
  nowDeliveryCents: number | null
}

/** The `urn:bjjeire:*` problem a refused order request answered with. */
export function orderProblem(error: unknown): OrderProblem {
  const body: unknown = isAxiosError(error) ? error.response?.data : undefined
  const data = (typeof body === 'object' && body !== null ? body : {}) as {
    type?: unknown
    lines?: unknown
    nowDeliveryCents?: unknown
  }
  return {
    type: typeof data.type === 'string' ? data.type : null,
    lines: Array.isArray(data.lines) ? (data.lines as BasketChangeDto[]) : [],
    nowDeliveryCents:
      typeof data.nowDeliveryCents === 'number' ? data.nowDeliveryCents : null,
  }
}

/** A sentence for the problem, from the copy for that page. */
export function problemMessage(
  problems: Readonly<Record<string, string>> & { fallback: string },
  type: string | null
): string {
  if (type === null || type === 'fallback') {
    return problems.fallback
  }
  return (
    Object.entries(problems).find(([known]) => known === type)?.[1] ??
    problems.fallback
  )
}
