/// <reference types="vitest" />

import { defineConfig, mergeConfig } from 'vitest/config'
import tailwindcss from '@tailwindcss/vite'
import { playwright } from '@vitest/browser-playwright'
import { baseTestConfig, sharedExclude } from './vitest.base'

process.env.VITE_APP_URL ??= 'http://localhost:3000'

export default mergeConfig(
  baseTestConfig(),
  defineConfig({
    plugins: [tailwindcss()],
    // Pre-bundle deps discovered mid-run; otherwise Vite reloads the page and
    // the in-flight test file fails to import ("Failed to fetch dynamically
    // imported module").
    optimizeDeps: {
      include: ['react-dom/client'],
    },
    test: {
      name: 'browser',
      retry: process.env.CI ? 1 : 0,
      setupFiles: './src/testing/setup-browser-tests.ts',
      sequence: { groupOrder: 3 },
      maxWorkers: process.env.CI ? 2 : undefined,
      maxConcurrency: process.env.CI ? 2 : 5,
      slowTestThreshold: 1000,
      include: ['src/**/*.browser.test.{ts,tsx}'],
      exclude: sharedExclude,
      browser: {
        enabled: true,
        provider: playwright(),
        instances: [{ browser: 'chromium', headless: true }],
        trace: {
          mode: 'on-first-retry',
          screenshots: true,
          snapshots: true,
        },
        screenshotFailures: true,
        screenshotDirectory: '__screenshots__',
      },
    },
  })
)
