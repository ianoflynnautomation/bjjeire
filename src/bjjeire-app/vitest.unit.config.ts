/// <reference types="vitest" />

import { defineConfig, mergeConfig } from 'vitest/config'
import { baseTestConfig, sharedExclude } from './vitest.base'

export default mergeConfig(
  baseTestConfig(),
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: './src/testing/setup-tests.ts',
      maxWorkers: process.env.CI ? 4 : undefined,
      maxConcurrency: process.env.CI ? 5 : 10,
      slowTestThreshold: 500,
      include: ['src/**/*.unit.test.{ts,tsx}'],
      exclude: sharedExclude,
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
        exclude: ['src/**/*.d.ts', 'src/testing/**'],
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
)
