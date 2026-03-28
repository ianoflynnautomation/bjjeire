import { vi } from 'vitest'

export function mockFetchSuccess(data: object, status = 200): void {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify(data), { status })
  )
}

export function mockFetchError(status: number): void {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(null, { status })
  )
}

export function mockFetchErrorWithMessage(
  status: number,
  message: string
): void {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify({ message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}
