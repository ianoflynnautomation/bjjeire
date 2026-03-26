export class FetchError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly url: string
  ) {
    super(message)
    this.name = 'FetchError'
  }
}

export async function fetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`
    try {
      const body = (await res.json()) as { message?: string }
      if (typeof body.message === 'string' && body.message.length > 0) {
        message = body.message
      }
    } catch {
      // Response body is not JSON — keep the default message
    }
    throw new FetchError(message, res.status, url)
  }
  return res.json() as Promise<T>
}
