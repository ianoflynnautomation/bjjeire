# Contract: the shop's Stripe webhook

`POST /api/v1/order/stripe-webhook`, in the `order` package. The second signed webhook allowed by ADR-0016 (amending constitution principle V, 1.3.0). It follows `specs/001-tournament-registration/contracts/stripe-webhook.md` except where noted below.

## Registration in Stripe

- **Endpoint**: `https://<api host>/api/v1/order/stripe-webhook`, registered in addition to the registration endpoint.
- **Events**: the same seven as registration:
  - `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `checkout.session.async_payment_failed`;
  - `refund.created`, `refund.updated`, `refund.failed`.
- **Secret**: its signing secret is `STRIPE_SHOP_WEBHOOK_SECRET`, held in Key Vault as `bjj-api-stripe-shop-webhook-secret`. A blank value or the placeholder `whsec_REPLACE_ME` gets 503, as registration's does.

## Which events it handles

Stripe sends each event to every endpoint subscribed to its type, under one `evt_` id (research R2). So both webhooks receive every checkout and refund event, and each decides from the object's metadata:

| `data.object.metadata.bjjeireKind` | Shop webhook | Registration webhook |
|---|---|---|
| `order` | handles | 200, ignored, not recorded |
| `registration` | 200, ignored, not recorded | handles |
| missing (sessions made before slice 0) | 200, ignored | handles (unchanged behaviour) |

Every new Checkout Session and Refund carries the kind: the shop sets `order`, registration sets `registration`.

## Verification and ledger

1. Verify the `Stripe-Signature` with `common.StripeSignature`, which is moved from registration and behaves the same. A bad or missing signature gets 400 and is counted in `order.webhook.rejected{reason}`.
2. Read `id`, `type` and `data.object` with Jackson.
3. If the object is not an `order`, answer 200 and stop.
4. Insert into `OrderStripeEvent`. A duplicate whose entry is already handled gets 200 and nothing more. A duplicate that isn't handled is applied again.
5. Apply the event. If applying fails, answer 5xx: the entry stays unhandled, and Stripe's retry applies it.
6. Set `handled = true` once the change is saved.

## Effects

| Event | Condition | Effect |
|---|---|---|
| `checkout.session.completed` | `payment_status = paid` | `AWAITING_PAYMENT` → `CONFIRMED` (stock committed). An order that is `EXPIRED` is either confirmed late, if its stock can be retaken, or refunded in full (`REFUNDED`). Confirmation mail goes out once. |
| `checkout.session.completed` | `payment_status = unpaid` | No change: a delayed payment method. |
| `checkout.session.async_payment_succeeded` | | As paid, above |
| `checkout.session.expired`, `checkout.session.async_payment_failed` | Order is `AWAITING_PAYMENT` | → `EXPIRED`, holds released |
| `refund.updated`, `refund.created` | `status = succeeded` | Refund marked `REFUNDED`, `refundedAt` set, refund mail sent once |
| `refund.failed`, or `refund.updated` with `status = failed` or `canceled` | | Refund marked `FAILED`, `order.refund.failures` incremented, `ALERT` logged (`#6021`) |

Refunds are matched by `metadata.orderId` and by the stored `refund.refundId`, never by email. A refund recorded without a `refundId` takes the first one Stripe reports and ignores any other. This closes the gap noted in registration's known limits.

## Metrics

These follow `RegistrationMetrics`:

- `order.checkout.started`, `order.confirmed`, `order.expired`;
- `order.refund.requested`, `order.refund.succeeded`, `order.refund.failures`;
- `order.payment.unconfirmed`;
- `order.webhook.rejected{reason}`;
- `order.holds.active` (a gauge).

They are documented and alerted in the payments operations doc.
