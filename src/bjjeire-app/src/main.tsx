import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initCloudflareAnalytics } from '@/services/cloudflare-analytics'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { preloadRoute } from '@/config/route-preload'
import { queryConfig } from '@/lib/react-query'
import {
  DEFAULT_FLAGS,
  FeatureFlagProvider,
  loadFeatureFlags,
  type FeatureFlagsMap,
} from '@/features/feature-flags'
import { logger } from '@/lib/logger'
import '@fontsource-variable/hanken-grotesk'
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource-variable/jetbrains-mono'
import './index.css'
import App from './App'

initCloudflareAnalytics()

const queryClient = new QueryClient({
  defaultOptions: queryConfig,
})

const root = document.getElementById('root')
if (!root) {
  throw new Error('No root element found')
}

const reactRoot = createRoot(root)

function render(flags: FeatureFlagsMap): void {
  reactRoot.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <FeatureFlagProvider flags={flags}>
          <App />
        </FeatureFlagProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}

async function bootstrap(): Promise<void> {
  // Load the route chunk alongside the flags rather than after them, so the first
  // render already has the page and never commits the Suspense fallback.
  const routeReady = preloadRoute(globalThis.location.pathname)

  let flags: FeatureFlagsMap = DEFAULT_FLAGS
  try {
    flags = await loadFeatureFlags()
  } catch (error) {
    logger.error('Unexpected error resolving feature flags', error)
  }

  await routeReady
  render(flags)
}

void bootstrap()
