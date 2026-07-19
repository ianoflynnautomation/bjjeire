import type { UserConfig } from 'vitest/config'
import { sharedPlugins } from './vite.base.config'

export function baseTestConfig(): UserConfig {
  return {
    plugins: sharedPlugins(),
    resolve: {
      tsconfigPaths: true,
    },
    test: {
      globals: true,
      restoreMocks: true,
    },
  }
}

export const sharedExclude = ['**/node_modules/**', '**/dist/**', '**/e2e/**']
