# Implementation Plan: BJJ Éire Merch Shop

**Branch**: `003-bjjeire-merch-shop` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-bjjeire-merch-shop/spec.md`

## Summary

There are two parts:

- **The rename.** Stores becomes **Shop** in the SPA:
  - the page moves to `/shop`, and `/stores` redirects to it;
  - the navigation entry says Shop;
  - the sitemap lists `/shop`.

  The directory keeps its API (`/api/v1/store`), collection, flag (`Stores`) and test ids, so no published contract moves.
- **The merch shop.** It adds BJJ Éire's own merch, sold to guests:
  - a featured merch section above the directory on `/shop`;
  - product pages, and a basket kept in the browser;
  - guest checkout through Stripe hosted Checkout, confirmed only by a signed webhook (ADR-0013's rule);
  - admin screens for products and stock, orders, dispatch and refunds;
  - a sales and stock dashboard.

The API gets two feature packages, as competitions did:

- **`product`**: admin-owned catalogue, stock and photos.
- **`order`**: guest-owned orders with money attached, the shop's own webhook, refunds and the dashboard.

Photos live in MongoDB GridFS, so there is no new cloud resource. Mail and the low-level Stripe helpers move to `common`, because two features now need them. Everything new sits behind a fail-closed `Merch` flag.

## Technical Context

**Language/Version**: Java 25 (API) · TypeScript 5.x / React 19 (SPA)

**Primary Dependencies**: Spring Boot 4.1, Spring Data MongoDB (incl. `GridFsTemplate`), `stripe-java` 34.x (already present), `spring-boot-starter-mail` (already present), Vite 7, MSAL (organiser only)

**Storage**: MongoDB. New collections are `Product`, `MerchOrder`, `OrderStripeEvent`, `ShopSettings`, and the GridFS bucket `productPhotos`. Contracts are in `specs/database-contracts/` (see [data-model.md](data-model.md)).

**Testing**: JUnit + Testcontainers (API) · Vitest unit/integration + Pact (SPA) · Playwright in `bjjeire-tests`

**Target Platform**: AKS (Flux) · local docker-compose

**Project Type**: Modular monolith (API + SPA in this repo; acceptance in `bjjeire-tests`)

**Performance Goals**:

- Shop page data (merch section and directory) appears in under 2 s for 200 concurrent viewers (spec SC-006 freshness: under 1 minute).
- Product photos are served with long-lived cache headers.

**Constraints**:

- OpenAPI/Pact gates; additions only, apart from the accepted `/metrics` removal already on main.
- Path-filtered CI; light, dark and competition themes.
- Production runs with read-only mode on, so the shop routes need the same exemption as competitions.
- Mesh egress is deny by default. There is no Stripe `ServiceEntry` in `bjjeire-gitops` yet (checked 2026-11-18); one for `api.stripe.com` is needed before `Merch` or `BjjEireCompetitions` is turned on in a cluster.

**Scale/Scope**:

- Tens of products, 3 kinds, 6 sizes each.
- Hundreds of orders a year, with a burst on launch day.
- One organiser.

## Constitution Check

*GATE: Must pass before research. Re-check after design.*

- [x] Package-by-feature respected (ADR-0001). The new packages are `product` and `order`. Mail and Stripe helpers move to `common` only because two features use them (api rules: "Only put code in `common/` when two or more features need it"). Principle II's package list needs **amendment 1.3.0**.
- [x] Wire-shape change has OpenAPI/Pact/spec updates (ADR-0002). All routes are additions ([contracts/contract.yaml](contracts/contract.yaml)). `/api/v1/store` is unchanged.
- [x] No new CI job left out of the aggregator (ADR-0003). No new job; existing path filters cover `src/**` and `seeder/data-test/**`.
- [x] All three themes still work and no ad-hoc UI strings (ADR-0011, ADR-0008). Copy goes in `config/content/shop.ts` and `merch.ts`; test ids go in `constants/merchDataTestIds.ts`. The existing `StoresDataTestIds` stay, because `bjjeire-tests` selects by them.
- [x] No new cloud stack. Photos go in GridFS (research R4), not a new storage account.
- [ ] **Principle V: two new kinds of write.** This needs an ADR and an amendment. Listed in Complexity Tracking.
  - **Guest writes with no token:** `POST /api/v1/order` starts a checkout, and `GET /api/v1/order/{id}` is read with an order key.
  - **A second signed webhook:** `POST /api/v1/order/stripe-webhook`.

  **Gate result**: passes once **ADR-0016** and constitution **1.3.0** land in slice 0, before any route exists. This is the same path ADR-0012 and ADR-0013 took for 1.1.0.

*Re-check after Phase 1 design*: unchanged. The data model adds no geo fields and no `isAvailable`. The contract adds no PascalCase alias. Enum wire values follow the BJJ Éire competition exception (`UPPER_SNAKE`, e.g. `RASHGUARD`, `AWAITING_PAYMENT`), declared in the contract and in `.claude/rules/api.md` with ADR-0016.

## Project Structure

### Documentation (this feature)

```text
specs/003-bjjeire-merch-shop/
├── spec.md
├── plan.md              # this file
├── research.md          # R1–R12 decisions
├── data-model.md        # Product, MerchOrder, OrderStripeEvent, ShopSettings, photo bucket
├── quickstart.md        # manual validation per story
├── contracts/
│   ├── contract.yaml     # routes, auth, errors (moves to specs/stc/shop/contract.yaml on build)
│   └── stripe-webhook.md # shop endpoint, event filtering, ledger
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

Living documents to add or update as slices land:

- `specs/features/shop.md`: the living spec. It replaces `specs/features/stores.md`, and the directory requirements `#4001`–`#4004` move into it unchanged.
- `specs/stc/shop/` (`spec.md`, `contract.yaml`, `traceability.md`): replaces `specs/stc/stores/`.
- `specs/database-contracts/product.md`, `merch-order.md` and `shop-settings.md`.
- `docs/adr/0016-bjjeire-merch-guest-checkout.md`, and the constitution 1.3.0 amendment.
- `docs/registration-operations.md`: generalise it to "payments operations", adding shop metrics and alerts.
- In `bjjeire-tests`, rename `specs/features/stores.md` to `shop.md` (route and label). This must merge the same day as slice 1.

### Source Code

```text
src/bjjeire-api/src/main/java/com/bjjeire/api/
├── product/            # Product, ProductSize, ProductKind, ProductStatus, ProductController (public),
│                       # ProductAdminController, ProductService(Impl), ProductPhotoStore (GridFS),
│                       # StockLedger (hold/release/commit, conditional updates), DTOs and commands
├── order/              # MerchOrder, OrderLine, DeliveryAddress, OrderStatus, OrderController (guest),
│                       # OrderAdminController, OrderService(Impl), OrderWebhookController/Service,
│                       # OrderStripeEvent, ShopPaymentGateway (+ Stripe impl), OrderHoldSweep,
│                       # OrderMails, OrderCsv, SalesDashboard (pure) + DashboardService, ShopSettings,
│                       # OrderRetentionSweep, OrderMetrics
├── common/             # + mail/ helpers moved from registration (Mailer, MailMessage, SmtpMailer,
│                       #   RetryingMailSender), StripeSecrets, StripeSignature (verify + read event)
├── registration/       # webhook ignores events whose metadata.bjjeireKind = "order"; sets kind on new sessions
├── web/                # FeatureFlag.MERCH, MerchFeatureGateFilter (404 before auth when off)
└── config/             # SecurityConfig rules, ReadOnlyModeFilter exemption, MongoIndexInitializer indexes,
                        # multipart limits
src/bjjeire-app/src/
├── features/stores/            # unchanged directory code; page title/label copy → "Shop"
├── features/merch/             # featured section, product page, basket (localStorage), checkout form,
│                               # order page (key from URL fragment)
├── features/merch-admin/       # products, stock, photos, orders, dispatch/refund, dashboard, delivery fee
├── pages/ShopPage.tsx          # replaces StoresPage: merch section (Merch flag) + directory (Stores flag)
├── pages/ProductPage.tsx, BasketPage.tsx, CheckoutPage.tsx, OrderPage.tsx,
│   AdminShopPage.tsx, AdminProductPage.tsx, AdminOrdersPage.tsx, AdminShopDashboardPage.tsx
├── config/paths.ts             # shop, shopProduct, basket, checkout, order, admin shop routes; /stores redirect
├── config/content/shop.ts, merch.ts
└── constants/merchDataTestIds.ts
seeder/data-test/products/      # test catalogue (3 products, mixed stock, one sold-out size); test photos
bjjeire-tests (other repo)      # specs/features/shop.md; tests/features/shop/
```

**Structure Decision**: Follow the existing BJJ Éire competition slice. Use two flat packages, because the aggregates have different owners and access rules: an admin-owned catalogue, and guest-owned orders with money attached. `bjjeirecompetition` and `registration` are split for the same reason. `product` never depends on `order`. `order` reads products only through `ProductService` and `StockLedger`. The dashboard lives in `order`, because orders are its source.

## Delivery slices

Each slice is one pull request, test-first and built with `/build-feature`. The `Merch` flag stays off in production until slice 3 passes in a preview with Stripe test mode.

| # | Slice | Stories | Requirement issues |
|---|---|---|---|
| 0 | Governance and plumbing. Includes moving mail and Stripe helpers to `common` with no behaviour change, and a Key Vault placeholder for `STRIPE_SHOP_WEBHOOK_SECRET`. | US7 | `#6026`, `#6027` (`#6028` lands with US7 in slice 3, once merch pages exist) |
| 1 | Rename Stores to Shop (SPA only, flag-free) and move the acceptance spec in `bjjeire-tests` | US1 | `#4005`–`#4007` |
| 2 | Catalogue, admin products and stock, the public merch section and product page | US2, US4 | `#6001`–`#6004`, `#6013`–`#6017` |
| 3 | Basket, guest checkout, the shop webhook, confirmation mail and the order page | US3 | `#6005`–`#6012` |
| 4 | Admin orders: list and export, dispatch, refund, refund webhooks, retention | US5 | `#6018`–`#6021` |
| 5 | Sales and stock dashboard | US6 | `#6022`–`#6025` |

Slice 0 in detail:

- ADR-0016 and constitution 1.3.0;
- the `Merch` flag and `MerchFeatureGateFilter`;
- route prefixes, the read-only exemption and security rules;
- the registration webhook ignores shop events.

Slice 1 is independent of the rest and can ship first. Slice 3 depends on 2. Slices 4 and 5 depend on 3 and are independent of each other.

## Risks

| Risk | Mitigation |
|---|---|
| A bot holds all stock without paying (no account, no token) | Per-order caps: 10 units per line and 20 per order (research R7). The existing global rate limit applies. Holds last 30 minutes, then the sweep releases them. `order.holds.active` is a metric with an alert. If needed, Cloudflare Turnstile is the next step, outside this plan. |
| A payment succeeds but the order is not confirmed | The webhook is the only confirmer. The shop keeps its own event ledger. A 5xx makes Stripe retry. A hold sweep asks Stripe about lapsed sessions and alerts on paid ones, as registration does. |
| Overselling the last item | Each size is decremented by a conditional atomic update. A multi-line order holds line by line and releases the lines already held if a later one fails. A late payment with no stock is refunded automatically. |
| One Stripe event reaches both webhooks | Every new session and refund carries `metadata.bjjeireKind`. The shop ignores anything not marked `order`. Registration ignores `order` and treats a missing kind as its own, for old sessions. Each webhook has its own ledger, because event ids are shared (research R2). |
| A guest's order page is read by someone else | Each order has a 256-bit random access key, stored hashed. The emailed link carries it in the URL fragment, which servers and logs never see, and the SPA sends it in a header (research R6). |
| A photo upload carries something harmful or huge | Only JPEG, PNG or WebP are accepted, checked by magic bytes. Limits are 5 MB a photo and 6 photos per product. Photos are served with `Content-Type` from the check, `X-Content-Type-Options: nosniff`, and a content-addressed URL. |
| The rename breaks bookmarks, search results and acceptance tests | `/stores` redirects to `/shop`, and test ids keep their names. The `bjjeire-tests` stores spec moves in the same release. The API is untouched. |
| NI addresses cannot be restricted by Stripe (it restricts by country) | The SPA and API collect and validate the address before Checkout: IE, or GB with a `BT` postcode. Stripe receives it as shipping details and does not collect its own (research R3). |
| The dashboard disagrees with the orders list | Both read the same `MerchOrder` fields through the same period rule: Irish calendar days, `paidAt` for sales, `refundedAt` for refunds. A test compares them over the seeded orders (SC-005). |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principle V: unauthenticated guest writes (`POST /api/v1/order`, `GET /api/v1/order/{id}` with an order key) | The owner chose guest checkout (spec Q1). A shopper has no token to present. | Requiring the competitor account was offered and declined. It would add a sign-up step to every first purchase. |
| Principle V: a second Stripe webhook route | The shop's events belong to `order`; reusing the registration route would put shop code in `registration` | A single shared webhook in `common` would need a dispatcher that knows both features. That turns `common` into a third feature and couples the two. |
| Read-only mode bypass for two more route prefixes (`/api/v1/product`, `/api/v1/order`) | Production runs read-only, and the shop needs writes | Turning read-only mode off would expose the directory writes to authentication alone |
| Two new feature packages | The owners and access rules differ (catalogue versus guest money) | One `shop` package would mix admin, guest and payment code |
| Moving mail and Stripe helpers into `common` | Two features now send mail and verify Stripe signatures | Copying them would leave two retry policies and two signature checks to keep in step |
