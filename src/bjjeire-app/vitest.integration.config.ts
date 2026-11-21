/// <reference types="vitest" />

import { defineConfig, mergeConfig } from 'vitest/config'
import { baseTestConfig, sharedExclude } from './vitest.base'

export default mergeConfig(
  baseTestConfig(),
  defineConfig({
    test: {
      name: 'integration',
      environment: 'jsdom',
      // MSW 3 intercepts at the socket, so jsdom applies real CORS. The API
      // origin in tests is http://localhost (env.API_URL). Vitest's default
      // document URL is http://localhost:3000, which makes those requests
      // cross-origin and Axios surfaces them as Network Error.
      environmentOptions: {
        jsdom: { url: 'http://localhost/' },
      },
      setupFiles: './src/testing/setup-integration-tests.ts',
      sequence: { groupOrder: 2 },
      maxWorkers: process.env.CI ? 2 : undefined,
      maxConcurrency: process.env.CI ? 3 : 5,
      slowTestThreshold: 2000,
      include: ['src/**/*.integration.test.{ts,tsx}'],
      exclude: sharedExclude,
    },
  })
)
