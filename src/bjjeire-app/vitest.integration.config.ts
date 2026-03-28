/// <reference types="vitest" />

import { defineConfig } from 'vitest/config'
import { sharedPlugins } from './vite.base.config'

export default defineConfig({
  plugins: sharedPlugins(),
  test: {
    globals: true,
    environment: 'jsdom',
    restoreMocks: true,
    setupFiles: './src/testing/setup-tests.ts',
    reporters: process.env.GITHUB_ACTIONS ? ['default', 'github-actions'] : ['default'],
    maxWorkers: process.env.CI ? 2 : undefined,
    maxConcurrency: process.env.CI ? 3 : 5,
    slowTestThreshold: 2000,
    include: ['src/**/*.integration.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
  },
})
