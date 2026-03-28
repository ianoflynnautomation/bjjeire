/// <reference types="vitest" />

import { defineConfig } from 'vitest/config'
import tailwindcss from '@tailwindcss/vite'
import { playwright } from '@vitest/browser-playwright'
import { sharedPlugins } from './vite.base.config'

export default defineConfig({
  plugins: [...sharedPlugins(), tailwindcss()],
  test: {
    globals: true,
    name: 'browser',
    setupFiles: './src/testing/setup-browser-tests.ts',
    reporters: process.env.GITHUB_ACTIONS ? ['default', 'github-actions'] : ['default'],
    maxWorkers: process.env.CI ? 2 : undefined,
    maxConcurrency: process.env.CI ? 2 : 5,
    slowTestThreshold: 1000,
    include: ['src/**/*.browser.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
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
      // Default viewport is 414×896 (mobile). Override per-instance if you add a desktop suite:
      // instances: [{ browser: 'chromium', headless: true, viewport: { width: 1280, height: 720 } }]
    },
  },
})
