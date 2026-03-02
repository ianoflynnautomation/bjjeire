export const ensureExternalUrlScheme = (url?: string): string | undefined => {
  if (!url || url.trim() === '') {return undefined}
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`
  }
  return url
}

export const formatDisplayUrl = (url?: string): string | undefined => {
  if (!url) {return undefined}

  const ensuredUrl = ensureExternalUrlScheme(url)
  if (!ensuredUrl) {return undefined}

  try {
    const parsedUrl = new URL(ensuredUrl)
    const displayHost = parsedUrl.hostname.replace(/^www\./, '')
    let displayPath = parsedUrl.pathname.replace(/\/$/, '')
    if (displayPath === '/') {displayPath = ''}
    return displayHost + displayPath
  } catch {
    return url
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
  }
}
