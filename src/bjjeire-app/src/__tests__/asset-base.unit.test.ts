import { describe, it, expect } from 'vitest'
import { ASSET_BASE } from '../../vite.base.config'

describe('production build', () => {
  // A relative base ('./') makes a direct load of a two-level route such as
  // /admin/tournaments ask for /admin/assets/…, which the server answers with
  // index.html, so the page stays blank. Every environment serves the app at
  // the root of its own host name.
  it('given the build configuration, when its asset base is read, then assets load from the site root', () => {
    expect(ASSET_BASE).toBe('/')
  })
})
