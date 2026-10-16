const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i

export function ensureExternalUrlScheme(url?: string): string | undefined {
  const trimmedUrl = url?.trim()
  if (!trimmedUrl) {
    return undefined
  }
  if (/^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl
  }
  // A non-http scheme (javascript:, data:, mailto:) must not be rewritten
  // into a link, and must not be prefixed with https://.
  if (HAS_SCHEME.test(trimmedUrl)) {
    return undefined
  }
  return `https://${trimmedUrl}`
}

export function formatDisplayUrl(url?: string): string | undefined {
  if (!url) {
    return undefined
  }
  const ensuredUrl = ensureExternalUrlScheme(url)
  if (!ensuredUrl) {
    return undefined
  }
  try {
    const parsedUrl = new URL(ensuredUrl)
    const displayHost = parsedUrl.hostname.replace(/^www\./, '')
    const displayPath = parsedUrl.pathname.replace(/\/$/, '')
    return displayHost + displayPath
  } catch {
    return ensuredUrl
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
  }
}
