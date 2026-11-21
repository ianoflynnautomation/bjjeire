import { API_ROUTES } from '@/config/api-routes'
import { env } from '@/config/env'

/** `€45.00` from 4500. Money is whole cents everywhere; only display divides. */
export function formatPrice(cents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(
    cents / 100
  )
}

/** The address of a stored product photo. The hash comes from the API, never from the visitor. */
export function productPhotoUrl(sha256: string): string {
  return `${env.API_URL}${API_ROUTES.products}/photo/${encodeURIComponent(sha256)}`
}
