/// <reference types="vitest" />

import { defineConfig, mergeConfig } from 'vitest/config'
import { baseTestConfig, sharedExclude } from './vitest.base'

export default mergeConfig(
  baseTestConfig(),
  defineConfig({
    test: {
      environment: 'node',
      include: ['src/**/*.pact.test.ts'],
      exclude: sharedExclude,
      fileParallelism: false,
      maxWorkers: 1,
      maxConcurrency: 1,
      slowTestThreshold: 2000,
    },
  })
)
