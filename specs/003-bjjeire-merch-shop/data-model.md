# Data Model: BJJ Éire Merch Shop

Document contracts to add on build:

- `specs/database-contracts/product.md`
- `specs/database-contracts/merch-order.md`
- `specs/database-contracts/shop-settings.md`

These conventions hold throughout:

- **Ids**: 24-character hex ObjectIds.
- **Money**: integer cents in euro (`currency` is always `EUR`).
- **Time**: UTC instants; days are counted in `Europe/Dublin`.
- **Enums**: wire values are `UPPER_SNAKE`, following the BJJ Éire competition exception, recorded in ADR-0016.

## Product (`Product`)

| Field | Type | Rules |
|---|---|---|
| `id` | ObjectId | |
| `slug` | string | Unique (`ux_product_slug`). Lowercase letters, digits and hyphens, 3–60 characters. `admin` and `photo` are reserved. |
| `name` | string | 1–80 characters |
| `kind` | enum | `RASHGUARD`, `SHORTS` or `T_SHIRT` |
| `description` | string | 1–2000 characters, plain text |
| `priceCents` | int | 100–100000 |
| `currency` | string | `EUR` |
| `photos` | list<string> | SHA-256 hex of GridFS files, in display order. 1–6 to publish; drafts may have 0. |
| `sizes` | list<ProductSize> | At least 1 to publish. One entry per size, in the order XS, S, M, L, XL, XXL. |
| `status` | enum | `DRAFT`, `PUBLISHED` or `HIDDEN` |
| `version` | long | Optimistic lock, as `BjjEireCompetition.version` does |
| `createdOnUtc`, `createdBy`, `updatedOnUtc`, `updatedBy` | audit | As other admin-owned documents |

### ProductSize (embedded)

| Field | Type | Rules |
|---|---|---|
| `id` | string | Stable id (`XS`, `S`, `M`, `L`, `XL`, `XXL`). One per product. |
| `stock` | int | ≥ 0. On the shelf and not yet sold. |
| `held` | int | ≥ 0 and ≤ `stock`. In unpaid checkouts; only the order flow changes it. |

Two values are derived, not stored: `available = stock - held`, and `soldOut = available == 0`.

### State transitions

| From | To | When |
|---|---|---|
| `DRAFT` | `PUBLISHED` | The organiser publishes, if the product has at least one photo and one size. |
| `PUBLISHED` | `HIDDEN` | The organiser hides it. Open checkouts already holding it still complete. |
| `HIDDEN` | `PUBLISHED` | The organiser shows it again. |

A product that any order names is never deleted. Only a draft that no order names can be deleted.

### Indexes

`ux_product_slug` (unique), and `ix_product_status_kind_name`.

## Merch order (`MerchOrder`)

| Field | Type | Rules |
|---|---|---|
| `id` | ObjectId | |
| `number` | string | Human-readable, `BJE-<yyyymmdd>-<6 base32>`. Unique (`ux_order_number`). |
| `accessKeyHash` | string | SHA-256 of the 32-byte access key (R6). Never returned by any route. |
| `accessKey` | string? | The key itself, until the order is confirmed or refunded (ADR-0018). Never returned by any route. |
| `status` | enum | `AWAITING_PAYMENT`, `CONFIRMED`, `DISPATCHED`, `EXPIRED` or `REFUNDED` |
| `lines` | list<OrderLine> | 1–20 lines, with at most 20 units in total (R7) |
| `itemsCents` | int | Sum of lines |
| `deliveryCents` | int | Copied from `ShopSettings` at creation |
| `totalCents` | int | `itemsCents + deliveryCents` |
| `currency` | string | `EUR` |
| `email` | string | Valid email, at most 254 characters |
| `address` | DeliveryAddress | See below |
| `holdExpiresAt` | instant? | Set while `AWAITING_PAYMENT` |
| `payment` | Payment | `checkoutSessionId`, `checkoutUrl`, `paymentIntentId?`, `status` (`PENDING`, `PAID` or `FAILED`), `paidAt?`, `unconfirmedAlertedAt?` |
| `refund` | Refund? | `refundId?`, `amountCents`, `status` (`PENDING`, `REFUNDED` or `FAILED`), `attempts`, `requestedAt`, `completedAt?`, `failureReason?` |
| `dispatch` | Dispatch? | `dispatchedAt`, `trackingReference?` (at most 100 characters), `by` |
| `createdOnUtc`, `expiredAt?`, `refundedAt?` | instant | `refundedAt` is when the refund completed |
| `emailSlot`, `ipSlot` | int? | 0–2 while `AWAITING_PAYMENT`, unique per email and per address (as built in slice 3): makes the R7 limit exact. Removed on any change of state. |
| `clientIp` | string? | Kept only while `AWAITING_PAYMENT`, for the unpaid-orders limit (R7). Removed on any change of state. |
| `retainUntil` | instant | TTL (R11): `paidAt` + 6 years, or `expiredAt` + 30 days |

