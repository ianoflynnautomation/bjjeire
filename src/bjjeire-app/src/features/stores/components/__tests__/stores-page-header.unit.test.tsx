import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StoresPageHeader } from '../stores-page-header'
import { StoresPageTestIds } from '@/constants/storeDataTestIds'
import { uiContent } from '@/config/ui-content'

const { pageTitle } = uiContent.stores

describe('StoresPageHeader', () => {
  it('given the stores page, when the header renders, then the page title is shown', () => {
    render(<StoresPageHeader />)

    expect(
      screen.getByTestId(StoresPageTestIds.HEADER_TITLE)
    ).toHaveTextContent(pageTitle.all)
  })

  it.each([
    { totalStores: undefined, case: 'an unknown result count' },
    { totalStores: 0, case: 'zero results' },
  ])(
    'given $case, when the header renders, then the count is hidden',
    ({ totalStores }) => {
      render(<StoresPageHeader totalStores={totalStores} />)

      expect(
        screen.queryByTestId(StoresPageTestIds.HEADER_TOTAL)
      ).not.toBeInTheDocument()
    }
  )

  it('given a single result, when the header renders, then the count uses the singular label', () => {
    render(<StoresPageHeader totalStores={1} />)

    expect(
      screen.getByTestId(StoresPageTestIds.HEADER_TOTAL)
    ).toHaveTextContent(
      `${pageTitle.foundPrefix} 1 ${pageTitle.foundSuffixSingular}`
    )
  })

  it('given multiple results, when the header renders, then the count uses the plural label', () => {
    render(<StoresPageHeader totalStores={5} />)

    expect(
      screen.getByTestId(StoresPageTestIds.HEADER_TOTAL)
    ).toHaveTextContent(
      `${pageTitle.foundPrefix} 5 ${pageTitle.foundSuffixPlural}`
    )
  })
})
