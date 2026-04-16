/// <reference types="vitest" />

import { defineConfig, mergeConfig } from 'vitest/config'
import tailwindcss from '@tailwindcss/vite'
import { playwright } from '@vitest/browser-playwright'
import { baseTestConfig, sharedExclude } from './vitest.base'

export default mergeConfig(
  baseTestConfig(),
  defineConfig({
    plugins: [tailwindcss()],
    test: {
      name: 'browser',
      setupFiles: './src/testing/setup-browser-tests.ts',
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
