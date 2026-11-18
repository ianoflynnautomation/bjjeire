import { describe, it, expect } from 'vitest'
import sitemap from '../../public/sitemap.xml?raw'

const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  ([, loc]) => new URL(loc).pathname
)

describe('sitemap.xml', () => {
  // #4007
  it('given the site map, when its addresses are read, then it lists /shop and not /stores', () => {
    expect(locations).toContain('/shop')
    expect(locations.filter(path => path.startsWith('/stores'))).toEqual([])
  })
})
