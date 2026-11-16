# Stripe and mail in local development

Sign-up payment uses Stripe hosted Checkout in **test mode** (ADR-0013).
Nothing here uses a live key.

## Variables

Put these in `.env` (gitignored). Names only are documented; values come from
the owner's Stripe account, test mode.

| Variable | Read as | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | `bjjeire.stripe.secret-key` | `sk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | `bjjeire.stripe.webhook-secret` | printed by `stripe listen` (below) |
| `STRIPE_SUCCESS_URL_BASE` | `bjjeire.stripe.success-url-base` | the SPA's origin; the local override uses `http://localhost:3000` |
| `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD` | `spring.mail.*` | blank host: mail is logged, not sent. The local override points at Mailpit |
| `MAIL_FROM` | `bjjeire.mail.from` | sender of sign-up mail |
| `REGISTRATION_HOLD` | `bjjeire.registration.hold` | default `PT30M`; Stripe refuses a Checkout expiry under 30 minutes |

## Forwarding webhooks

The API confirms a sign-up only from the signed webhook, so a local run needs
the Stripe CLI to forward test-mode events:

```bash
stripe login
stripe listen --api-key "$STRIPE_SECRET_KEY" \
  --forward-to http://127.0.0.1:5003/api/v1/registration/stripe-webhook \
  --events checkout.session.completed,checkout.session.expired,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,refund.created,refund.updated,refund.failed
```

The `refund.*` events complete a cancellation's refund ("Refunded" and the
refund mail) or record it as failed. A deployed endpoint registered in the
Stripe dashboard needs the same seven events.

Run it on the machine whose `127.0.0.1:5003` is the API (the Mac for the
local Docker stack). `--api-key` ties the listener to the same account or
sandbox as the API's key; a CLI logged in elsewhere sees none of the
payments, and every sign-up stays "Awaiting payment".

### A payment that was never confirmed

If a sign-up was paid while no listener was forwarding, it stays awaiting
payment, "Pay now" says the payment was received, and the API logs an
`ALERT … no webhook confirmed it` once the hold ends. Start the listener,
then send the event again:

```bash
stripe events list --api-key "$STRIPE_SECRET_KEY" --type checkout.session.completed --limit 5
stripe events resend <evt_…> --api-key "$STRIPE_SECRET_KEY"
```

The listener should print `[200]`. `[400]` means `STRIPE_WEBHOOK_SECRET` does
not match what `stripe listen` printed; `[503]` means it is still a
placeholder.

`stripe listen` prints a `whsec_…` secret. Set it as `STRIPE_WEBHOOK_SECRET`
and restart the API. A wrong secret makes every event answer 400.

## Test cards

On the Checkout page use any future expiry date and any CVC:

| Card | Result |
|---|---|
| `4242 4242 4242 4242` | payment succeeds: the sign-up is confirmed and a mail is sent |
| `4000 0000 0000 9995` | declined: Checkout stays open, nothing is confirmed |
| `4000 0025 0000 3155` | asks for 3-D Secure authentication |

To see an expiry without waiting 30 minutes, run
`stripe trigger checkout.session.expired`, or let the hold sweep end a lapsed hold.

Test-mode refunds of a `4242` payment succeed at once, so a cancellation
shows "Refunded" straight away. To see a refund fail later, pay with
`4000 0000 0000 5126` (Stripe test card whose refunds fail asynchronously; check it against Stripe's test-card list) and cancel: the sign-up
shows "Refund pending" and the API logs an `ALERT`.

## Mail

The local override starts Mailpit. Read sign-up mail at
<http://127.0.0.1:8025>. Its SMTP port is reachable only on the compose network.
