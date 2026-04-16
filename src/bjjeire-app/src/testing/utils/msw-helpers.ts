import { http, HttpResponse, type HttpHandler, type JsonBodyType } from 'msw'

export function jsonHandler<T extends JsonBodyType>(
  url: string,
  body: T,
  status = 200
): HttpHandler {
  return http.get(url, () => HttpResponse.json(body, { status }))
}

export function errorHandler(url: string, status = 500): HttpHandler {
  return http.get(url, () => HttpResponse.json(null, { status }))
}

export function pendingHandler(url: string): HttpHandler {
  return http.get(url, () => new Promise(() => {}))
}

export function captureRequest(
  url: string,
  respond: (searchParams: URLSearchParams) => JsonBodyType
): { handler: HttpHandler; getLastUrl: () => URL | null } {
  let lastUrl: URL | null = null
  const handler = http.get(url, ({ request }) => {
    lastUrl = new URL(request.url)
    return HttpResponse.json(respond(lastUrl.searchParams))
  })
  return { handler, getLastUrl: (): URL | null => lastUrl }
}
