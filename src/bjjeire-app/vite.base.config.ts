import type { PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import viteTsconfigPaths from 'vite-tsconfig-paths'
import svgr from 'vite-plugin-svgr'

export function sharedPlugins(): PluginOption[] {
  return [
    react(),
    viteTsconfigPaths(),
    svgr({
      include: '**/*.svg',
      svgrOptions: {
        exportType: 'named',
        prettier: false,
        svgo: true,
        svgoConfig: {
          plugins: [
            {
              name: 'preset-default',
              params: { overrides: { removeViewBox: false } },
            },
          ],
        },
      },
    }),
  ]
}
