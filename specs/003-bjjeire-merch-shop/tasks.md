---
description: "Task list for the BJJ Éire Merch Shop"
---

# Tasks: BJJ Éire Merch Shop

**Input**: Design documents from `specs/003-bjjeire-merch-shop/`

**Prerequisites**:

- [spec.md](spec.md) and [plan.md](plan.md);
- [research.md](research.md) and [data-model.md](data-model.md);
- [contracts/contract.yaml](contracts/contract.yaml) and [contracts/stripe-webhook.md](contracts/stripe-webhook.md);
- [quickstart.md](quickstart.md).

**Build with**: `/build-feature specs/003-bjjeire-merch-shop/spec.md`, one slice per pull request (plan § Delivery slices). Do not use `/speckit-implement`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on unfinished tasks)
- **[Story]**: User story id (US1 … US7)
- Name the feature package or folder. Give an exact file path only when the path is itself a contract, and derive the rest from the code while building.
- Tests are written first and must fail for the right reason before the implementation task that follows them (constitution IV). Test names carry the requirement issue they cover.

## Path Conventions

- API: `src/bjjeire-api/src/main/java/com/bjjeire/api/{product,order,common}/`
- API tests: `src/bjjeire-api/src/test/java/com/bjjeire/api/<same package>/`. `*Test` is a unit test; `*IT` extends `testsupport.MongoIntegrationTest`.
- SPA: `src/bjjeire-app/src/features/{stores,merch,merch-admin}/`, `src/bjjeire-app/src/pages/`
- Test seed: `seeder/data-test/products/` (no production seed)
- Acceptance: `bjjeire-tests`, as a separate PR, except the stores → shop move, which merges with US1

---

## Phase 1: Setup (governance, specs, prerequisites)

**Purpose**: Amend the rules this feature changes, and line up what cannot be created from this repository.

- [ ] T001 External prerequisites. As built: (b) is done, as a placeholder in `main.key-vault.tf` and `variables.tournament.tf`, not applied. (a) and (c) are still open; no Stripe `ServiceEntry` was found in `bjjeire-gitops`.
  - (a) Register a second Stripe webhook endpoint `https://<api host>/api/v1/order/stripe-webhook` in test mode for the seven events in `contracts/stripe-webhook.md`.
  - (b) In `bjjeire-terraform-azurerm-aks`, add a placeholder Key Vault secret `bjj-api-stripe-shop-webhook-secret` beside the existing `bjj-api-stripe-*` placeholders. Do not apply.
  - (c) Confirm the existing Stripe `ServiceEntry` in `bjjeire-gitops` covers `api.stripe.com` (no new host).
- [ ] T002 Create the requirement issues `#4005`–`#4007` (Stores epic `&4`) and `#6001`–`#6028` (a new merch epic) in `bjjeire/requirements`, or ask the owner to. Replace the provisional ids in `spec.md` if the real numbers differ.
- [x] T003 [P] Write `docs/adr/0016-bjjeire-merch-guest-checkout.md` from research R1, R2, R6, R7 and R12, using `docs/adr/0000-template.md`. It covers:
  - guest writes with no token, read by order key;
  - a second signed webhook, kind metadata and separate ledgers;
  - GridFS photos;
  - the read-only exemption for `/api/v1/product` and `/api/v1/order`;
  - the `Merch` flag;
  - the `UPPER_SNAKE` enum exception extended to `product` and `order`.

  Add it to `docs/adr/README.md` and to the table in `AGENTS.md` (row: "Merch, guest checkout, `product`, `order`, the `Merch` flag").

  As built: the ADR draws on R1, R2, R4 (photos), R6 and R7. R12 (the Stores → Shop rename) shipped with slice 1, changes no rule, and needs no ADR.
- [x] T004 Amend `.specify/memory/constitution.md` to 1.3.0, with a migration note "none needed". Depends on T003.
  - Principle II lists `product` and `order`.
  - Principle V gains guest order routes, read with an order key, and the shop webhook as the second signed write.
  - Update `AGENTS.md` (Architecture Guardrails package list), `.claude/rules/api.md` (routes, auth, enum exception, cross-cutting filters) and `.claude/rules/mongodb.md` (the `Product`, `MerchOrder`, `OrderStripeEvent` and `ShopSettings` collections, the `productPhotos` bucket, and the product test seed).

  As built: `.claude/rules/mongodb.md` is not changed yet. Its collection list names what exists, and slice 0 adds no collection. The `Product`, `MerchOrder`, `OrderStripeEvent` and `ShopSettings` collections, the `productPhotos` bucket and the product test seed go in with slices 2 and 3.
- [x] T005 [P] Create `specs/features/shop.md` as the living file:
  - status "In progress";
  - Part 1 is the directory, with `#4001`–`#4004` moved verbatim from `specs/features/stores.md`, plus `#4005`–`#4007`;
  - Part 2 is merch.

  Delete `specs/features/stores.md`, and update `specs/README.md`.
- [x] T006 [P] Create `specs/stc/shop/{spec.md,contract.yaml,traceability.md}`:
  - move the content of `specs/stc/stores/`, then delete it;
  - add the scenarios `#4005`–`#4007` and `#6001`–`#6028`;
  - `contract.yaml` comes from `contracts/contract.yaml`.

  Update `specs/stc/README.md` with the new epic and range. As built in slice 1: `#4005`–`#4007` are added; `#6001`–`#6028` are added to the overlay as their slices ship.
- [ ] T007 Check the three **Verify** facts in `research.md` against Stripe's documentation and test mode, and record the results there:
  - one `evt_` id is delivered to every endpoint (R2);
  - `shipping_address_collection.allowed_countries` is country-level only (R3);
  - `payment_intent_data.shipping` is accepted on a Checkout Session (R3).

