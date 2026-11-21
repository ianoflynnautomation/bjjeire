import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { uiContent } from '@/config/ui-content'
import { MerchAdminTestIds } from '@/constants/merchDataTestIds'
import {
  ADMIN_PRODUCT_PROBE,
  renderAdminShopPage,
  renderAdminShopProductPage,
  seedAdminProduct,
  seedAdminProducts,
  seedCreateProduct,
  seedDeleteProduct,
  seedProductAction,
  seedProductProblem,
  seedSetStock,
  seedUpdateProduct,
  seedUploadPhoto,
} from '@/features/merch-admin/testing/merch-admin-test-helpers'
import {
  createAdminProduct,
  photoHash,
} from '@/testing/factories/product.factory'
import type { AdminProductDto } from '@/types/products'

const { mockMsal } = vi.hoisted(() => ({
  mockMsal: {
    initialize: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    getAllAccounts: vi.fn<() => object[]>(() => []),
    acquireTokenSilent: vi.fn(() =>
      Promise.resolve({ accessToken: 'organiser-token' })
    ),
    loginPopup: vi.fn<() => Promise<object>>(),
  },
}))

vi.mock('@/lib/msal-config', () => ({
  msalInstance: mockMsal,
  loginRequest: { scopes: ['access_as_writer'] },
}))

const copy = uiContent.merchAdmin
const { signIn } = uiContent.bjjEireCompetitionAdmin
const ID = '0000000000000000000000aa'

function signedIn(): void {
  mockMsal.getAllAccounts.mockReturnValue([{ username: 'owner@bjjeire.test' }])
}

function draft(overrides: Partial<AdminProductDto> = {}): AdminProductDto {
  return createAdminProduct({
    id: ID,
    slug: 'harp-rashguard',
    name: 'Harp Rashguard',
    status: 'DRAFT',
    version: 3,
    ...overrides,
  })
}

