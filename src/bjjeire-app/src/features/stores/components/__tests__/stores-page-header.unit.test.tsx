import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StoresPageHeader } from '../stores-page-header'
import { StoresPageTestIds } from '@/constants/storeDataTestIds'
import { uiContent } from '@/config/ui-content'

const { pageTitle } = uiContent.stores

describe('StoresPageHeader', () => {
  it('renders the page title', () => {
    render(<StoresPageHeader />)

    expect(
      screen.getByTestId(StoresPageTestIds.HEADER_TITLE)
    ).toHaveTextContent(pageTitle.all)
  })

  it('does not show total label when totalStores is undefined', () => {
    render(<StoresPageHeader />)

    expect(
      screen.queryByTestId(StoresPageTestIds.HEADER_TOTAL)
    ).not.toBeInTheDocument()
  })

  it('does not show total label when totalStores is 0', () => {
    render(<StoresPageHeader totalStores={0} />)

    expect(
      screen.queryByTestId(StoresPageTestIds.HEADER_TOTAL)
    ).not.toBeInTheDocument()
  })

  it('shows singular suffix for 1 store', () => {
    render(<StoresPageHeader totalStores={1} />)

    expect(
      screen.getByTestId(StoresPageTestIds.HEADER_TOTAL)
    ).toHaveTextContent(
      `${pageTitle.foundPrefix} 1 ${pageTitle.foundSuffixSingular}`
    )
  })

  it('shows plural suffix for multiple stores', () => {
    render(<StoresPageHeader totalStores={5} />)

    expect(
      screen.getByTestId(StoresPageTestIds.HEADER_TOTAL)
    ).toHaveTextContent(
      `${pageTitle.foundPrefix} 5 ${pageTitle.foundSuffixPlural}`
    )
  })

  it('uses the provided data-testid', () => {
    render(<StoresPageHeader data-testid="custom-header" />)

    expect(screen.getByTestId('custom-header')).toBeInTheDocument()
  })
})
