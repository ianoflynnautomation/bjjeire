/// <reference types="vitest" />

import { defineConfig, mergeConfig } from 'vitest/config'
import { baseTestConfig, sharedExclude } from './vitest.base'

export default mergeConfig(
  baseTestConfig(),
  defineConfig({
    test: {
      name: 'unit',
      environment: 'jsdom',
      setupFiles: './src/testing/setup-tests.ts',
      sequence: { groupOrder: 1 },
      maxWorkers: process.env.CI ? 4 : undefined,
      maxConcurrency: process.env.CI ? 5 : 10,
      slowTestThreshold: 500,
      include: ['src/**/*.unit.test.{ts,tsx}'],
      exclude: sharedExclude,
    },
  })
)
