import type { PluginOption } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import svgr from 'vite-plugin-svgr'

/**
 * Where built assets load from. Absolute, because routes such as
 * /admin/tournaments are two levels deep: a relative './' would resolve their
 * scripts under /admin/assets/, which the server answers with index.html.
 * Every environment serves the app at the root of its own host name.
 */
export const ASSET_BASE = '/'

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
