export const ensureExternalUrlScheme = (url?: string): string | undefined => {
  const trimmedUrl = url?.trim()
  if (!trimmedUrl) {
    return undefined
  }

  if (!/^https?:\/\//i.test(trimmedUrl)) {
    return `https://${trimmedUrl}`
  }
  return trimmedUrl
}

export const formatDisplayUrl = (url?: string): string | undefined => {
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
