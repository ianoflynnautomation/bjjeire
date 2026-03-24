/// <reference types="vitest" />

import { defineConfig } from 'vitest/config'
import { sharedPlugins } from './vite.base.config'

export default defineConfig({
  plugins: sharedPlugins(),
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/testing/setup-tests.ts',
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/*.browser.test.{ts,tsx}',
    ],
    reporters: ['default', 'junit'],
    outputFile: 'junit.xml',
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/testing/**'],
      reporter: ['text', 'json', 'html', 'cobertura'],
    },
  },
})
