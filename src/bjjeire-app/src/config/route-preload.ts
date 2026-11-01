import { AboutPage, features } from '@/config/features'
import { paths } from '@/config/paths'
import { logger } from '@/lib/logger'
import type { PreloadableComponent } from '@/lib/lazy-with-preload'

/** Longest the first paint waits for the route chunk before showing the fallback instead. */
export const ROUTE_PRELOAD_TIMEOUT_MS = 1000

function componentForPath(pathname: string): PreloadableComponent | undefined {
  if (pathname === paths.home.path) {
    return features[0].Component
  }
  if (pathname === paths.about.path) {
    return AboutPage
  }
  return features.find(feature => feature.path === pathname)?.Component
}

/**
 * Starts loading the chunk for the route being opened. Never rejects: a failed or
 * slow chunk falls through to the normal lazy path and its error handling.
 */
export async function preloadRoute(pathname: string): Promise<void> {
  const component = componentForPath(pathname)
  if (!component) {
    return
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<void>(resolve => {
    timer = setTimeout(resolve, ROUTE_PRELOAD_TIMEOUT_MS)
  })

  try {
    await Promise.race([component.preload(), timeout])
  } catch (error) {
    logger.warn('Route chunk preload failed', error)
  } finally {
    clearTimeout(timer)
  }
}
