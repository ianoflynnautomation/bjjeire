import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { initCloudflareAnalytics } from '@/services/cloudflare-analytics'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MsalProvider } from '@azure/msal-react'
import { queryConfig } from '@/lib/react-query'
import { msalInstance } from '@/lib/msal-config'
import './index.css'
import App from './App.tsx'

initCloudflareAnalytics()

const queryClient = new QueryClient({
  defaultOptions: queryConfig,
})

const root = document.getElementById('root')
if (!root) {
  throw new Error('No root element found')
}

const reactRoot = createRoot(root)

const render = (): void => {
  reactRoot.render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </MsalProvider>
    </React.StrictMode>
  )
}

void msalInstance.initialize().then(render).catch(render)