---

## Phase 2: Foundational (flag, routes, security, shared helpers)

**Purpose**: Plumbing for US2–US7. US1 (the rename) does not depend on this phase.

**⚠️ CRITICAL**: No merch story starts until this phase is complete.

### Tests first

- [x] T008 [P] Extend `config/CrossCuttingFilterTest`: with read-only mode on, `POST` under `/api/v1/product` and `/api/v1/order` passes the filter, `POST /api/v1/order%2F` and `/api/v1/%6frder` are matched decoded (ADR-0013's rule), and `POST /api/v1/store` still answers 405.
- [x] T009 [P] Extend `web/FeatureFlagDefaultsTest`: `Merch` defaults to `false` in `application.yml`. Add `web/MerchFeatureGateFilterTest`: with the flag off, reads and writes under `/api/v1/product` and `/api/v1/order` answer a 404 problem with `traceId` (`#6026`), and directory routes are untouched (`#6027`).
- [x] T010 [P] Add `config/MerchRouteAuthorizationIT`. Merch on:
  - anonymous callers get public product reads, `POST /api/v1/order`, `GET /api/v1/order/{id}` and the webhook through to the handler (404 or 400, never 401);
  - `/api/v1/product/admin/**` and `/api/v1/order/admin/**` need the writer scope: anonymous gets 401, and competitor and local-competitor tokens get 403 (`#6017`, `#6025`);
  - anonymous `GET /api/v1/product/admin` and `GET /api/v1/order/admin` get 401, not a public read through the `{slug}` or `{id}` patterns.

  As built: the IT checks the competitor, scope-less competitor and reader tokens. It does not check a local-competitor token, because the shared test context has no local issuer. The admin rules use `hasAuthority(writer)`, which a local competitor never holds (`IssuerAwareAuthoritiesConverter`, covered by `LocalSignInIT`).
- [x] T011 [P] Add `config/MerchFeatureOffIT`: with `Merch` off, a sample of product, order and webhook routes answers 404 before authentication, and the directory lists still serve anonymously (`#6026`, `#6027`).

  As built: `MerchFeatureOffIT` uses the same `@TestPropertySource` as `BjjEireCompetitionFeatureOffIT` (both flags off, read-only on), so the two share one cached context.
- [x] T012 [P] Extend `registration/StripeWebhookIT`:
  - a signed checkout or refund event whose object has `metadata.bjjeireKind = order` is acknowledged with 200, changes nothing and is not written to `StripeEvent`;
  - an event with no `bjjeireKind` is handled as before.

  Extend `RegistrationIT` so that checkout creation sends `bjjeireKind = registration` in the session metadata. Extend `CancellationIT` for the same in the refund metadata.

  As built: the recording gateway in the ITs never builds Stripe parameters, so `RegistrationIT` and `CancellationIT` cannot see the metadata. The kind is asserted on the real parameters instead, in `StripePaymentGatewayTest` (`checkoutParams`, `refundParams`).

### Implementation

- [x] T013 Move the mail and Stripe helpers from `registration` to `common` with no behaviour change: `Mailer`, `MailMessage`, `SmtpMailer`, `MailConfig`, `MailDeliveryException`, `StripeSecrets` and the signature verification part of `StripeWebhookServiceImpl` (as `StripeSignature`). Make `RegistrationMailSender`'s retry generic (`common.RetryingMailSender`, keeping the metric name `registration.mail.failures` through a constructor argument). All existing registration tests pass unchanged.

  As built: the registration tests needed only import changes for the moved types. `StripeSignature.verify` returns a verdict, and each webhook keeps its own metrics, logs and problem documents. Both feature gates now extend `web.FeatureGateFilter`.
- [x] T014 Wire the routes and the flag:
  - `common/ApiRoutes`: `PRODUCT = "/api/v1/product"` and `ORDER = "/api/v1/order"`, and `isMerchFeaturePath`, which percent-decodes like `isBjjEireCompetitionFeaturePath`;
  - `common/ApiCache`: `MERCH_TAG`;
  - `web/FeatureFlag.MERCH` (wire name `Merch`, `FEATURE_MERCH`, default `false`) in `application.yml`;
  - `web/MerchFeatureGateFilter`.

  Makes T009 and T011 pass.

  As built: `ApiCache.MERCH_TAG` is deferred to slice 2, with the first product write that evicts it. A region nothing reads or evicts would be dead code.
- [x] T015 Make `config/ReadOnlyModeFilter` skip `isMerchFeaturePath` (T008). In `config/SecurityConfig`, add the merch rules ahead of the catch-all (T010):
  - `permitAll` on `GET /api/v1/product`, `/api/v1/product/{slug}` and `/api/v1/product/photo/**`;
  - `POST /api/v1/order`, `GET /api/v1/order/{id}`, `POST /api/v1/order/{id}/checkout`, `GET /api/v1/order/delivery` and `POST /api/v1/order/stripe-webhook`;
  - the writer scope on `/api/v1/product/admin/**` and `/api/v1/order/admin/**`.

  Declare the two `/admin/**` writer-scope rules **before** the public patterns. `/api/v1/product/*` and `/api/v1/order/*` would otherwise match `/admin` and make the admin lists public.

  As built: the rules live in `SecurityConfig.merchRules`, and the writer catch-all moved to `writerCatchAll`, to keep `securityFilterChain` under Checkstyle's method length. `GET /api/v1/order/delivery` is covered by the `/order/*` pattern. CORS does not allow `X-Order-Key` yet; add it with the order page in slice 3.
- [x] T016 In `registration`, set `metadata.bjjeireKind = registration` on new Checkout Sessions (`StripePaymentGateway`) and refunds. `StripeWebhookServiceImpl` acknowledges and skips objects whose kind is `order`. Makes T012 pass.
- [x] T017 [P] Extend `config/BjjEireProperties` with `stripe.shopWebhookSecret` (`STRIPE_SHOP_WEBHOOK_SECRET`, placeholder `whsec_REPLACE_ME`) and `order(hold = 30m, maxUnitsPerLine = 10, maxUnitsPerOrder = 20, maxUnpaidPerEmail = 3, maxUnpaidPerIp = 3, lowStock = 5)`. Add the variable to `docker-compose.yml`, `.env.example` and the local override. Add `spring.servlet.multipart.max-file-size=5MB` and `max-request-size=6MB` to `application.yml`.
- [x] T018 [P] SPA:
  - `Merch` in `features/feature-flags/definitions.ts` (default off, fail closed);
  - product and order routes in `config/api-routes.ts`;
  - empty `constants/merchDataTestIds.ts`;
  - `config/content/merch.ts` exported through `config/ui-content.ts`.

**Checkpoint**: `mvn -pl src/bjjeire-api test` and `npm run lint && npm run typecheck && npm test` pass. With the flag off, nothing changes.

---

## Phase 3: User Story 1 — Stores becomes Shop (Priority: P1) 🎯 MVP

**Goal**: Visitors find the directory under Shop at `/shop`, and old links still work.

**Independent Test**: Merch off. The navigation says Shop. `/shop` lists and searches the stores. `/stores` lands on `/shop`.

### Tests first

- [x] T019 [P] [US1] Write failing tests:
  - `components/layout/__tests__/use-nav-items.unit.test.tsx`: the entry is labelled "Shop" and points to `/shop`, and no entry says "Stores" (`#4005`).
  - `config/__tests__/ui-content-shop-name.unit.test.ts`: no visible copy in the stores and shop content calls the section "Stores" (`#4005`).
- [x] T020 [P] [US1] Move `pages/__tests__/stores-page.integration.test.tsx` to `shop-page.integration.test.tsx`, with routes `/shop`. It covers the same cards, order, search, empty and error behaviour (`#4006`).
- [x] T021 [P] [US1] Write a failing test in `__tests__/app-routes.integration.test.tsx`: `/stores` and `/stores/anything` redirect to `/shop` with `replace`, and with `Stores` off `/shop` redirects to About as today (`#4007`). Add `__tests__/sitemap.unit.test.ts`: `public/sitemap.xml` lists `/shop` and not `/stores` (`#4007`).

### Implementation

- [x] T022 [US1] Rename the SPA side:
  - `config/paths.ts`: `stores` becomes `shop`, with path `/shop` and label "Shop".
  - `config/features.ts`: the entry keeps flag `Stores`.
  - `pages/StoresPage.tsx` becomes `ShopPage.tsx`.
  - Copy in `config/content/stores.ts` becomes `shop.ts`, with page title, heading, intro and empty-state wording saying Shop and "Irish BJJ stores".
  - `App.tsx` redirects `/stores/*` to `/shop`.
  - `public/sitemap.xml` swaps the URL.

  Keep `StoresDataTestIds` values, `features/stores/` and every API call unchanged. Makes T019–T021 pass.

  As built: the empty state ("No Stores Found"), the search label and the counts keep their store wording, because they name the stores, not the section, and `#4006` keeps the empty state and search the same. `/stores/*` redirects with its query string.
- [ ] T023 [US1] In `bjjeire-tests`:
  - move `specs/features/stores.md` to `shop.md`, with route `/shop` and nav label "Shop";
  - list `#4005`–`#4007`;
  - update the page object's route and label.

  Merge on the same day as this slice. If `/workspaces/bjjeire-tests` is missing, list the changes in the PR instead.

**Checkpoint**: Quickstart § 1 passes. This slice can ship on its own.

---

## Phase 4: User Story 2 — Shopper browses BJJ Éire merch (Priority: P1)

**Goal**: The published products appear above the directory on `/shop`, and each has a product page.

**Independent Test**: With the test seed's products, a signed-out visitor sees the merch section, opens the rashguard, and sees XL sold out.

### Tests first

- [ ] T024 [P] [US2] Write `product/ProductRulesTest`:
  - publishable only with "1–6" photos and "at least 1" size;
  - sizes unique and ordered "XS, S, M, L, XL, XXL";
  - `available = stock - held`, and `soldOut` when 0;
  - `held` "≥ 0 and ≤ `stock`".
- [ ] T025 [P] [US2] Write `product/ProductMongoRepositoryIT`:
  - `ux_product_slug` rejects a duplicate;
  - the public listing returns `PUBLISHED` only, ordered by kind (`RASHGUARD`, `SHORTS`, `T_SHIRT`) then name (`#6001`, `#6003`).
- [ ] T026 [P] [US2] Write `product/ProductIT`:
  - `GET /api/v1/product/{slug}` shows description, photos, and sizes with `available` and `soldOut` only (no `stock` or `held` in the JSON);
  - a draft or hidden product is 404 (`#6002`);
  - an empty catalogue returns an empty page (`#6003`).
- [ ] T027 [P] [US2] Write `product/ProductPhotoIT`. `GET /api/v1/product/photo/{sha256}` serves:
  - the stored bytes with the checked `Content-Type`;
  - `Cache-Control: public, max-age=31536000, immutable`;
  - `X-Content-Type-Options: nosniff`.

  An unknown hash is 404 (`#6001`, `#6002`).
- [ ] T028 [P] [US2] Write `pages/__tests__/shop-page-merch.integration.test.tsx`:
  - the "BJJ Éire merch" section sits above the directory search;
  - each card shows photo, name, kind, euro price, and "Out of stock" when every size is sold out (`#6001`);
  - with no products there is no section and no placeholder (`#6003`);
  - searching or paging the directory leaves the section unchanged, and it is fetched once (`#6004`);
  - with `Merch` off, nothing is requested.
- [ ] T029 [P] [US2] Write `pages/__tests__/product-page.integration.test.tsx`:
  - photos, description, price and every size;
  - sold-out sizes shown but disabled;
  - an unknown slug shows "Product not found" with a link back to Shop (`#6002`);
  - all three themes render.
- [ ] T030 [P] [US2] Write the Pact consumer test `contracts/pact/product.pact.test.ts` for `GET /api/v1/product` and `GET /api/v1/product/{slug}`, and its provider state in `web/PactProviderVerificationIT`.

### Implementation

- [ ] T031 [US2] Write the `product/` domain:
  - `Product` (`@Document("Product")`) with every field in data-model.md § Product: `slug` "lowercase letters, digits and hyphens, 3–60, `admin` and `photo` reserved"; `name` "1–80"; `description` "1–2000, plain text"; `priceCents` "100–100000"; `currency` `EUR`; `version`; audit fields;
  - embedded `ProductSize {id, stock, held}`;
  - enums `ProductKind {RASHGUARD, SHORTS, T_SHIRT}`, `ProductStatus {DRAFT, PUBLISHED, HIDDEN}` and `SizeId {XS, S, M, L, XL, XXL}`.
- [ ] T032 [US2] Add the indexes `ux_product_slug` (unique) and `ix_product_status_kind_name` in `config/MongoIndexInitializer`.
- [ ] T033 [US2] Write `product/`:
  - `ProductSummaryDto` and `ProductDto` (never exposing `stock` or `held`);
  - the mapper and `ProductService` (`getPublished` page, `getPublishedBySlug`), cached under `MERCH_TAG`;
  - `ProductController` (public reads);
  - `ProductPhotoStore` over `GridFsTemplate`, bucket `productPhotos`, and `ProductPhotoController`.

  Makes T024–T027 pass.
- [ ] T034 [P] [US2] Add the seed:
  - `seeder/data-test/products/` with `_template.json` and three published products: a rashguard (S, M, L in stock; XL `stock: 0`), shorts (M `stock: 4`) and a t-shirt;
  - three small test photos, loaded into GridFS by the seeder;
  - `SeederCollection` entry, test dataset only and never pruned in production, as `BjjEireCompetition` is;
  - `specs/database-contracts/product.md` from data-model.md.
- [ ] T035 [US2] Write the SPA `features/merch/`:
  - `api/get-products.ts`;
  - hooks `useMerchProducts` (one page of 100) and `useProduct`;
  - components `featured-merch.tsx`, `product-card.tsx` (logo-safe `object-contain` images, the lesson of `#3006`), `product-details.tsx` and `size-picker.tsx`.

  Also:
  - `ShopPage` renders `FeaturedMerch` through `ListPageShell`'s `featured` slot when `Merch` is on;
  - `pages/ProductPage.tsx` at `/shop/products/:slug` (`featureSubRoutes`, flag `Merch`);
  - strings in `content/merch.ts`, ids in `merchDataTestIds.ts`.

  Makes T028–T030 pass.
- [ ] T036 [US2] Regenerate `src/types/generated/api.ts` from the served OpenAPI. Add `src/types/products.contract.ts` and confirm additions only. List `#6001`–`#6004` in `bjjeire-tests/specs/features/shop.md`. Add Zod schemas for `ProductSummaryDto` and `ProductDto` in `bjjeire-tests/src/api/features/shop/` in the same change set, or open a follow-up issue and link it in the PR (constitution III).

**Checkpoint**: Quickstart § 2 passes against the seed.

---

## Phase 5: User Story 4 — Organiser manages products and stock (Priority: P1)

**Goal**: The organiser creates, edits, publishes, hides and restocks products, with photos.

**Independent Test**: Create a rashguard with three sizes and publish it; a visitor sees it. Set one size to 0; the visitor sees it sold out.

### Tests first

- [ ] T037 [P] [US4] Write `product/ProductControllerTest` (standalone MockMvc), with 400s naming PascalCase fields:
  - `Name` "1–80", `Description` "1–2000", `PriceCents` "100–100000";
  - `Slug` pattern and reserved words;
  - `Sizes` empty, duplicated or unknown, and `Stock` "≥ 0";
  - a missing `Version` on update is 400;
  - an unreadable body is 400 `bad-request`.
- [ ] T038 [P] [US4] Write `product/ProductAdminIT`:
  - create returns 201 `DRAFT`, invisible to the public (`#6013`);
  - publish shows it, and publish without a photo or size is 409 `product-not-publishable`;
  - hide removes it from public reads, and a later read of an order line is unchanged (`#6014`);
  - a stale `version` is 409;
  - a price change is visible on the next read (`#6015`);
  - the stock update shows on the next public read (`#6016`);
  - stock set below `held` is 409 `stock-below-held` naming the number held;
  - removing a size with holds is 409 `size-has-holds`;
  - delete is allowed only for a draft no order names (409 `product-not-draft` or `product-has-orders`);
  - every admin write is recorded in the audit log.
- [ ] T039 [P] [US4] Write `product/ProductPhotoUploadIT`:
  - JPEG, PNG and WebP are accepted and return their sha256, and uploading the same bytes twice stores one file;
  - a GIF, or a PNG renamed `.jpg` with JPEG bytes missing, is 415 `unsupported-image`;
  - over 5 MB is 413 or a 400 problem;
  - a 7th photo is 409 `too-many-photos`;
  - removing a photo deletes the file only when no product names it;
  - a competitor token is 403 (`#6017`).
- [ ] T040 [P] [US4] Write `pages/__tests__/admin-shop-products.integration.test.tsx`:
  - signed out, it asks for sign-in and sends no request;
  - list with every status;
  - the create form, validation messages, upload and reorder photos, the stock per size;
  - publish, hide, and the stale-version message;
  - the `stock-below-held` message (`#6013`–`#6016`).

### Implementation

- [ ] T041 [US4] Write `product/` admin:
  - commands `CreateProductCommand`, `UpdateProductCommand` and `StockCommand` with the data-model constraints quoted in T031;
  - `AdminProductDto` with `stock` and `held` per size;
  - service methods for create, update, publish, hide, stock and delete, with version guard, audit and `MERCH_TAG` eviction;
  - `StockLedger` with `hold`, `release` and `commit` as conditional `findAndModify` updates with array filters (research R5). Each change clears `MERCH_TAG`, so the public availability is never stale (SC-006). It is used by `order` in US3, and its unit tests come in T046;
  - `ProductAdminController` under `/api/v1/product/admin`.

  Makes T037–T039 pass.
- [ ] T042 [US4] Write the SPA `features/merch-admin/` products tab:
  - `/admin/shop` and `/admin/shop/products/:id`, behind the existing organiser sign-in gate;
  - photo upload with progress, and an error for unsupported or too-large files;
  - a stock grid.

  Makes T040 pass. List `#6013`, `#6014` and `#6016` in `bjjeire-tests/specs/features/shop.md` (local organiser sign-in).

**Checkpoint**: Quickstart § 4 passes.

---

## Phase 6: User Story 3 — Shopper buys merch and pays online (Priority: P1)

**Goal**: A guest buys from a basket, pays through Stripe, and gets a confirmed order, a confirmation mail and an order page.

**Independent Test**: Add two sizes, pay with the test card, and get the mail; stock drops for both sizes.

### Tests first

- [ ] T043 [P] [US3] Write `order/OrderRulesTest`:
  - totals: `itemsCents` is the sum of lines, `totalCents = itemsCents + deliveryCents`;
  - limits: "1–10" units per line and "at most 20" units per order;
  - address: country `IE`, or `GB` with a postcode starting `BT`; the optional IE Eircode pattern; field lengths `name` "1–100", `line1` "1–100", `line2` "0–100", `town` "1–60", `county` "1–60", `phone` "≤ 30";
  - email "≤ 254";
  - every state transition in data-model.md § State transitions (R9).
- [ ] T044 [P] [US3] Write `order/OrderIT`:
  - create holds stock for every line, returns `orderKey` once and the checkout URL, sends Stripe the API's own prices plus a delivery line and `bjjeireKind = order`, and shows the full amount (`#6005`, `#6006`);
  - an address outside IE and NI is 409 `delivery-not-available`;
  - a basket with a sold-out size, a changed price or a hidden product is 409 `basket-changed` listing each line (`#6010`);
  - too large is 409 `basket-too-large`;
  - a 4th unpaid order from the same email or IP is 409 `too-many-unpaid`;
  - a guest checkout needs no account or token (`#6012`);
  - Stripe unreachable gives 502 `payment-unavailable` and releases every hold;
  - after the organiser changes a product's price and the delivery fee, a paid order keeps its `unitPriceCents` and `deliveryCents` (`#6015`, FR-007);
  - a body that is not JSON is 400.
- [ ] T045 [P] [US3] Write `order/OrderConcurrencyIT`:
  - many guests buy the last units of one size at once: exactly the stock is held, and the rest get `size-sold-out` without a charge (`#6009`);
  - two baskets holding the same two sizes in opposite order never deadlock or oversell.
- [ ] T046 [P] [US3] Write `product/StockLedgerTest` and `StockLedgerIT`:
  - hold only when `stock - held >= q`;
  - release and commit;
  - a multi-line hold releases the lines already held when a later one fails (research R5).
- [ ] T047 [P] [US3] Write `order/OrderWebhookIT`:
  - signature missing or bad is 400, counted;
  - a placeholder secret is 503;
  - paid confirms, commits stock and sends one mail with items, amount, address and the order link (`#6007`);
  - the same event twice changes nothing;
  - an event with `bjjeireKind = registration` or no kind is acknowledged and ignored;
  - expired or async-failed releases the holds (`#6008`);
  - a late payment confirms if the stock can be retaken, and is otherwise refunded in full automatically (`#6009`, FR-013);
  - a failed apply returns 5xx and is retried;
  - `OrderStripeEvent` is separate from `StripeEvent`;
  - after a paid event, the next public read of the product shows the reduced availability (SC-006).
- [ ] T048 [P] [US3] Write `order/OrderAccessIT`:
  - `GET /api/v1/order/{id}` with the right `X-Order-Key` shows the order (`#6011`);
  - a wrong, missing or other order's key gives 404, the same as an unknown id;
  - no route returns `accessKeyHash`;
  - `POST /{id}/checkout` returns the open session, gives 409 `hold-expired` after the hold, and 409 `payment-received` for a paid session.
- [ ] T049 [P] [US3] Write `order/OrderHoldSweepIT`. The registration `HoldSweepIT` cases, applied to orders:
  - lapsed holds expire once, also on parallel sweeps;
  - a session Stripe reports paid is kept and alerted once;
  - Stripe unreachable keeps the hold.
- [ ] T050 [P] [US3] Write `features/merch/utils/__tests__/basket.unit.test.ts`: `localStorage` key `bjjeire-basket` holding `{productId, sizeId, quantity}` only, add, change, remove, the quantity limits, and a corrupt entry cleared.
- [ ] T051 [P] [US3] Write `pages/__tests__/basket-checkout.integration.test.tsx`:
  - the basket shows lines, quantities, prices and the running total, and quantities can change and lines be removed (`#6005`);
  - checkout shows items plus delivery and asks for name, email and address, with NI postcode guidance (`#6006`);
  - a `basket-changed` response shows each change and updates the basket (`#6010`);
  - only `https://checkout.stripe.com` is followed;
  - never asks to sign in (`#6012`).
- [ ] T052 [P] [US3] Write `pages/__tests__/order-page.integration.test.tsx`:
  - reads `#key=` from the fragment and sends it as `X-Order-Key`;
  - shows the order, and after the return from Stripe polls every 2 s up to 30 times until confirmed (`#6007`, `#6011`);
  - the expired and failed states offer to try again (`#6008`);
  - a wrong key shows "Order not found".
- [ ] T053 [P] [US3] Write the Pact consumer test `contracts/pact/order.pact.test.ts` for `GET /api/v1/order/delivery`, `POST /api/v1/order` and `GET /api/v1/order/{id}`.

### Implementation

- [ ] T054 [US3] Write the `order/` domain:
  - `MerchOrder` (`@Document("MerchOrder")`) with every field in data-model.md § Merch order, including `number` "`BJE-<yyyymmdd>-<6 base32>`", `accessKeyHash`, `clientIp` (removed on any change of state) and `retainUntil`;
  - embedded `OrderLine` (snapshots), `DeliveryAddress`, `Payment`, `Refund` and `Dispatch`;
  - enums `OrderStatus`, `PaymentStatus` and `RefundStatus`;
  - `ShopSettings` (`_id = "shop"`, `deliveryFeeCents` "0–5000");
  - `OrderStripeEvent` with a 30-day TTL.
- [ ] T055 [US3] Add the indexes `ux_order_number`, `ix_order_status_created`, `ix_order_paidAt`, `ix_order_refundedAt`, `ix_order_hold`, partial `ix_order_unpaid_email` and `ix_order_unpaid_ip`, `ttl_order_retainUntil`, and the `OrderStripeEvent` TTL, all in `config/MongoIndexInitializer`.
- [ ] T056 [US3] Write `order/ShopPaymentGateway` and `StripeShopPaymentGateway`:
  - multi-line Checkout with `price_data`;
  - `payment_intent_data.shipping` from the address;
  - `client_reference_id`, `metadata.orderId` and `bjjeireKind = order`;
  - expiry of hold + margin;
  - idempotency key `order-checkout-<id>-1`;
  - `checkoutStatus` and `refund`.

  Add a recording fake in `testsupport/`.
- [ ] T057 [US3] Write `order/OrderServiceImpl`: create, from validation through to holds and session, with release of the holds on failure; access by key; resume checkout; `onCheckoutPaid`, `onCheckoutExpired` and `lateConfirmOrRefund`; and `expireLapsedHolds`. Also write `OrderController` (guest routes and `GET /delivery`). Makes T043–T046 and T048 pass.
- [ ] T058 [US3] Write `order/OrderWebhookController` and `OrderWebhookServiceImpl` on `common.StripeSignature`, with kind filtering and the `OrderStripeEvent` ledger. Write `OrderHoldSweep` (scheduled, leader-elected like `HoldSweep`), `OrderMails` (confirmation, plain text, via `common.RetryingMailSender`, metric `order.mail.failures`) and `OrderMetrics`. Makes T047 and T049 pass.
- [ ] T059 [US3] Write the SPA `features/merch/`:
  - the basket store and a header badge;
  - `pages/BasketPage.tsx` (`/shop/basket`), `CheckoutPage.tsx` (`/shop/checkout`) and `OrderPage.tsx` (`/shop/orders/:id`);
  - an add-to-basket action on `ProductPage`;
  - `utils/checkout-redirect.ts`, reused from registrations.

  Makes T050–T053 pass.
- [ ] T060 [US3] Do the paperwork:
  - write `specs/database-contracts/merch-order.md` and `shop-settings.md`;
  - regenerate the generated types, add `src/types/orders.contract.ts`, and confirm additions only;
  - list `#6005`–`#6008`, `#6010`–`#6012` in `bjjeire-tests/specs/features/shop.md` (Stripe test mode);
  - add Zod schemas for `OrderCheckoutDto`, `OrderDto` and the delivery response in `bjjeire-tests/src/api/features/shop/`, or open a follow-up issue and link it in the PR (constitution III).

**Checkpoint**: Quickstart § 3 passes in Stripe test mode. Both listeners stay quiet about each other's events.

---

## Phase 7: User Story 7 — The existing site stays as it is when merch is off (Priority: P1)

**Goal**: Merch can be switched off as a whole, leaving Shop as the directory.

**Independent Test**: With `Merch` off, `/shop` shows the directory only and merch addresses are unreachable.

### Tests first

- [ ] T061 [P] [US7] Extend `__tests__/app-routes.integration.test.tsx`:
  - with `Merch` off, `/shop/products/:slug`, `/shop/basket`, `/shop/checkout`, `/shop/orders/:id` and `/admin/shop` redirect with no request (`#6026`);
  - with `Stores` off and `Merch` on, the Shop entry and `/shop` stay, showing the merch section only, with no directory, no directory search and no store request (`#6028`). This deliberately differs from `#3015`;
  - with both off, `/shop` redirects to About as today;
  - the basket badge is hidden when `Merch` is off.
- [ ] T062 [US7] Confirm `MerchFeatureOffIT` (T011) and the existing directory ITs pass with `Merch` on and off (`#6027`). List `#6026` and `#6028` in `bjjeire-tests/specs/features/shop.md` and note `#6027` as owned by the existing suites.

### Implementation

- [ ] T063 [US7] `config/features.ts`: register every merch route as a `featureSubRoute` under flag `Merch`, and gate the basket badge on the flag. Make the Shop route and navigation entry available when `Stores` **or** `Merch` is on. `ShopPage` renders the directory only with `Stores` and the merch section only with `Merch`. Makes T061 pass.

---

## Phase 8: User Story 5 — Organiser fulfils orders and refunds (Priority: P2)

**Goal**: The organiser sees every order, marks it dispatched, and refunds it in full.

**Independent Test**: Dispatch a paid order and the mail arrives. Refund another, and the shopper is refunded and mailed, and the stock returns.

### Tests first

- [ ] T064 [P] [US5] Write `order/OrderAdminIT`:
  - the list shows every order newest first, with exactly the fields in `#6018`, filtered by status and paged;
  - the CSV has the same columns, is safe against spreadsheet formulas (a leading `=+-@` is escaped), and is named `order-<date>.csv`;
  - dispatch with an optional `TrackingReference` "≤ 100" moves `CONFIRMED` to `DISPATCHED` and sends the mail (`#6019`); dispatching a non-confirmed order is 409 `order-not-confirmed`;
  - refund of a confirmed order returns the full amount, stock returns, the order is `REFUNDED` and mailed (`#6020`);
  - refund of a dispatched order without `confirmDispatched` is 409 `dispatched-needs-confirmation`, and with it, the stock does not return;
  - refunding twice changes nothing;
  - competitor and anonymous callers are refused (`#6025` route list).
- [ ] T065 [P] [US5] Write `order/OrderRefundWebhookIT`:
  - `refund.updated` succeeded marks `REFUNDED`, sets `refundedAt` and sends one mail;
  - `refund.failed` marks `FAILED`, counts `order.refund.failures` and logs `ALERT`, and the order shows "refund pending" (`#6021`);
  - a refund event naming another refund of the same order is ignored;
  - a refund recorded without `refundId` takes the first one reported and ignores others (stripe-webhook.md).
- [ ] T066 [P] [US5] Write `order/OrderRetentionIT`: confirmed orders get `retainUntil` = `paidAt` + 6 years, and expired orders `expiredAt` + 30 days; the TTL index exists with `expireAfterSeconds: 0`.
- [ ] T067 [P] [US5] Write `pages/__tests__/admin-shop-orders.integration.test.tsx`:
  - the list with filters and the CSV export with the organiser token;
  - dispatch with tracking;
  - refund with a warning, and an extra warning for dispatched orders;
  - refund pending shown (`#6018`–`#6021`).

### Implementation

- [ ] T068 [US5] Write the `order/` admin side:
  - `OrderAdminController` under `/api/v1/order/admin` (list, CSV, dispatch, refund, settings get and put);
  - `OrderAdminServiceImpl`;
  - `OrderCsv`;
  - refund with an idempotency key of `order-refund-<id>-<attempt>`;
  - the stock return through `StockLedger`;
  - dispatch and refund mails;
  - refund webhook handling.

  Makes T064–T066 pass. Add Zod schemas for `AdminOrderDto` in `bjjeire-tests/src/api/features/shop/`, or open a follow-up issue and link it in the PR (constitution III).
- [ ] T069 [US5] Write the SPA `features/merch-admin/` orders tab and the delivery-fee setting. Makes T067 pass. List `#6018`–`#6020` in `bjjeire-tests/specs/features/shop.md`.

**Checkpoint**: Quickstart § 5 passes.

---

## Phase 9: User Story 6 — Organiser sees a sales and stock dashboard (Priority: P2)

**Goal**: Sales and stock figures for a chosen period, matching the orders list.

**Independent Test**: Three orders and one refund in a week; the dashboard for that week matches, and a low size is flagged.

### Tests first

- [ ] T070 [P] [US6] Write `order/SalesDashboardTest`:
  - periods `TODAY`, `LAST_7_DAYS`, `LAST_30_DAYS`, `THIS_YEAR` and `CUSTOM` count Irish calendar days, across the summer-time change;
  - orders, taken, refunded and net (`#6022`);
  - per product and per size units and money, best sellers by units then money (`#6023`);
  - stock low when "available ≤ 5", and sold out at 0 (`#6024`);
  - a refund in the period of an order paid before it counts as refunded, not as taken.
- [ ] T071 [P] [US6] Write `order/DashboardIT`:
  - over seeded orders, the dashboard totals equal a sum over the admin orders list for the same period (FR-026, SC-005);
  - `CUSTOM` without dates, or with `from` after `to`, is 400;
  - competitor and anonymous callers are refused (`#6025`).
- [ ] T072 [P] [US6] Write `pages/__tests__/admin-shop-dashboard.integration.test.tsx`: the period picker, the totals tiles, the best sellers table, and the stock table with low and sold-out marks (`#6022`–`#6024`).

### Implementation

- [ ] T073 [US6] Write `order/SalesDashboard` (pure, research R10), `DashboardService` and `GET /api/v1/order/admin/dashboard`. Makes T070 and T071 pass.
- [ ] T074 [US6] Write the SPA `features/merch-admin/` dashboard tab, using tables and stat tiles in the existing card styles in all three themes. Makes T072 pass. List `#6022` and `#6024` in `bjjeire-tests/specs/features/shop.md`.

**Checkpoint**: Quickstart § 6 passes.

---

## Phase 10: Polish and verification

- [ ] T075 [P] Complete `specs/stc/shop/traceability.md`: every issue `#4005`–`#4007` and `#6001`–`#6028` maps to a test path and an implementation path.
- [ ] T076 [P] Generalise `docs/registration-operations.md` to cover the shop, and rename it `docs/payments-operations.md`:
  - the `order.*` metrics and alerts (refund failures, unconfirmed payments, webhook rejected, mail failures, active holds high);
  - the second webhook endpoint and secret;
  - the switch-on checklist for `FEATURE_MERCH`.
- [ ] T077 [P] Mark `specs/features/shop.md` as Living. Set this spec's status to "Implemented — living spec: specs/features/shop.md".
- [ ] T078 Cluster wiring, in research order:
  - terraform: the real `bjj-api-stripe-shop-webhook-secret`;
  - `bjjeire-deploy`: map `STRIPE_SHOP_WEBHOOK_SECRET` from the secret;
  - `bjjeire-gitops`: the `ExternalSecret` entry and `FEATURE_MERCH` per environment, off in production.

  Do not apply or push from this container.
- [ ] T079 Load check for the plan's 200-viewer goal: 200 concurrent readers on `/api/v1/product`, a product page and photos, and 20 concurrent checkouts on one low-stock size. Record the results in `quickstart.md`.
- [ ] T080 Run:
  - `mvn clean verify`;
  - `npm run lint && npm run typecheck && npm test && npm run test:integration && npm run test:pact` in `src/bjjeire-app`.

  Confirm that `check_openapi_breaking` and `check_frontend_api_compat` report additions only.
- [ ] T081 Run every quickstart section in a preview with Stripe test mode and both webhook endpoints. While doing so, time three checks:
  - from opening Shop to a paid order, under 3 minutes (SC-001);
  - adding and publishing a product with photos and stock in three sizes, under 5 minutes (SC-004);
  - the confirmation mail arriving within 5 minutes of payment (SC-007).

  Record the times in `quickstart.md`. Run `spec-verifier` against the spec and the final diff.

---

## Dependencies & Execution Order

### Phase dependencies

```
Phase 1 Setup ─▶ Phase 2 Foundational ─▶ Phase 4 US2 ─▶ Phase 5 US4 ─▶ Phase 6 US3 ─┬─▶ Phase 8 US5 ─┐
                                                                    └─▶ Phase 7 US7 ├─▶ Phase 9 US6 ─┴▶ Phase 10
Phase 3 US1 (rename) ── independent; needs only T005/T006 for its spec and traceability files
```

- **Constitution gate**: T003, then T004. No merch pull request merges before ADR-0016 and constitution 1.3.0 are on `main`.
- **US1** depends on nothing else and can be the first pull request.
- **US2** comes before **US4**, because US2 creates the `product` domain and the public reads. US4 adds the admin side and `StockLedger`.
- **US3** needs US2's products and US4's `StockLedger`.
- **US7** needs the routes from US2 and US3 to exist, so its redirects have something to hide.
- **US5** and **US6** both need US3's orders and are independent of each other.

### Within each story

Tests first and failing, then the domain, then repository and indexes, then the service, then the controller, then the SPA, then contracts and generated types, then the acceptance listing.

### Parallel opportunities

- Phase 1: T003, T005 and T006 together.
- Phase 2: T008–T012 together, and T017 and T018 alongside the API work.
- Every story's "Tests first" tasks are all `[P]`.
- US1 can run as its own stream beside Phases 2, 4 and 5.
- US5 and US6 can run as two parallel streams after US3.

## Parallel example: User Story 3

```text
# All failing tests together:
T043 OrderRulesTest                 (order/)
T044 OrderIT                        (order/)
T045 OrderConcurrencyIT             (order/)
T046 StockLedgerTest / StockLedgerIT (product/)
T047 OrderWebhookIT                 (order/)
T048 OrderAccessIT                  (order/)
T049 OrderHoldSweepIT               (order/)
T050 basket unit test               (features/merch/utils/)
T051 basket-checkout integration    (pages/__tests__/)
T052 order-page integration         (pages/__tests__/)
T053 order Pact                     (contracts/pact/)

# Then: T054 → T055 → T056 → T057 → T058; SPA T059 can start from MSW handlers once T051–T053 exist.
```

## Implementation strategy

### MVP

Phase 3 (US1) on its own: Stores becomes Shop. It is shippable with no flag and no payment work.

### First release that takes money

Phases 1, 2, 4, 5 and 6 (US2, US4, US3) and 7 (US7). Keep `Merch` off in production until Phase 6's checkpoint passes in a preview with Stripe test mode and both webhook endpoints registered. Until US5 lands, the owner fulfils and refunds orders from the Stripe dashboard.

### Full feature

Phase 8 (US5) before the shop is promoted, since it carries refunds. Phase 9 (US6) can follow.

### One pull request per phase

Each phase from 2 to 9 is a pull request built with `/build-feature` and verified by `spec-verifier` with fresh context. Acceptance tests follow in `bjjeire-tests` as separate pull requests, except the US1 rename.

## Notes

- 81 tasks:

  | Phase | Tasks |
  |---|---|
  | Setup | 7 |
  | Foundational | 11 |
  | US1 | 5 |
  | US2 | 13 |
  | US4 | 6 |
  | US3 | 18 |
  | US7 | 3 |
  | US5 | 6 |
  | US6 | 5 |
  | Polish | 7 |

- Requirements with no dedicated issue are covered by these tasks: FR-010 card data (T056), FR-011 hold (T049, T057), FR-022 retention (T066), FR-028 the flag (T009, T011, T061).
