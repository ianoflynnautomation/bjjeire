import type { PluginOption } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import svgr from 'vite-plugin-svgr'

export function sharedPlugins(): PluginOption[] {
  return [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
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