### OrderLine (embedded)

The product fields are a snapshot taken when the order was created, so later edits never change a past order.

| Field | Type | Rules |
|---|---|---|
| `productId` | ObjectId | |
| `productName` | string | Snapshot |
| `kind` | enum | Snapshot |
| `sizeId` | string | |
| `quantity` | int | 1–10 |
| `unitPriceCents` | int | Snapshot of `Product.priceCents` |
| `photo` | string? | Snapshot of the first photo hash |

### DeliveryAddress (embedded)

| Field | Rules |
|---|---|
| `name` | 1–100 |
| `line1` | 1–100 |
| `line2` | 0–100 |
| `town` | 1–60 |
| `county` | 1–60 |
| `postcode` | `IE`: optional, and must match Eircode `^[AC-FHKNPRTV-Y]\d{2}|D6W\s?[0-9AC-FHKNPRTV-Y]{4}$` when present. `GB`: required, and must start with `BT`. |
| `country` | `IE` or `GB` |
| `phone` | Optional, at most 30 characters |

### State transitions (R9)

| From | To | Trigger | Stock effect |
|---|---|---|---|
| — | `AWAITING_PAYMENT` | `POST /order`, all lines held | `held += q` |
| `AWAITING_PAYMENT` | `CONFIRMED` | A signed `checkout.session.completed` (paid) or `async_payment_succeeded` | `stock -= q`, `held -= q` |
| `AWAITING_PAYMENT` | `EXPIRED` | A `checkout.session.expired` or `async_payment_failed` event, or the hold sweep finds Stripe reports `EXPIRED` | `held -= q` |
| `EXPIRED` | `CONFIRMED` | A late payment and the stock can be retaken | `stock -= q` |
| `EXPIRED` | `REFUNDED` | A late payment and the stock cannot be retaken: automatic full refund | none |
| `CONFIRMED` | `DISPATCHED` | The organiser marks it dispatched | none |
| `CONFIRMED` | `REFUNDED` | The organiser refunds it | `stock += q` |
| `DISPATCHED` | `REFUNDED` | The organiser refunds it with `confirmDispatched: true` | none |

`REFUNDED` carries `refund.status`, which is `PENDING` until Stripe reports the refund succeeded, and `FAILED` with an alert (`#6021`).

### Indexes

| Index | Purpose |
|---|---|
| `ux_order_number` (unique) | The order number |
| `ix_order_status_created` | The admin list, newest first, filtered by status |
| `ix_order_paidAt` | Dashboard sales |
| `ix_order_refundedAt` | Dashboard refunds |
| `ix_order_hold` on `{status, holdExpiresAt}` | The sweep |
| `ix_order_unpaid_email` and `ix_order_unpaid_ip` | Partial indexes on `AWAITING_PAYMENT`, for the limit in R7 |
| `ttl_order_retainUntil` | `expireAfterSeconds: 0` |

## OrderStripeEvent (`OrderStripeEvent`)

| Field | Type | Rules |
|---|---|---|
| `id` | string | The Stripe event id |
| `type` | string | |
| `receivedAt` | instant | |
| `handled` | boolean | Set to true only after the change is saved |
| `expiresAt` | instant | TTL of 30 days |

This is the same shape as `StripeEvent`, in a separate collection (R2).

## ShopSettings (`ShopSettings`)

A single document with `_id = "shop"`.

| Field | Type | Rules |
|---|---|---|
| `deliveryFeeCents` | int | 0–5000. Applies only to orders created after a change. |
| `version` | long | |
| audit fields | | |

## Product photo bucket (GridFS `productPhotos`)

Each file has:

- `filename`: the SHA-256 hex of the content;
- `metadata.contentType`: `image/jpeg`, `image/png` or `image/webp`, from the magic-number check;
- `metadata.uploadedBy`.

The file is deleted when no `Product.photos` entry names it.

## Not changed

`Store` (`specs/database-contracts/store.md`), `StripeEvent`, `BjjEireCompetitionRegistration`. Registration's new sessions and refunds gain only Stripe-side metadata (`bjjeireKind`), which is not stored.
