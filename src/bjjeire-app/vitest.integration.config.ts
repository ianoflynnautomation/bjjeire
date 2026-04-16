/// <reference types="vitest" />

import { defineConfig, mergeConfig } from 'vitest/config'
import { baseTestConfig, sharedExclude } from './vitest.base'

export default mergeConfig(
  baseTestConfig(),
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: './src/testing/setup-integration-tests.ts',
      maxWorkers: process.env.CI ? 2 : undefined,
      maxConcurrency: process.env.CI ? 3 : 5,
      slowTestThreshold: 2000,
      include: ['src/**/*.integration.test.{ts,tsx}'],
      exclude: sharedExclude,
    },
  })
)
