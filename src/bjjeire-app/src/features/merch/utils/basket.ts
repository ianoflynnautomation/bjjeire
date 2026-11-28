import { SIZE_IDS, type SizeId } from '@/types/products'

/**
 * The basket lives in this browser only (research R8): which sizes and how
 * many, never prices, tokens or personal data. Prices are read fresh from the
 * catalogue, and the API checks everything again at checkout (#6010).
 */
export const BASKET_STORAGE_KEY = 'bjjeire-basket'

/** The API refuses more (research R7, 409 basket-too-large). */
export const MAX_UNITS_PER_LINE = 10
export const MAX_UNITS_PER_ORDER = 20

const CHANGE_EVENT = 'bjjeire-basket-change'
const LINE_KEYS = ['productId', 'quantity', 'sizeId']

export interface BasketLine {
  productId: string
  sizeId: SizeId
  quantity: number
}

function isLine(value: unknown): value is BasketLine {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const line = value as Record<string, unknown>
  return (
    Object.keys(line).sort().join() === LINE_KEYS.join() &&
    typeof line.productId === 'string' &&
    line.productId !== '' &&
    SIZE_IDS.includes(line.sizeId as SizeId) &&
    Number.isInteger(line.quantity) &&
    (line.quantity as number) >= 1 &&
    (line.quantity as number) <= MAX_UNITS_PER_LINE
  )
}

/** One line per size, and no more in all than one order can hold. */
function isBasket(value: unknown): value is BasketLine[] {
  if (!Array.isArray(value) || !value.every(isLine)) {
    return false
  }
  const sizes = new Set(value.map(line => `${line.productId}/${line.sizeId}`))
  return (
    sizes.size === value.length && basketUnits(value) <= MAX_UNITS_PER_ORDER
  )
}

let cachedRaw: string | null = null
let cachedLines: BasketLine[] = []

/** The stored basket. A corrupt or tampered entry is cleared rather than trusted. */
export function readBasket(): BasketLine[] {
  const raw = localStorage.getItem(BASKET_STORAGE_KEY)
  if (raw === cachedRaw) {
    return cachedLines
  }
  let lines: BasketLine[] = []
  if (raw !== null) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (isBasket(parsed)) {
        lines = parsed
      } else {
        localStorage.removeItem(BASKET_STORAGE_KEY)
      }
    } catch {
      localStorage.removeItem(BASKET_STORAGE_KEY)
    }
  }
  cachedRaw = localStorage.getItem(BASKET_STORAGE_KEY)
  cachedLines = lines
  return lines
}

function write(lines: BasketLine[]): void {
  if (lines.length === 0) {
    localStorage.removeItem(BASKET_STORAGE_KEY)
  } else {
    localStorage.setItem(
      BASKET_STORAGE_KEY,
      JSON.stringify(
        lines.map(({ productId, sizeId, quantity }) => ({
          productId,
          sizeId,
          quantity,
        }))
      )
    )
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function basketUnits(lines: readonly BasketLine[]): number {
  return lines.reduce((units, line) => units + line.quantity, 0)
}

function same(line: BasketLine, productId: string, sizeId: SizeId): boolean {
  return line.productId === productId && line.sizeId === sizeId
}

/**
 * Adds units of a size, never past what is available, 10 of a size or 20 in
 * the basket.
 *
 * @returns how many were added, which may be fewer than asked, or 0
 */
export function addToBasket(
  productId: string,
  sizeId: SizeId,
  quantity: number,
  available: number
): number {
  const lines = readBasket()
  const current = lines.find(line => same(line, productId, sizeId))
  const inLine = current?.quantity ?? 0
  const room = Math.min(
    available - inLine,
    MAX_UNITS_PER_LINE - inLine,
    MAX_UNITS_PER_ORDER - basketUnits(lines)
  )
  const added = Math.max(0, Math.min(quantity, room))
  if (added === 0) {
    return 0
  }
  write(
    current
      ? lines.map(line =>
          line === current ? { ...line, quantity: inLine + added } : line
        )
      : [...lines, { productId, sizeId, quantity: added }]
  )
  return added
}

/** Sets a line's quantity within the limits; 0 or less removes it. */
export function setLineQuantity(
  productId: string,
  sizeId: SizeId,
  quantity: number
): void {
  const lines = readBasket()
  if (quantity <= 0) {
    removeFromBasket(productId, sizeId)
    return
  }
  const others = basketUnits(
    lines.filter(line => !same(line, productId, sizeId))
  )
  const capped = Math.min(
    quantity,
    MAX_UNITS_PER_LINE,
    MAX_UNITS_PER_ORDER - others
  )
  write(
    lines.map(line =>
      same(line, productId, sizeId) ? { ...line, quantity: capped } : line
    )
  )
}

export function removeFromBasket(productId: string, sizeId: SizeId): void {
  write(readBasket().filter(line => !same(line, productId, sizeId)))
}

export function clearBasket(): void {
  write([])
}

/**
 * Calls the listener whenever the basket changes, in this tab or another.
 *
 * @returns a function that stops listening
 */
export function subscribeToBasket(listener: () => void): () => void {
  const onStorage = (event: StorageEvent): void => {
    if (event.key === null || event.key === BASKET_STORAGE_KEY) {
      listener()
    }
  }
  window.addEventListener(CHANGE_EVENT, listener)
  window.addEventListener('storage', onStorage)
  return (): void => {
    window.removeEventListener(CHANGE_EVENT, listener)
    window.removeEventListener('storage', onStorage)
  }
}
