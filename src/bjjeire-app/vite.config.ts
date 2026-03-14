/// <reference types="vitest" />
/// <reference types="vite/client" />

import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'
import { defineConfig, loadEnv } from 'vite'
import viteTsconfigPaths from 'vite-tsconfig-paths'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string }

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  if (mode !== 'test' && !env.SERVICES_API_HTTPS_0 && !env.SERVICES_API_HTTP_0) {
    throw new Error(
      'Missing SERVICES_API_HTTPS_0 or SERVICES_API_HTTP_0 environment variable'
    )
  }

  return {
    base: './',
    define: {
      __APP_VERSION__: JSON.stringify(version),
    },
    plugins: [
      react(),
      viteTsconfigPaths(),
      tailwindcss(),
      svgr({
        include: '**/*.svg',
        // exclude: undefined,
        svgrOptions: {
          exportType: 'named',
          prettier: false,
          svgo: true,
          svgoConfig: {
            plugins: [
              {
                name: 'preset-default',
                params: {
                  overrides: { removeViewBox: false },
                },
              },
            ],
          },
        },
      }),
    ],

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
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/testing/setup-tests.ts',
      exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
      reporters: ['default', 'junit'],
      outputFile: 'junit.xml',
      coverage: {
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.d.ts', 'src/testing/**'],
        reporter: ['text', 'json', 'html', 'cobertura'],
        all: true,
      },
      // minThreads: 1,
      // maxThreads: 4,
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
        // external: ['fs/promises'],
        output: {
          manualChunks: {
            vendor: [
              'react',
              'react-dom',
              '@tanstack/react-query',
              'react-router-dom',
            ],
          },
        },
      },
    },
  }
})
