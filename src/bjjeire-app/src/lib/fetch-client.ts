import { AppError } from '@/lib/errors'
import { logger } from '@/lib/logger'

export class FetchError extends AppError {
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
  let res: Response
  try {
    res = await fetch(url, options)
  } catch (cause) {
    logger.error('Network error — request could not be sent:', { url, cause })
    throw cause
  }

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`
    try {
      const body = (await res.json()) as { message?: string }
      if (typeof body.message === 'string' && body.message.length > 0) {
        message = body.message
      }
    } catch (err) {
      logger.warn(
        'fetch-client: response body is not JSON — using default message',
        err
      )
    }
    const error = new FetchError(message, res.status, url)
    logger.error('Fetch error:', { url, status: res.status, message })
    throw error
  }

  return res.json() as Promise<T>
}
