/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: './',
    plugins: [react(), viteTsconfigPaths(), tailwindcss()],
    server: {
      port: parseInt(env.PORT) || 80,
      proxy: {
        '/api': {
          target:
          process.env.SERVICES_API_HTTPS_0 || process.env.SERVICES_API_HTTP_0,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/testing/setup-tests.ts',
      exclude: ['**/node_modules/**', '**/e2e/**'],
      coverage: {
        include: ['src/**'],
      },
    },
    optimizeDeps: {
      exclude: ['fsevents'],
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: './index.html',
        external: ['fs/promises'],
        output: {
          experimentalMinChunkSize: 3500,
        },
      },
    },
  };
});