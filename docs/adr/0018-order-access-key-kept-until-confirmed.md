# ADR-0018: Keep an order's access key until the order is confirmed

- **Status:** Accepted
- **Date:** 2026-11-23
- **Applies to:** `order.MerchOrder.accessKey`, `order.OrderAccessKeys`, `order.OrderServiceImpl` (`confirmation`, `refundLatePayment`), `order.OrderMails.confirmed`; [specs/database-contracts/merch-order.md](../../specs/database-contracts/merch-order.md). Extends [ADR-0016](0016-bjjeire-merch-guest-checkout.md).

## Context

ADR-0016 lets a guest read their order with a 256-bit access key, and says
only its SHA-256 is stored, so a database leak exposes no working link
(research R6). The key reaches the guest twice: once in the checkout response,
and in the confirmation mail's link, `/shop/orders/{id}#key=…`.

The confirmation mail is sent by the shop's Stripe webhook, minutes after the
checkout request that made the key. With only the hash stored, the webhook has
no key to put in the link, and the guest's only lasting way to read their
order (FR-015, `#6011`) would be lost.

## Decision

`POST /api/v1/order` stores the key itself in `MerchOrder.accessKey` beside its
hash. The update that confirms the order (`AWAITING_PAYMENT` or `EXPIRED` to
`CONFIRMED`) removes it and returns the document as it was, and the
confirmation mail is built from that copy. The automatic refund of a late
payment removes it too. An order that expires keeps it, because a late payment
can still confirm it; the TTL deletes an expired order 30 days later
(research R11). Access is still checked against the hash, in constant time.
No route returns either field.

## Consequences

- The confirmation mail carries a working link without a new secret.
- A database leak exposes the keys of orders that are awaiting payment
  (30 minutes at most) or expired unpaid (30 days at most). Those orders hold a
  name, an email and an address, but no payment; a paid order has no stored
  key. This is narrower than ADR-0016 promised, and is accepted.
- A later mail (dispatch, refund; slice 4) cannot carry the link. It tells the
  guest to use the link in their confirmation mail.
- Removing the `unset("accessKey")` from the confirmation update would leave
  working keys on every paid order for six years.

## Alternatives considered

- **Derive the key: HMAC(server secret, order id).** Nothing key-related is
  stored, and every mail could carry the link. Rejected for now: a new secret in
  Key Vault, `bjjeire-deploy` and `bjjeire-gitops`, and rotating it breaks every
  link already sent. Revisit if later mails must carry the link.
- **Encrypt the key at rest with a server secret.** Same new secret, and every
  mail decrypts. Rejected for the same reason.
- **Send the link only in the checkout response.** The guest loses it when
  they close the tab, which FR-015 rules out.
