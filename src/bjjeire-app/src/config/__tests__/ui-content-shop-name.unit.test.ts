import { describe, it, expect } from 'vitest'
import { uiContent } from '@/config/ui-content'
import { paths } from '@/config/paths'

// The section is called Shop. The items in its directory are still stores, so
// directory copy such as the empty state ("No Stores Found", kept by #4006) may
// say so. The strings that name the section must say Shop.
const SECTION_NAMED_STORES = /\bStores\b/

describe('Shop section name', () => {
  // #4005
  it('given the Shop route, when its path and label are read, then it is /shop labelled Shop', () => {
    expect(paths.shop.path).toBe('/shop')
    expect(paths.shop.getHref()).toBe('/shop')
    expect(paths.shop.label).toBe('Shop')
  })

  // #4005
  it.each([
    ['document title', uiContent.shop.documentTitle],
    ['page title', uiContent.shop.pageTitle.all],
    ['hero tagline', uiContent.shop.hero.tagline],
    ['hero image alt', uiContent.shop.hero.imageAlt],
  ])(
    'given the Shop %s, when it is read, then it says Shop and does not call the section Stores',
    (_, text) => {
      expect(text).toMatch(/\bShop\b/)
      expect(text).not.toMatch(SECTION_NAMED_STORES)
    }
  )

  // #4005: the nav and footer labels come from paths.
  it('given every SPA path, when it is read, then no label says Stores', () => {
    for (const path of Object.values(paths)) {
      expect(path.label).not.toMatch(/stores/i)
    }
  })
})
