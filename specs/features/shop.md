# Feature: Shop

**Status**: In progress. Part 1 (the directory, renamed from Stores) is shipped: slice 1 of [specs/003-bjjeire-merch-shop/](../003-bjjeire-merch-shop/spec.md). Part 2 (BJJ Éire merch) is designed there. Built so far: its plumbing (slice 0) and the catalogue with the organiser's product admin (slice 2). Basket, checkout, orders and the dashboard are not built.
**Design record**: [../003-bjjeire-merch-shop/](../003-bjjeire-merch-shop/spec.md)
**Database**: [store.md](../database-contracts/store.md) (directory), [product.md](../database-contracts/product.md) (merch)
**API**: `/api/v1/store` (directory, unchanged by the rename), `/api/v1/product` (merch catalogue and product admin)
**SPA route**: `/shop`. The old `/stores` address, and anything under it, redirects to `/shop`. Merch: `/shop/products/:slug`, `/admin/shop`, `/admin/shop/products/:id`.
**Feature flags**: `Stores` (the directory, fail-closed). The flag keeps its name. `Merch` (BJJ Éire merch, `FEATURE_MERCH`, fail-closed, off by default; ADR-0016).
**Acceptance**: `bjjeire-tests/specs/features/shop.md`, `bjjeire-tests/tests/features/stores/`
**Requirements**: `bjjeire/requirements` · epic `&4` (`#4001`–`#4007`) · merch epic (`#6001`–`#6028`, provisional)

The section visitors used to know as Stores is called **Shop**. Only the
visible name and the address changed. The directory's API, collection, flag
and test ids keep their store names, so no published contract moved.

# Part 1: Directory

## User Story 1 — Browse stores (P1)

1. Given available stores, when a visitor opens Shop, then the store list is displayed
2. Given stores are published, when a client opens the directory, then each published store is returned with its details
3. Given stores are published, when a client opens the directory, then they are ordered by name

## User Story 2 — Search (P1)

1. Given a store name / part of a name, when a visitor searches, then only that store is displayed

Search matches the store name only and is client-side. No county filter.

## User Story 3 — Empty and error (P2)

Same empty / network / server-error pattern as gyms.

## User Story 4 — Stores becomes Shop (P1)

1. `#4005`: Given a visitor on any page, when they look at the site navigation, then the entry that said "Stores" says "Shop" and opens the Shop page; no visible text calls the section "Stores"
2. `#4006`: Given published directory stores, when a visitor opens Shop, then they see the same store cards, order, search, empty state and error handling that Stores had
3. `#4007`: Given a link or bookmark to the old Stores address, when a visitor follows it, then they land on the Shop page, and the site map lists only the Shop address

The page heading and tab title say Shop. Directory copy that names the items
still says stores (the search label, the counts, the "No Stores Found" empty
state), because those are stores. The redirect goes through the `Stores`
switch: with it off, `/stores` and `/shop` land on the default page as before.

## Requirements

- **FR-001**: Public `GET /api/v1/store` returns `PagedResponse<StoreDto>`
- **FR-002**: Default order is name
- **FR-003**: Public reads, authenticated writes
- **FR-004**: The section is called Shop at `/shop`; `/stores/*` redirects there with `replace`; the site map lists `/shop` and not `/stores`

## Success criteria

- **SC-001**: A visitor can isolate a seeded store with search
- **SC-002**: Directory browsing shows no change in behaviour apart from the new name and address

# Part 2: BJJ Éire merch

The `Merch` switch is off by default. While it is off, every product and
order route answers 404 ahead of sign-in (`#6026`), Shop requests no product,
and nothing a visitor already does changed (`#6027`). Decisions:
[ADR-0016](../../docs/adr/0016-bjjeire-merch-guest-checkout.md).

## User Story 5 — Shopper browses BJJ Éire merch at the top of Shop (P1)

A visitor opens Shop and first sees BJJ Éire's own merch in a featured
section, above the directory.

1. `#6001`: Given published products, when a visitor opens Shop, then a "BJJ Éire merch" section above the directory search shows each product with photo, name, kind, price in euro and an "Out of stock" mark when no size is in stock
2. `#6002`: Given a published product, when a visitor opens it, then they see its photos, description, price and every size it comes in, with sold-out sizes shown and not selectable
3. `#6003`: Given no product is published, when a visitor opens Shop, then there is no merch section and no placeholder, and the directory shows as before
4. `#6004`: Given a visitor on Shop, when they search the directory or move between its pages, then only the directory is filtered or paged and the merch section stays as it is

Products are listed by kind (rashguards, shorts, t-shirts), then name. A
size is sold out when nothing is left beyond what unpaid checkouts hold; the
shop never shows stock counts or holds. A draft or hidden product's page says
"Product not found" with a link back to Shop. If the products cannot be
loaded, Shop shows the directory without the section and without an error.
Product photos are never cropped.

## User Story 6 — Organiser manages products and stock (P1)

The organiser signs in to `/admin/shop` with the existing organiser sign-in.

1. `#6013`: Given the organiser is signed in, when they save a product with name, kind, description, price and at least one size with its stock, and then add its photos, then it is stored as a draft that visitors cannot see. A draft may have no photo yet; publishing needs at least one (`#6014`)
2. `#6014`: Given a draft product, when the organiser publishes it, then visitors see it in the merch section; when the organiser hides it, then visitors no longer see or buy it, and orders already placed for it are unchanged
3. `#6015`: Given a product, when the organiser changes its price, then new baskets use the new price and orders already paid keep the price they paid
4. `#6016`: Given a product size, when the organiser sets or adjusts its stock, then the shop shows the new availability straight away
5. `#6017`: Given a person who is not the organiser, when they try to create, edit, publish, hide or restock a product, then they are refused

Rules:

- A product has a name (up to 80 characters), an address name (3–60 lowercase letters, digits and hyphens, not `admin` or `photo`), a kind, a description (up to 2,000 characters), a price between €1 and €1,000 including VAT, and one or more of the sizes XS to XXL with a stock count each.
- Photos are JPEG, PNG or WebP, up to 5 MB each and six per product, uploaded after the draft is saved. The organiser orders and removes them; the first is the one Shop shows. A photo no product uses any more is deleted.
- Publishing needs one to six photos and at least one size. A hidden product can be shown again. Only a draft can be deleted.
- Stock cannot be set below what unpaid checkouts hold of a size, and a size they hold cannot be removed; the organiser is told how many are held.
- An edit made from an old copy, after someone else saved or a checkout changed what is held, is refused: the organiser reloads and retries.
- Shop shows a change to stock, price or visibility within a minute, on every API replica.
- Every organiser change is recorded in the audit log.

Until checkout ships (slice 3), nothing is held and no order exists, so
`#6015`'s "orders already paid keep the price they paid" is proven with the
order tests.

## Not built yet

Stories 3 (basket and payment), 5 (orders and refunds), 6 (dashboard) and the
rest of 7 of the design record, `#6005`–`#6012` and `#6018`–`#6028`, are
specified in [specs/003-bjjeire-merch-shop/spec.md](../003-bjjeire-merch-shop/spec.md)
and move here as each slice ships.
