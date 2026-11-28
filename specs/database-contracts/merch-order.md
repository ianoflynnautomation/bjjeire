# Database contract: MerchOrder

BJJ Éire merch guest orders (ADR-0016, ADR-0018). Built in slice 3 of [specs/003-bjjeire-merch-shop/](../003-bjjeire-merch-shop/spec.md).

**Collections**: `MerchOrder`, `OrderStripeEvent`
**Java**: `com.bjjeire.api.order.MerchOrder` (embedded `OrderLine`, `DeliveryAddress`, `OrderPayment`, `OrderRefund`, `OrderDispatch`), `com.bjjeire.api.order.OrderStripeEvent`
**Seeder**: none. Orders are written only by guests through the API and by Stripe's webhook.
**API contract**: [../stc/shop/contract.yaml](../stc/shop/contract.yaml)
**Design record**: [../003-bjjeire-merch-shop/data-model.md](../003-bjjeire-merch-shop/data-model.md)

## Document

| Field | Mongo | Type | Notes |
|---|---|---|---|
| `id` | `_id` | ObjectId string | |
| `number` | `number` | string | **unique** (`ux_order_number`); `BJE-<yyyymmdd>-<6 base32>`, the Irish calendar day it was made |
| `accessKeyHash` | `accessKeyHash` | string | SHA-256 hex of the order's 32-byte access key (research R6). Never returned by any route |
| `accessKey` | `accessKey` | string? | The key itself, kept only until the confirmation mail is built from it (ADR-0018). Removed when the order is confirmed or refunded; an expired order keeps it until the TTL removes the order. Never returned by any route |
| `status` | `status` | enum | `AWAITING_PAYMENT`, `CONFIRMED`, `DISPATCHED`, `EXPIRED`, `REFUNDED` |
| `lines` | `lines` | `OrderLine[]` | 1–20 lines, at most 10 units each and 20 in all (research R7) |
| `itemsCents` | `itemsCents` | int | sum of the lines |
| `deliveryCents` | `deliveryCents` | int | `ShopSettings.deliveryFeeCents` when the order was made |
| `totalCents` | `totalCents` | int | `itemsCents + deliveryCents` |
| `currency` | `currency` | string | always `"EUR"` |
| `email` | `email` | string | lower-cased, ≤ 254. Personal data |
| `address` | `address` | `DeliveryAddress` | Personal data |
| `holdExpiresAt` | `holdExpiresAt` | instant? | set only while `AWAITING_PAYMENT`; creation + 30 minutes |
| `payment` | `payment` | `OrderPayment` | |
| `refund` | `refund` | `OrderRefund`? | |
| `dispatch` | `dispatch` | `OrderDispatch`? | slice 4 |
| `createdOnUtc` | `createdAt` | instant | |
| `expiredAt` | `expiredAt` | instant? | |
| `refundedAt` | `refundedAt` | instant? | when Stripe reported the refund completed |
| `clientIp` | `clientIp` | string? | kept only while `AWAITING_PAYMENT`, for the unpaid-orders limit (research R7); removed on any change of state |
| `emailSlot` | `emailSlot` | int? | 0–2 while `AWAITING_PAYMENT`: which of the email's three unpaid places the order holds. Unique per email (`ux_order_unpaid_email_slot`), so the limit is exact under concurrency, as registration's `unpaidSlot`. Removed on any change of state, which frees the place |
| `ipSlot` | `ipSlot` | int? | the same per client address (`ux_order_unpaid_ip_slot`); absent when the address is unknown |
| `retainUntil` | `retainUntil` | instant? | TTL (`ttl_order_retainUntil`): `paidAt` + 6 years for a paid order (FR-022), `expiredAt` + 30 days for an unpaid one. An order still awaiting payment has none, so an unconfirmed payment is never lost |

### OrderLine (embedded)

A snapshot taken when the order is made: a later edit of the product never changes a past order (FR-007, `#6015`).

| Field | Type | Notes |
|---|---|---|
| `productId` | ObjectId string | |
| `productName` | string | snapshot |
| `kind` | enum | snapshot |
| `sizeId` | enum | `XS` … `XXL` |
| `quantity` | int | 1–10 |
| `unitPriceCents` | int | snapshot of `Product.priceCents` |
| `photo` | string? | snapshot of the first photo's hash |

### DeliveryAddress (embedded)

| Field | Notes |
|---|---|
| `name` | 1–100 |
| `line1` | 1–100 |
| `line2` | 0–100, optional |
| `town` | 1–60 |
| `county` | 1–60 |
| `postcode` | upper-cased. `IE`: optional, an Eircode when given. `GB`: required, starts `BT` |
| `country` | `IE` or `GB` (Northern Ireland only) |
| `phone` | optional, ≤ 30 |

### OrderPayment (embedded)

`checkoutSessionId`, `checkoutUrl`, `paymentIntentId?`, `status` (`PENDING`, `PAID`, `FAILED`), `paidAt?`, `unconfirmedAlertedAt?` (set once when the hold sweep found the session paid with no webhook). No card details (FR-010).

### OrderRefund (embedded)

`refundId?`, `amountCents`, `status` (`PENDING`, `REFUNDED`, `FAILED`), `attempts`, `requestedAt`, `completedAt?`, `failureReason?`. In slice 3 only the automatic refund of a late payment with no stock left writes it (FR-013); the organiser's refunds come with slice 4.

### State transitions

Each is one `findAndModify` guarded on the status it leaves, so a redelivered event, a second pod or the sweep applies it once.

| From | To | Trigger | Stock (through `product.StockLedger`) |
|---|---|---|---|
| — | `AWAITING_PAYMENT` | `POST /api/v1/order`, every line held | `held += q` |
| `AWAITING_PAYMENT` | `CONFIRMED` | signed `checkout.session.completed` (paid) or `async_payment_succeeded` | `stock -= q`, `held -= q` |
| `AWAITING_PAYMENT` | `EXPIRED` | `checkout.session.expired`, `async_payment_failed`, or the hold sweep | `held -= q` |
| `EXPIRED` | `CONFIRMED` | a late payment, the stock can be taken again | `stock -= q` |
| `EXPIRED` | `REFUNDED` | a late payment, the stock is gone: full automatic refund | none |

### Indexes

`ux_order_number` (unique), `ix_order_status_created`, `ix_order_paidAt` (sparse), `ix_order_refundedAt` (sparse), `ix_order_hold` (`status`, `holdExpiresAt`), `ux_order_unpaid_email_slot` and `ux_order_unpaid_ip_slot` (unique, partial on the slot existing), `ttl_order_retainUntil` (`expireAfterSeconds: 0`). Declared in `config/MongoIndexInitializer`.

## OrderStripeEvent

The shop webhook's idempotency ledger, separate from registration's `StripeEvent`, because Stripe sends one event id to both endpoints (research R2).

| Field | Mongo | Type | Notes |
|---|---|---|---|
| `id` | `_id` | string | the Stripe event id |
| `type` | `type` | string | |
| `receivedAt` | `receivedAt` | instant | |
| `handled` | `handled` | boolean | true once the change is saved; an unhandled entry is applied again on Stripe's retry |
| `expiresAt` | `expiresAt` | instant | `receivedAt` + 30 days; TTL `ttl_orderStripeEvent_expiresAt` |

Only events whose object has `metadata.bjjeireKind = order` are recorded.
