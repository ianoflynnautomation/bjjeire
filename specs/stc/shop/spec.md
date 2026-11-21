---
feature: shop
ssot: specs/features/shop.md
database: specs/database-contracts/store.md, specs/database-contracts/product.md
api_package: com.bjjeire.api.store, com.bjjeire.api.product
spa: src/bjjeire-app/src/features/stores, src/bjjeire-app/src/features/merch, src/bjjeire-app/src/features/merch-admin
acceptance: bjjeire-tests/tests/features/stores/
status: living
---

# STC: Shop

**Requirements**: `bjjeire/requirements` · epic `&4` (directory) · merch epic (`#6001`–`#6028`, provisional; added as their slices ship: `#6026`, `#6027` with slice 0; `#6001`–`#6004`, `#6013`–`#6017` with slice 2)

## User intent

A visitor opens Shop (formerly Stores) and sees published stores they can scan and search.
Search is client-side. There is no county filter. The Stores feature flag
fails closed.

The living feature spec still says “authenticated writes”. The **controller
is GET-only** today. This overlay describes the served surface.

Narrative SSOT: [specs/features/shop.md](../../features/shop.md).

## Acceptance criteria

### `#4001` — List published stores (P1)

Given published stores exist,
When a client calls `GET /api/v1/store`,
Then the response is `PagedResponse<StoreDto>` ordered by name,
And inactive stores are excluded.

**Owns**: T2 `StoreMongoRepositoryIT`.

### `#4002` — Client-side name search (P1)

Given a loaded stores page,
When the visitor types a name,
Then only matching cards remain.

**Owns**: T4 `shop-page.integration.test.tsx`.

### `#4003` — Empty, error, pagination (P2)

Given no stores / 500,
When the visitor is on Shop,
Then the matching empty or error state is shown.
Given more than one page,
When the visitor pages,
Then each page is a distinct slice.

**Owns**: T4 page integration.

### `#4004` — Pagination query validation (P2)

When `page` is not a number,
Then the API returns 400.

**Owns**: T1 `StoreControllerTest`.

### `#4005` — The section is called Shop (P1)

Given a visitor on any page,
When they look at the site navigation,
Then the entry that said "Stores" says "Shop" and opens `/shop`,
And no visible text calls the section "Stores".

**Owns**: T3 `use-nav-items.unit.test.tsx`, `ui-content-shop-name.unit.test.ts`; T4 `shop-page.integration.test.tsx` (heading), `document-title.integration.test.tsx`. **T6**: `bjjeire-tests`.

### `#4006` — The directory is unchanged on Shop (P1)

Given published directory stores,
When a visitor opens Shop,
Then they see the same store cards, order, search, empty state and error handling that Stores had.

**Owns**: T4 `shop-page.integration.test.tsx`. **T6**: `bjjeire-tests`.

### `#4007` — Old Stores addresses lead to Shop (P1)

Given a link or bookmark to `/stores` or anything under it,
When a visitor follows it,
Then they land on `/shop` (history replaced),
And the site map lists `/shop` and not `/stores`.
Given the `Stores` switch is off,
When a visitor opens `/stores` or `/shop`,
Then they land on the default page as before.

**Owns**: T4 `app-routes.integration.test.tsx`; T3 `sitemap.unit.test.ts`. **T6**: `bjjeire-tests`.

### `#6026` — Merch switched off leaves only the directory (P1)

