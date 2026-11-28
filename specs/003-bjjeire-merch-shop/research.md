# Research: BJJ Éire Merch Shop

Decisions behind [plan.md](plan.md). Items marked **Verify** are vendor facts to check in the first task that relies on them.

## R1. Checkout: Stripe hosted Checkout with several line items

- **Decision**: One Checkout Session per order.
  - **Line items**: one per order line, plus one for delivery.
  - **Price data**: built from the API's own prices (`price_data` with `unit_amount`), never from the request.
  - **Mode**: `payment`, currency `eur`.
  - **Expiry**: the stock hold plus the 2-minute margin registration uses.
  - **Metadata**: the session carries `client_reference_id = orderId` and `metadata.bjjeireKind = order`.
  - **Idempotency key**: `order-checkout-<orderId>-1`.
  - **Resuming**: "Return to payment" reuses the open session, as registration does.
- **Rationale**: The same provider, flow and confirmation rule as competitions (ADR-0013). Card data never reaches BJJ Éire (FR-010). Prices can't be tampered with.
- **Alternatives**:
  - Stripe Products/Prices kept in sync with the catalogue: two sources of truth.
  - An embedded Payment Element: more SPA code and a wider PCI scope, the same reason ADR-0013 gave.

## R2. A second webhook endpoint with its own ledger

- **Decision**: `POST /api/v1/order/stripe-webhook` in `order`, with its own signing secret, `STRIPE_SHOP_WEBHOOK_SECRET`.
  - **Events**: the same seven as registration: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `checkout.session.async_payment_failed`, `refund.created`, `refund.updated`, `refund.failed`.
  - **Filtering**: it handles only objects whose `metadata.bjjeireKind` is `order`, and acknowledges the rest with 200.
  - **Ledger**: processed event ids go in `OrderStripeEvent`, not `StripeEvent`.
  - **Registration's change**: new sessions and refunds get `metadata.bjjeireKind = registration`. Its webhook ignores `order` and treats a missing kind as its own, which keeps old sessions working.
- **Rationale**:
  - Stripe sends one event object, with one `evt_` id, to every endpoint subscribed to its type. A shared ledger would make whichever endpoint answered second skip the event. **Verify** in Stripe test mode with both endpoints registered.
  - Keeping each webhook in its own package honours ADR-0001.
- **Alternatives**:
  - One webhook in `common` that dispatches by kind: `common` would depend on both features.
  - One endpoint with the same secret and a shared ledger keyed by (endpoint, event): still a shared dispatcher.

## R3. Delivery address and the Ireland / Northern Ireland rule

- **Decision**: The API collects and validates the address before it creates the session.
  - **Fields**: name, line 1, optional line 2, town or city, county, postcode, country, optional phone, and the shopper's email.
  - **Allowed**: country `IE`, or `GB` with a postcode starting `BT` (Northern Ireland).
  - **Eircode**: optional, because rural addresses often omit it. When present it is checked against the Eircode format.
  - **Checkout**: the session gets the address as `payment_intent_data.shipping` and does not use `shipping_address_collection`.
  - **Delivery fee**: one flat fee from `ShopSettings.deliveryFeeCents`, set by the organiser. The fee and prices are copied onto the order when it is created.
- **Rationale**:
  - Stripe restricts shipping by country only, so it cannot tell Northern Ireland from the rest of GB. **Verify**: `allowed_countries` takes ISO country codes only.
  - Collecting the address ourselves also gives the organiser one consistent record (FR-017).
- **Alternatives**: Stripe address collection with `IE` and `GB`, then refunding non-NI addresses afterwards. That takes money it then has to return.

## R4. Product photos in MongoDB GridFS

- **Decision**: The organiser uploads with `multipart/form-data` to `POST /api/v1/product/admin/{id}/photo`.
  - **Checks**: the bytes are checked by magic number (JPEG, PNG, WebP only), at most 5 MB a photo and 6 photos per product.
  - **Storage**: GridFS bucket `productPhotos`, filed under the SHA-256 of the content.
  - **Serving**: `GET /api/v1/product/photo/{sha256}` serves a photo with:
    - the checked `Content-Type`;
    - `Cache-Control: public, max-age=31536000, immutable`;
    - `X-Content-Type-Options: nosniff`.
  - **Clean-up**: removing a photo from a product deletes the file only when no other product names it.
  - **Request limits**: `spring.servlet.multipart.max-file-size=5MB` and `max-request-size=6MB`.
