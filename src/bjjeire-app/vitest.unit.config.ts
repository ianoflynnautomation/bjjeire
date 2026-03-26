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
    reporters: process.env.GITHUB_ACTIONS
      ? ['default', 'github-actions']
      : ['default'],
    maxWorkers: process.env.CI ? 4 : undefined,
    maxConcurrency: process.env.CI ? 5 : 10,
    slowTestThreshold: 500,
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/*.browser.test.{ts,tsx}',
      '**/*.integration.test.{ts,tsx}',
    ],
    coverage: {
      include: [
        'src/utils/**',
        'src/lib/**',
        'src/features/**/api/**',
        'src/hooks/**',
        'src/config/**',
        'src/constants/**',
      ],
      exclude: ['src/**/*.d.ts', 'src/testing/**'],
      reporter: ['text', 'json', 'html', 'cobertura'],
    },
  },
})
