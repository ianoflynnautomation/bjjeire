/// <reference types="vitest" />

import { defineConfig } from 'vitest/config'

// Root config: coverage and reporters are root-only options in Vitest
// projects mode. Per-suite options live in the vitest.*.config.ts projects.
export default defineConfig({
  test: {
    reporters: process.env.GITHUB_ACTIONS
      ? ['default', 'github-actions']
      : ['default'],
    projects: [
      './vitest.unit.config.ts',
      './vitest.integration.config.ts',
      './vitest.browser.config.ts',
      './vitest.pact.config.ts',
    ],
    coverage: {
      include: [
        'src/utils/**',
        'src/lib/**',
        'src/features/**',
        'src/components/**',
        'src/hooks/**',
        'src/config/**',
        'src/constants/**',
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/testing/**',
        'src/features/*/testing/**',
        'src/**/__tests__/**',
      ],
      reporter: ['text', 'json', 'html', 'cobertura'],
      thresholds: {
        lines: 70,
        branches: 70,
        functions: 70,
        statements: 70,
      },
    },
  },
})