- **Rationale**:
  - No new cloud resource, secret, `ServiceEntry` or workload identity, which keeps the constitution's "no new cloud stack" rule.
  - Photos are backed up with the database. At tens of products the volume is tiny.
  - Content addressing makes the URL immutable and cacheable at Cloudflare.
- **Alternatives**:
  - Azure Blob Storage with a SAS or a public container: terraform, Key Vault, egress rules and CORS for a few megabytes.
  - Typed image URLs, as gyms and stores use: the owner asked to upload photos, and external links rot.
- **Not done**: resizing or stripping EXIF metadata on the server. The organiser's own photos carry no third-party privacy concern. The SPA shows them with `object-contain` at fixed aspect ratios. A later task can strip EXIF if wanted.

## R5. Stock and holds

- **Decision**: Each size records `stock` (on the shelf, not yet sold) and `held` (in unpaid checkouts). Available means `stock - held`.
  - **Holding**: a conditional `findAndModify` on the product that increments `sizes.$[s].held` only when `stock - held >= quantity`, through an array filter on the size's id.
  - **Several lines**: holds go line by line in a fixed order, product id then size, so two baskets can't deadlock. If a line fails, the lines already held are released and the shopper gets 409 `size-sold-out`, naming the size.
  - **Paid**: `stock -= q` and `held -= q` for each line, in the same conditional update.
  - **Expiry or cancellation before payment**: `held -= q`.
  - **Organiser edits**: they set `stock` directly. Setting it below `held` is refused with 409 `stock-below-held`, naming the number held, which meets the spec's "holds already taken are honoured".
- **Rationale**: Mirrors registration's `takePlace`/`releasePlace`, with no multi-document transaction (none is used elsewhere). Under concurrency the sale never exceeds stock (SC-003).
- **Alternatives**:
  - Mongo transactions across products: the project avoids them, and they are not needed for single-document conditions.
  - One document per stock unit: needless at this scale.

## R6. Guest access to an order

- **Decision**: Creating an order generates a 32-byte random access key.
  - **Storage**: only its SHA-256 is stored.
  - **Link**: the confirmation email links to `/shop/orders/{orderId}#key=<base64url>`.
  - **Request**: the SPA reads the URL fragment and calls `GET /api/v1/order/{orderId}` with the header `X-Order-Key`.
  - **Mismatch**: a wrong or missing key gets 404, not 403, so ids can't be probed.
  - **Checkout return**: the API hands the key back once in the checkout response, so the page Stripe returns to can poll the status.
- **Rationale**: A browser never sends the fragment to a server, so the key stays out of server logs and `Referer`. Hashing means a database leak exposes no working links.
- **As built (slice 3)**: the confirmation mail is sent by the webhook, which has no key to put in its link. The key itself is therefore kept on the order until the order is confirmed or refunded ([ADR-0018](../../docs/adr/0018-order-access-key-kept-until-confirmed.md)). The success URL carries no key: the checkout page keeps it in `sessionStorage` for the page Stripe returns to.
- **Alternatives**:
  - A key in the query string: it ends up in access logs.
  - Asking for the email address to look an order up: guessable and enumerable.

## R7. Abuse limits for unauthenticated checkout

- **Decision**:
  - **Quantities**: at most 10 units per line and 20 units per order (409 `basket-too-large`).
  - **Concurrent holds**: at most 3 unpaid orders at once per email address and per client IP. Over that is 409 `too-many-unpaid`, using `ClientIps` as rate limiting does.
  - **Rate limiting**: the global limiter covers `/api/v1/order`.
  - **Visibility**: the holds sweep publishes `order.holds.active` as a gauge.
- **As built (slice 3)**: each unpaid order takes a slot, 0 to 2, per email and per address, enforced by the partial unique indexes `ux_order_unpaid_email_slot` and `ux_order_unpaid_ip_slot`, as registration's `ux_registration_unpaid_slot` does. A count before inserting could be beaten by parallel requests; the slots cannot. A slot is freed by any change of state.
- **Rationale**: This is the equivalent of the competitions' two-unpaid rule (FR-041) for shoppers with no identity. A determined bot can still rotate emails and IPs, which the risk table records together with the Turnstile follow-up.

