/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr'; 

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  if (!env.SERVICES_API_HTTPS_0 && !env.SERVICES_API_HTTP_0) {
    throw new Error('Missing SERVICES_API_HTTPS_0 or SERVICES_API_HTTP_0 environment variable');
  }

  return {
    base: './',
    plugins: [react(), viteTsconfigPaths(), tailwindcss(), svgr({
      include: '**/*.svg',
      // exclude: undefined,
      svgrOptions: {
        exportType: 'named',
        prettier: false,
        svgo: true,
        svgoConfig: {
          plugins: [
            {
              name: 'preset-default',
              params: {
                overrides: { removeViewBox: false },
              },
            },
          ],
        },
      },
    }),
  ],

    server: {
      port: parseInt(env.PORT) || 80,
      proxy: {
        '/api': {
          target:
          process.env.SERVICES_API_HTTPS_0 || process.env.SERVICES_API_HTTP_0,
          changeOrigin: true,
          secure: env.SERVICES_API_HTTPS_0 ? true : false,
          //rewrite: (path) => path.replace(/^\/api/, ''),

        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/testing/setup-tests.ts',
      exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
      coverage: {
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.d.ts', 'src/testing/**'],
        reporter: ['text', 'json', 'html'],
        all: true,
      },
    },
    optimizeDeps: {
      exclude: ['fsevents'],
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      minify: 'esbuild',
      rollupOptions: {
        input: './index.html',
        external: ['fs/promises'],
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', '@tanstack/react-query', 'react-router-dom'],
          },
      },
    },
    },
  };
});