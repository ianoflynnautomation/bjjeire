import { describe, it, expect } from 'vitest'
import { uiContent } from '@/config/ui-content'
import { createAdminProduct } from '@/testing/factories/product.factory'
import {
  emptyProductForm,
  priceToCents,
  productFormFrom,
  toCreateCommand,
  validateProductForm,
  type ProductFormValues,
} from '../product-form'

const { validation } = uiContent.merchAdmin

function filled(overrides: Partial<ProductFormValues> = {}): ProductFormValues {
  const values = emptyProductForm()
  values.name = 'Harp Rashguard'
  values.slug = 'harp-rashguard'
  values.description = 'Long sleeve.'
  values.price = '45'
  values.sizes.M = { offered: true, stock: '4' }
  return { ...values, ...overrides }
}

describe('product form', () => {
  it.each([
    ['45', 4500],
    ['45.5', 4550],
    ['45.50', 4550],
    ['45,50', 4550],
    ['€45', 4500],
    ['1', 100],
    ['1000', 100000],
  ])('reads the price %s as %d cents', (price, cents) => {
    expect(priceToCents(price)).toBe(cents)
  })

  it.each(['', 'abc', '0.99', '1000.01', '45.555', '-5'])(
    'refuses the price %s',
    price => {
      expect(validateProductForm(filled({ price })).price).toBe(
        validation.priceInvalid
      )
    }
  )

  // #6013: the same limits the API holds.
  it('refuses a missing name, description, a bad address name, no size or a negative stock', () => {
    const values = filled({ name: ' ', description: '', slug: 'Harp Rash' })
    values.sizes.M = { offered: true, stock: '-1' }
    expect(validateProductForm(values)).toEqual({
      name: validation.nameRequired,
      slug: validation.slugInvalid,
      description: validation.descriptionRequired,
      stock: validation.stockInvalid,
    })

    const none = filled()
    none.sizes.M = { offered: false, stock: '4' }
    expect(validateProductForm(none).sizes).toBe(validation.sizesRequired)
  })

  it.each(['admin', 'photo', 'ab', 'a'.repeat(61), '-harp', 'harp-'])(
    'refuses the address name %s',
    slug => {
      expect(validateProductForm(filled({ slug })).slug).toBe(
        validation.slugInvalid
      )
    }
  )

  it('accepts a valid product and builds the command with sizes XS first', () => {
    const values = filled()
    values.sizes.XL = { offered: true, stock: '0' }
    values.sizes.S = { offered: true, stock: '3' }

    expect(validateProductForm(values)).toEqual({})
    expect(toCreateCommand(values)).toEqual({
      slug: 'harp-rashguard',
      name: 'Harp Rashguard',
      kind: 'RASHGUARD',
      description: 'Long sleeve.',
      priceCents: 4500,
      sizes: [
        { id: 'S', stock: 3 },
        { id: 'M', stock: 4 },
        { id: 'XL', stock: 0 },
      ],
    })
  })

  it('fills the form from a stored product', () => {
    const values = productFormFrom(
      createAdminProduct({ priceCents: 4550, slug: 'harp' })
    )
    expect(values.price).toBe('45.50')
    expect(values.slug).toBe('harp')
    expect(values.sizes.S).toEqual({ offered: true, stock: '3' })
    expect(values.sizes.XL).toEqual({ offered: false, stock: '0' })
  })
})
