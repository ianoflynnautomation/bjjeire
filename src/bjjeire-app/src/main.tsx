import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initCloudflareAnalytics } from '@/services/cloudflare-analytics'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MsalProvider } from '@azure/msal-react'
import { queryConfig } from '@/lib/react-query'
import { msalInstance } from '@/lib/msal-config'
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
      <MsalProvider instance={msalInstance}>
        <QueryClientProvider client={queryClient}>
          <FeatureFlagProvider flags={flags}>
            <App />
          </FeatureFlagProvider>
        </QueryClientProvider>
      </MsalProvider>
    </StrictMode>
  )
}

async function bootstrap(): Promise<void> {
  try {
    await msalInstance.initialize()
  } catch (error) {
    logger.warn('MSAL init failed; continuing without auth', error)
  }

  let flags: FeatureFlagsMap = DEFAULT_FLAGS
  try {
    flags = await loadFeatureFlags()
  } catch (error) {
    logger.error('Unexpected error resolving feature flags', error)
  }

  render(flags)
}

void bootstrap()
