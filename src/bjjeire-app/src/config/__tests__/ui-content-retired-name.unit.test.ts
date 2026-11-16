import { describe, it, expect } from 'vitest'
import { uiContent } from '@/config/ui-content'
import { paths } from '@/config/paths'

import { RETIRED_NAME_PATTERN as OLD_NAME } from '@/testing/retired-name'

describe('user-visible copy', () => {
  // #3011
  it('given every string in uiContent, when it is read, then none uses the retired name', () => {
    expect(JSON.stringify(uiContent)).not.toMatch(OLD_NAME)
  })

  // #3011, #3016
  it('given every SPA path and label, when it is read, then none uses the retired name', () => {
    expect(JSON.stringify(paths)).not.toMatch(OLD_NAME)
    expect(
      Object.values(paths).map(path =>
        'getHref' in path ? path.getHref.toString() : ''
      )
    ).not.toContainEqual(expect.stringMatching(OLD_NAME))
  })
})
