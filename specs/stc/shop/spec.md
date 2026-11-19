---
feature: shop
ssot: specs/features/shop.md
database: specs/database-contracts/store.md
api_package: com.bjjeire.api.store
spa: src/bjjeire-app/src/features/stores
acceptance: bjjeire-tests/tests/features/stores/
status: living
---

# STC: Shop

**Requirements**: `bjjeire/requirements` · epic `&4` (directory) · merch epic (`#6001`–`#6028`, provisional; added as their slices ship: `#6026`, `#6027` with slice 0)

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

*Slice 0 owns the API side. The SPA side (no merch section, basket, product page or merch admin screen) lands with those screens in slices 2–4.*

**Owns**: T1 `MerchFeatureGateFilterTest`, `FeatureFlagDefaultsTest`, `FeatureFlagServiceTest`, `CrossCuttingFilterTest`; T2 `MerchFeatureOffIT`; T3 `feature-flag-resolve.integration.test.ts`. **T6**: `bjjeire-tests` once the screens exist.

### `#6027` — Merch switched on changes nothing a browsing visitor did (P1)

Given the `Merch` switch is on or off,
When a visitor browses gyms, events, competitions or the store directory,
Then nothing needs an account and nothing changed,
And read-only mode still answers 405 for directory writes,
And registration's Stripe webhook still handles every sign-up event, while acknowledging and ignoring objects marked `bjjeireKind = order`.

**Owns**: T1 `MerchFeatureGateFilterTest`, `StripePaymentGatewayTest`; T2 `MerchFeatureOffIT`, `StripeWebhookIT`, the existing directory and registration suites.

## Executable contract

See [contract.yaml](contract.yaml).

## Traceability

See [traceability.md](traceability.md).