## R8. Basket in the browser

- **Decision**: The basket lives in `localStorage` under `bjjeire-basket`, as `{productId, sizeId, quantity}` only, so no prices are kept.
  - **Displayed prices**: the SPA re-reads products to show them.
  - **Checkout**: the API recomputes everything, refuses unknown, hidden or sold-out lines, and reports changes (`#6010`) with 409 `basket-changed` and a list of what changed.
- **Rationale**: No server basket for anonymous visitors, no cookies, and no consent banner. The project rules allow `localStorage` for per-viewer conveniences, and the basket holds no tokens or personal data.
- **Alternatives**: A server-side basket keyed by an anonymous cookie: more state and a cookie notice, for no gain.

## R9. Orders: states and timing

- **Decision**: An order moves through these states, as in [data-model.md](data-model.md):
  - `AWAITING_PAYMENT` → `CONFIRMED` → `DISPATCHED`;
  - `AWAITING_PAYMENT` → `EXPIRED`;
  - `CONFIRMED` or `DISPATCHED` → `REFUNDED`, with the refund status `PENDING`, `REFUNDED` or `FAILED`.

  Other rules:
  - **Hold**: 30 minutes (FR-011), plus the 2-minute Checkout margin.
  - **Late payment**: after expiry, retake the stock if it's there and confirm; otherwise refund automatically (FR-013), as registration does.
  - **Refunds**: only the organiser refunds. A refund of a dispatched order needs `confirmDispatched: true` in the request (edge case); its stock does not return.
- **Rationale**: The same model and failure handling as the sign-ups the team already runs.

## R10. Dashboard

- **Decision**: A pure `SalesDashboard.calculate(orders, products, period, zone)`, unit-tested with the `#6023` aggregation.
  - **Data**: fed by one query for orders with `paidAt` in the period, one for `refundedAt` in the period, and the product list.
  - **Periods**: today, last 7 days, last 30 days, this year, or two dates. All are Irish calendar days (`Europe/Dublin`), as `dublinToday` already is.
  - **Totals**:
    - money taken: the sum of `totalCents` of orders paid in the period;
    - refunded: the sum of refunds completed in the period;
    - net: taken minus refunded.
  - **Units**: per product and size from the order lines, best sellers by units then money.
  - **Stock**: from the products, low when available ≤ 5 and sold out when 0.
  - **Caching**: none. The organiser reads it rarely and it must match the orders list (FR-026).
- **Alternatives**: Mongo `$group` aggregation pipelines. They are faster at scale, but harder to test against the orders list, and not needed at hundreds of orders a year.

## R11. Retention and personal data

- **Decision**:
  - **Paid orders**: get `retainUntil = paidAt + 6 years`, and a TTL index removes the whole order then (FR-022, GDPR).
  - **Unpaid orders**: expired ones get `retainUntil = expiredAt + 30 days`.
  - **Visibility**: there are no shopper accounts, so personal data is visible to the organiser only, through admin routes, and to the holder of the order key.
- **Rationale**: TTL is the simplest reliable deletion, and an order without its personal data has no accounting use left after six years.

## R12. The Stores → Shop rename

- **Decision**:
  - **Changes, SPA only**:
    - path `/shop`;
    - the `paths.shop` entry;
    - the label "Shop";
    - the page title;
    - the sitemap;
    - a `<Navigate replace>` from `/stores` and `/stores/*` to `/shop`.
  - **Unchanged**:
    - the API route `/api/v1/store`;
    - the `Store` collection and `StoreDto`;
    - the `Stores` flag and its `FEATURE_STORES` variable;
    - the `StoresDataTestIds` values.
  - **Edge redirect**: Caddy needs none, because the SPA serves every path. Search engines follow the sitemap and the client-side redirect. A server 301 can follow later if wanted.
- **Rationale**: Each of the unchanged items is a published contract (ADR-0002), and renaming any of them is a breaking change with no visitor benefit (spec Assumptions).
- **Alternatives**: A full rename to `/api/v1/shop` with an accepted-breaks entry: it breaks `bjjeire-tests`, Pact and the seeder for cosmetic reasons.