beforeEach(() => {
  mockMsal.getAllAccounts.mockReturnValue([])
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('AdminShopPage', () => {
  // #6017: the screens ask for the organiser's sign-in and load nothing without it.
  it('given nobody is signed in, when the page opens, then it asks for the organiser sign-in and requests no products', async () => {
    const list = seedAdminProducts([draft()])
    renderAdminShopPage()

    expect(
      await screen.findByRole('heading', { name: signIn.heading })
    ).toBeInTheDocument()
    expect(screen.getByText(copy.signInMessage)).toBeInTheDocument()
    expect(screen.queryByTestId(MerchAdminTestIds.FORM)).not.toBeInTheDocument()
    expect(list.calls).toHaveLength(0)
  })

  // #6013, #6014
  it('given products in every status, when the organiser opens the shop admin, then each is listed with its status, using the organiser token', async () => {
    signedIn()
    const list = seedAdminProducts([
      draft({ id: '0000000000000000000000a1', name: 'Draft Tee' }),
      draft({
        id: '0000000000000000000000a2',
        name: 'Live Rash',
        status: 'PUBLISHED',
      }),
      draft({
        id: '0000000000000000000000a3',
        name: 'Old Shorts',
        status: 'HIDDEN',
      }),
    ])
    renderAdminShopPage()

    const items = await screen.findAllByTestId(MerchAdminTestIds.LIST_ITEM)
    expect(
      items.map(
        item =>
          within(item).getByTestId(MerchAdminTestIds.LIST_ITEM_STATUS)
            .textContent
      )
    ).toEqual([
      copy.statuses.DRAFT,
      copy.statuses.PUBLISHED,
      copy.statuses.HIDDEN,
    ])
    expect(list.authorization[0]).toBe('Bearer organiser-token')
  })

  // #6013
  it('given the organiser fills in the form, when they save, then a draft is created with the price in cents and the chosen sizes, and its editor opens', async () => {
    signedIn()
    seedAdminProducts([])
    const created = seedCreateProduct(command =>
      draft({ slug: command.slug, name: command.name })
    )
    const { user } = renderAdminShopPage()

    await user.type(
      await screen.findByLabelText(copy.form.name),
      'Harp Rashguard'
    )
    await user.type(screen.getByLabelText(copy.form.slug), 'harp-rashguard')
    await user.selectOptions(screen.getByLabelText(copy.form.kind), 'RASHGUARD')
    await user.type(
      screen.getByLabelText(copy.form.description),
      'Long sleeve.'
    )
    await user.type(screen.getByLabelText(copy.form.price), '45.50')
    await user.click(screen.getByLabelText(copy.form.sizeOffered('M')))
    await user.clear(screen.getByLabelText(copy.form.stockFor('M')))
    await user.type(screen.getByLabelText(copy.form.stockFor('M')), '4')
    await user.click(screen.getByRole('button', { name: copy.create.submit }))

    expect(await screen.findByTestId(ADMIN_PRODUCT_PROBE)).toBeInTheDocument()
    expect(created.calls).toEqual([
      {
        slug: 'harp-rashguard',
        name: 'Harp Rashguard',
        kind: 'RASHGUARD',
        description: 'Long sleeve.',
        priceCents: 4550,
        sizes: [{ id: 'M', stock: 4 }],
      },
    ])
    expect(created.authorization[0]).toBe('Bearer organiser-token')
  })

  // #6013
  it('given the form is incomplete, when the organiser saves, then each problem is shown and nothing is sent', async () => {
    signedIn()
    seedAdminProducts([])
    const created = seedCreateProduct(() => draft())
    const { user } = renderAdminShopPage()

    await user.click(
      await screen.findByRole('button', { name: copy.create.submit })
    )

    expect(
      await screen.findByText(copy.validation.nameRequired)
    ).toBeInTheDocument()
    expect(screen.getByText(copy.validation.slugInvalid)).toBeInTheDocument()
    expect(screen.getByText(copy.validation.priceInvalid)).toBeInTheDocument()
    expect(screen.getByText(copy.validation.sizesRequired)).toBeInTheDocument()
    expect(created.calls).toHaveLength(0)
  })
})

describe('AdminShopProductPage', () => {
  // #6013: photos are added after the draft is saved.
  it('given a draft, when the organiser uploads a photo, then it is sent as a file and the product is read again to show it', async () => {
    signedIn()
    seedAdminProduct(draft(), draft({ photos: [photoHash(1)], version: 4 }))
    const upload = seedUploadPhoto(ID, photoHash(1))
    const { user } = renderAdminShopProductPage(ID)

    expect(await screen.findByText(copy.photos.none)).toBeInTheDocument()
    await user.upload(
      screen.getByLabelText(copy.photos.upload),
      new File(['png'], 'harp.png', { type: 'image/png' })
    )

    await waitFor(() =>
      expect(screen.getAllByTestId(MerchAdminTestIds.PHOTO)).toHaveLength(1)
    )
    expect(upload.calls).toHaveLength(1)
    expect(upload.authorization[0]).toBe('Bearer organiser-token')
  })

  // #6013
  it('given a file over 5 MB or not an image, when the organiser picks it, then it is refused before any upload', async () => {
    signedIn()
    seedAdminProduct(draft())
    const upload = seedUploadPhoto(ID, photoHash(1))
    const { user } = renderAdminShopProductPage(ID)

    const input = await screen.findByLabelText(copy.photos.upload)
    const big = new File(['x'], 'big.jpg', { type: 'image/jpeg' })
    Object.defineProperty(big, 'size', { value: 5 * 1024 * 1024 + 1 })
    await user.upload(input, big)
    expect(await screen.findByText(copy.photos.tooLarge)).toBeInTheDocument()

    // fireEvent, not user.upload: the input's accept list would filter the GIF out first.
    fireEvent.change(input, {
      target: { files: [new File(['gif'], 'anim.gif', { type: 'image/gif' })] },
    })
    expect(await screen.findByText(copy.photos.unsupported)).toBeInTheDocument()
    expect(upload.calls).toHaveLength(0)
  })

  // #6013: the order of photos is the order the shop shows them.
  it('given two photos, when the organiser moves the second earlier, then the product is saved with the new order and its version', async () => {
    signedIn()
    const photos = [photoHash(1), photoHash(2)]
    seedAdminProduct(draft({ photos }))
    const updated = seedUpdateProduct(ID, command =>
      draft({ photos: command.photos, version: 4 })
    )
    const { user } = renderAdminShopProductPage(ID)

    await user.click(
      await screen.findByRole('button', { name: copy.photos.moveEarlier(2) })
    )

    await waitFor(() => expect(updated.calls).toHaveLength(1))
    expect(updated.calls[0].photos).toEqual([photoHash(2), photoHash(1)])
    expect(updated.calls[0].version).toBe(3)
  })

  // #6014
  it('given a draft with a photo, when the organiser publishes it and then hides it, then each status is shown', async () => {
    signedIn()
    seedAdminProduct(draft({ photos: [photoHash(1)] }))
    const published = seedProductAction(ID, 'publish', () =>
      draft({ photos: [photoHash(1)], status: 'PUBLISHED', version: 4 })
    )
    const hidden = seedProductAction(ID, 'hide', () =>
      draft({ photos: [photoHash(1)], status: 'HIDDEN', version: 5 })
    )
    const { user } = renderAdminShopProductPage(ID)

    await user.click(
      await screen.findByRole('button', { name: copy.actions.publish })
    )
    expect(await screen.findByText(copy.actions.published)).toBeInTheDocument()
    expect(screen.getByTestId(MerchAdminTestIds.STATUS)).toHaveTextContent(
      copy.statuses.PUBLISHED
    )

    await user.click(screen.getByRole('button', { name: copy.actions.hide }))
    expect(await screen.findByText(copy.actions.hidden)).toBeInTheDocument()
    expect(screen.getByTestId(MerchAdminTestIds.STATUS)).toHaveTextContent(
      copy.statuses.HIDDEN
    )
    expect(
      screen.getByRole('button', { name: copy.actions.show })
    ).toBeInTheDocument()
    expect(published.calls).toHaveLength(1)
    expect(hidden.calls).toHaveLength(1)
  })

  // #6014: the API's own reason is shown.
  it('given a draft with no photo, when the organiser publishes it, then the API explanation is shown', async () => {
    signedIn()
    seedAdminProduct(draft())
    seedProductProblem('post', `/${ID}/publish`, 409, {
      type: 'urn:bjjeire:product-not-publishable',
      detail:
        'A product needs between 1 and 6 photos before visitors can see it.',
    })
    const { user } = renderAdminShopProductPage(ID)

    await user.click(
      await screen.findByRole('button', { name: copy.actions.publish })
    )

    expect(
      await screen.findByText(
        'A product needs between 1 and 6 photos before visitors can see it.'
      )
    ).toBeInTheDocument()
  })

  // #6015
  it('given a product, when the organiser changes the price and saves, then the update carries the new price and the version it was made from', async () => {
    signedIn()
    seedAdminProduct(draft({ priceCents: 4500 }))
    const updated = seedUpdateProduct(ID, command =>
      draft({ priceCents: command.priceCents, version: 4 })
    )
    const { user } = renderAdminShopProductPage(ID)

    const price = await screen.findByLabelText(copy.form.price)
    await user.clear(price)
    await user.type(price, '50')
    await user.click(screen.getByRole('button', { name: copy.form.save }))

    await waitFor(() => expect(updated.calls).toHaveLength(1))
    expect(updated.calls[0]).toMatchObject({ priceCents: 5000, version: 3 })
  })

  // #6015, #6016
  it('given someone else saved meanwhile, when the organiser saves, then they are told to reload', async () => {
    signedIn()
    seedAdminProduct(draft())
    seedProductProblem('put', `/${ID}`, 409, {
      type: 'urn:bjjeire:conflict',
      detail: 'The resource was modified by someone else. Reload it and retry.',
    })
    const { user } = renderAdminShopProductPage(ID)

    await user.click(
      await screen.findByRole('button', { name: copy.form.save })
    )

    expect(await screen.findByText(copy.errors.stale)).toBeInTheDocument()
  })

  // #6016
  it('given a product, when the organiser sets a size’s stock, then only the stock is sent with the version, and the grid shows what is held and available', async () => {
    signedIn()
    seedAdminProduct(
      draft({
        sizes: [
          { id: 'S', stock: 3, held: 0, available: 3, soldOut: false },
          { id: 'M', stock: 4, held: 1, available: 3, soldOut: false },
        ],
      })
    )
    const stocked = seedSetStock(ID, command =>
      draft({
        version: 4,
        sizes: [
          { id: 'S', stock: 3, held: 0, available: 3, soldOut: false },
          {
            id: 'M',
            stock: command.sizes[1].stock,
            held: 1,
            available: command.sizes[1].stock - 1,
            soldOut: false,
          },
        ],
      })
    )
    const { user } = renderAdminShopProductPage(ID)

    const grid = await screen.findByTestId(MerchAdminTestIds.STOCK)
    const medium = within(grid).getByLabelText(copy.form.stockFor('M'))
    await user.clear(medium)
    await user.type(medium, '9')
    await user.click(
      within(grid).getByRole('button', { name: copy.stock.save })
    )

    expect(await screen.findByText(copy.stock.saved)).toBeInTheDocument()
    expect(stocked.calls).toEqual([
      {
        sizes: [
          { id: 'S', stock: 3 },
          { id: 'M', stock: 9 },
        ],
        version: 3,
      },
    ])
    expect(within(grid).getByText('8')).toBeInTheDocument()
  })

  // #6016: stock never goes below what checkouts hold.
  it('given stock below what is held, when the organiser saves it, then the API explanation naming the number held is shown', async () => {
    signedIn()
    seedAdminProduct(draft())
    seedProductProblem('put', `/${ID}/stock`, 409, {
      type: 'urn:bjjeire:stock-below-held',
      detail:
        'Size M has 2 held in unpaid checkouts. Set its stock to at least 2, or wait for those checkouts to finish.',
    })
    const { user } = renderAdminShopProductPage(ID)

    const grid = await screen.findByTestId(MerchAdminTestIds.STOCK)
    await user.click(
      within(grid).getByRole('button', { name: copy.stock.save })
    )

    expect(
      await within(grid).findByText(/Size M has 2 held in unpaid checkouts/u)
    ).toBeInTheDocument()
  })

  // #6014
  it('given a draft, when the organiser confirms the delete, then it is deleted and the list opens', async () => {
    signedIn()
    seedAdminProduct(draft())
    const deleted = seedDeleteProduct(ID)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { user } = renderAdminShopProductPage(ID)

    await user.click(
      await screen.findByRole('button', { name: copy.actions.delete })
    )

    expect(await screen.findByTestId(ADMIN_PRODUCT_PROBE)).toBeInTheDocument()
    expect(deleted.calls).toHaveLength(1)
  })

  // #6014
  it('given a published product, when the editor opens, then it offers no delete', async () => {
    signedIn()
    seedAdminProduct(draft({ status: 'PUBLISHED', photos: [photoHash(1)] }))
    renderAdminShopProductPage(ID)

    expect(
      await screen.findByRole('button', { name: copy.actions.hide })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: copy.actions.delete })
    ).not.toBeInTheDocument()
  })

  // #6016: the grid never sends back a stock the details form has since changed.
  it('given the organiser saved a new stock in the details form, when the stock grid shows, then it holds the saved stock', async () => {
    signedIn()
    seedAdminProduct(draft())
    seedUpdateProduct(ID, command =>
      draft({
        version: 4,
        sizes: command.sizes.map(size => ({
          ...size,
          held: 0,
          available: size.stock,
          soldOut: size.stock === 0,
        })),
      })
    )
    const { user } = renderAdminShopProductPage(ID)

    const form = await screen.findByTestId(MerchAdminTestIds.FORM)
    const formStock = within(form).getByLabelText(copy.form.stockFor('M'))
    await user.clear(formStock)
    await user.type(formStock, '5')
    await user.click(within(form).getByRole('button', { name: copy.form.save }))

    const grid = screen.getByTestId(MerchAdminTestIds.STOCK)
    await waitFor(() =>
      expect(within(grid).getByLabelText(copy.form.stockFor('M'))).toHaveValue(
        '5'
      )
    )
  })

  // #6013: an unsaved edit survives the other actions on the page.
  it('given an unsaved description, when the organiser uploads a photo, then the description they typed is kept', async () => {
    signedIn()
    const stored = draft()
    seedAdminProduct(stored, { ...stored, photos: [photoHash(1)], version: 4 })
    seedUploadPhoto(ID, photoHash(1))
    const { user } = renderAdminShopProductPage(ID)

    const description = await screen.findByLabelText(copy.form.description)
    await user.clear(description)
    await user.type(description, 'Unsaved words')
    await user.upload(
      screen.getByLabelText(copy.photos.upload),
      new File(['png'], 'harp.png', { type: 'image/png' })
    )

    await waitFor(() =>
      expect(screen.getAllByTestId(MerchAdminTestIds.PHOTO)).toHaveLength(1)
    )
    expect(screen.getByLabelText(copy.form.description)).toHaveValue(
      'Unsaved words'
    )
  })
})