Given the `Merch` switch is off (the default, `FEATURE_MERCH=false`),
When anyone calls a product or order route (`/api/v1/product/**`, `/api/v1/order/**`, including the shop's webhook),
Then the API answers 404 `urn:bjjeire:not-found` with a `traceId`, before authentication, whatever the token,
And `GET /api/v1/featureflag` reports `"Merch": false`,
And the SPA treats an unreachable flag service as merch off.

_Slice 0 owns the API side. The SPA side (no merch section, basket, product page or merch admin screen) lands with those screens in slices 2–4._

**Owns**: T1 `MerchFeatureGateFilterTest`, `FeatureFlagDefaultsTest`, `FeatureFlagServiceTest`, `CrossCuttingFilterTest`; T2 `MerchFeatureOffIT`; T3 `feature-flag-resolve.integration.test.ts`. **T6**: `bjjeire-tests` once the screens exist.

### `#6027` — Merch switched on changes nothing a browsing visitor did (P1)

Given the `Merch` switch is on or off,
When a visitor browses gyms, events, competitions or the store directory,
Then nothing needs an account and nothing changed,
And read-only mode still answers 405 for directory writes,
And registration's Stripe webhook still handles every sign-up event, while acknowledging and ignoring objects marked `bjjeireKind = order`.

**Owns**: T1 `MerchFeatureGateFilterTest`, `StripePaymentGatewayTest`; T2 `MerchFeatureOffIT`, `StripeWebhookIT`, the existing directory and registration suites.

### `#6001` — The merch section on Shop (P1)

Given published products and the `Merch` switch on,
When a visitor opens `/shop`,
Then a "BJJ Éire merch" section above the directory search shows each product from `GET /api/v1/product` (one page of 100), by kind then name,
And each card shows the first photo (`/api/v1/product/photo/{sha256}`, never cropped), name, kind, euro price and "Out of stock" when no size can be bought,
And drafts and hidden products are never listed.
Given the products request is loading or fails,
Then the directory shows without the section and without an error.

**Owns**: T2 `ProductMongoRepositoryIT`, `ProductIT`, `ProductPhotoIT`; T4 `shop-page-merch.integration.test.tsx`; T0 `product.pact.test.ts`. **T6**: `bjjeire-tests`.

### `#6002` — The product page (P1)

Given a published product,
When a visitor opens `/shop/products/{slug}`,
Then they see its photos, description, price and every size it comes in, XS first,
And a size with nothing available beyond what checkouts hold is shown as sold out and cannot be chosen,
And the API shows each size's `available` and `soldOut`, never `stock` or `held`.
Given a draft, hidden or unknown product,
Then `GET /api/v1/product/{slug}` is 404 and the page says "Product not found" with a link back to Shop.

**Owns**: T1 `ProductRulesTest`; T2 `ProductIT`, `ProductPhotoIT`; T4 `product-page.integration.test.tsx`; T0 `product.pact.test.ts`. **T6**: `bjjeire-tests`.

### `#6003` — No product, no section (P1)

Given no product is published,
When a visitor opens Shop,
Then `GET /api/v1/product` returns an empty page, and there is no merch section and no placeholder.

**Owns**: T2 `ProductIT`, `ProductMongoRepositoryIT`; T4 `shop-page-merch.integration.test.tsx`. **T6**: `bjjeire-tests`.

### `#6004` — The directory's search and paging leave the merch section alone (P1)

Given the merch section is shown,
When the visitor searches or pages the directory,
Then only the directory changes, and the products are not fetched again.

**Owns**: T4 `shop-page-merch.integration.test.tsx`. **T6**: `bjjeire-tests`.

### `#6013` — The organiser saves a draft and adds its photos (P1)

Given the organiser is signed in,
When they `POST /api/v1/product/admin` with name, slug, kind, description, price and at least one size with its stock,
Then it is stored as a `DRAFT` with version 0 that visitors cannot see,
And `POST /api/v1/product/admin/{id}/photo` adds a JPEG, PNG or WebP of up to 5 MB (by its first bytes) to the end of its photos, stored once per content in GridFS `productPhotos`,
And invalid fields are 400 with PascalCase `errors[].field`, an unsupported image is 415 `unsupported-image`, over 5 MB is 413 `payload-too-large`, and a seventh photo is 409 `too-many-photos`.

**Owns**: T1 `ProductControllerTest`, `ProductRulesTest`; T2 `ProductAdminIT`, `ProductPhotoUploadIT`; T4 `admin-shop-products.integration.test.tsx`; T3 `product-form.unit.test.ts`. **T6**: `bjjeire-tests` (local organiser sign-in).

### `#6014` — Publish and hide (P1)

Given a draft with 1–6 photos and at least one size,
When the organiser publishes it,
Then visitors see it; without a photo or size it is 409 `product-not-publishable`.
When the organiser hides it,
Then visitors no longer see it and its page is 404; a hidden product can be published again.
An edit of a published product must leave it publishable. Only a draft can be deleted (409 `product-not-draft` otherwise).

**Owns**: T1 `ProductRulesTest`; T2 `ProductAdminIT`; T4 `admin-shop-products.integration.test.tsx`. **T6**: `bjjeire-tests`.

### `#6015` — A price change applies to new checkouts (P1)

Given a product,
When the organiser changes its price,
Then the next public read shows the new price.
_The paid-order half (orders keep the price paid) lands with orders in slice 3 (`OrderIT`)._

**Owns**: T2 `ProductAdminIT`; T4 `admin-shop-products.integration.test.tsx`.

### `#6016` — Stock shows straight away (P1)

Given a product size,
When the organiser sets its stock (`PUT /api/v1/product/admin/{id}/stock`, or the full update),
Then the next public read shows the new availability (on another API replica within 30 seconds, when its merch cache expires),
And stock below what checkouts hold is 409 `stock-below-held` naming the number held, removing a size with holds is 409 `size-has-holds`, and a write from a stale version or after a hold changed is 409.

**Owns**: T1 `ProductRulesTest`, `ApiCacheTest`; T2 `ProductAdminIT`; T3 `merch-query-options.unit.test.ts`; T4 `admin-shop-products.integration.test.tsx`. **T6**: `bjjeire-tests`.

### `#6017` — Only the organiser manages products (P1)

Given anyone who is not the organiser (anonymous, competitor, scope-less competitor, workforce reader),
When they call any `/api/v1/product/admin/**` route, the photo upload included,
Then they get 401 (anonymous) or 403, and nothing changes.

**Owns**: T2 `ProductAdminIT`, `ProductPhotoUploadIT`, `MerchRouteAuthorizationIT`; T4 `admin-shop-products.integration.test.tsx` (signed out, nothing requested).

## Executable contract

See [contract.yaml](contract.yaml).

## Traceability

See [traceability.md](traceability.md).
