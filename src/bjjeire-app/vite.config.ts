/// <reference types="vite/client" />

import { readFileSync } from 'node:fs'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { sharedPlugins } from './vite.base.config'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8')) as {
  version: string
}

const manualChunkGroups = {
  vendor: [
    'react',
    'react-dom',
    '@tanstack/react-query',
    'react-router-dom',
    'axios',
    'date-fns',
  ],
  msal: ['@azure/msal-browser', '@azure/msal-react'],
  icons: ['@heroicons/react', 'react-icons'],
  forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
} as const

function resolveManualChunk(id: string): string | undefined {
  for (const [chunkName, packages] of Object.entries(manualChunkGroups)) {
    if (packages.some(packageName => id.includes(`/node_modules/${packageName}/`))) {
      return chunkName
    }
  }

  return undefined
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  if (mode === 'development' && !env.SERVICES_API_HTTPS_0 && !env.SERVICES_API_HTTP_0) {
    throw new Error(
      'Missing SERVICES_API_HTTPS_0 or SERVICES_API_HTTP_0 environment variable'
    )
  }

  return {
    base: './',
    define: {
      __APP_VERSION__: JSON.stringify(version),
    },
    plugins: [...sharedPlugins(), tailwindcss()],
    server: {
      port: Number.parseInt(env.PORT) || 80,
      proxy: {
        '/api': {
          target:
            process.env.SERVICES_API_HTTPS_0 || process.env.SERVICES_API_HTTP_0,
          changeOrigin: true,
          secure: !!env.SERVICES_API_HTTPS_0,
        },
      },
    },
    optimizeDeps: {
      exclude: ['fsevents'],
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      minify: 'esbuild',
      rollupOptions: {
        input: './index.html',
        output: {
          manualChunks: resolveManualChunk,
        },
      },
    },
  }
})
