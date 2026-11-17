# BJJ Éire competition sign-ups: signals, alerts and switching on

What to watch once the `BjjEireCompetitions` flag is on, and what must exist
before it is. The behaviour is in
[specs/features/competitions.md](../specs/features/competitions.md). Payments
are covered by [ADR-0013](adr/0013-stripe-hosted-checkout-and-webhooks.md), and
running Stripe locally by [stripe-local.md](stripe-local.md).

## Metrics

The API serves them at `/actuator/prometheus`. Micrometer changes the dots to
underscores and adds `_total` to each counter.

| Prometheus name | Counts | Code |
|---|---|---|
| `registration_signup_started_total` | sign-ups that took a place and went to Stripe Checkout | `RegistrationServiceImpl.create` |
| `registration_signup_confirmed_total` | sign-ups the payment webhook confirmed, late payments included | `RegistrationServiceImpl.afterConfirmed` |
| `registration_signup_expired_total` | unpaid holds that ended and gave their place back (expiry webhook, hold sweep, competition cancelled) | `RegistrationServiceImpl.expire` |
| `registration_refund_requested_total` | refunds asked of Stripe, retries included | `CancellationServiceImpl.issueRefund`, `RegistrationServiceImpl.refundLatePayment` |
| `registration_refund_succeeded_total` | refunds recorded as completed, at once or by the `refund.updated` webhook | same, plus `CancellationServiceImpl.onRefundUpdated` |
| `registration_refund_failures_total` | refunds Stripe refused, reported failed, or could not be reached for | `RegistrationMetrics.refundFailed` |
| `registration_payment_unconfirmed_total` | holds Stripe reports as paid (or could not report on for a day) with no confirming webhook | `RegistrationServiceImpl.alertUnconfirmedPayment` |
| `registration_webhook_rejected_total{reason}` | webhook deliveries refused before any change: `unconfigured` (503), `signature` (400), `malformed` (400) | `StripeWebhookServiceImpl` |
| `registration_mail_failures_total` | mails still unsent after three attempts | `RegistrationMailSender` |
| `competitor_identity_deletion_failures_total` | account deletions the identity directory (Graph) did not complete | `CompetitorServiceImpl` |

Each counter increments only when its change is saved. A Stripe event that
arrives twice counts once.

## Logs

Every step logs one line with the sign-up id. These are `INFO` unless marked:
`Sign-up … started`, `… confirmed`, `… expired unpaid`, `… cancelled by …`,
`Late payment … refunded in full` (`WARN`), `Stripe webhook rejected: …`
(`WARN`; `ERROR` for an unconfigured secret). A line that starts with `ALERT`
(`ERROR`) needs a person: a failed refund, a paid sign-up with no webhook, or
a result whose undo was refused three times. Card details never reach the
API, so no log line contains them. The sign-up code logs ids, not email
addresses or competitor names. One exception: when a mail fails, the line
includes the SMTP server's error message, and that can name the recipient.

## Alerts

Two alerts need the organiser on the same day. Three more show something is
misconfigured. Below is a `PrometheusRule` that would fit beside the existing
ones in `bjjeire-gitops`. It is **not deployed yet**. Add it with the cluster
wiring (tasks.md T109), once the API's `ServiceMonitor` scrapes
`/actuator/prometheus`.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: bjj-eire-registration-rules
spec:
  groups:
    - name: bjj-eire-registration
      rules:
        # A competitor is owed money that Stripe has not returned.
        - alert: BjjEireRefundFailed
          expr: increase(registration_refund_failures_total[15m]) > 0
          labels:
            severity: critical
          annotations:
            summary: A refund failed and must be resolved by hand
            description: >-
              Find the ALERT log line for the sign-up id. The organiser's sign-up list shows
              "Refund pending". Retry from the cancelled competition, or refund in the Stripe dashboard.
        # Money was taken, but the sign-up was never confirmed.
        - alert: BjjEirePaymentUnconfirmed
          expr: increase(registration_payment_unconfirmed_total[15m]) > 0
          labels:
            severity: critical
          annotations:
            summary: Stripe took a payment that no webhook confirmed
            description: >-
              Check the webhook endpoint in the Stripe dashboard, then resend the event
              (docs/stripe-local.md § A payment that was never confirmed). The place stays held.
        - alert: BjjEireWebhookRejected
          expr: sum(increase(registration_webhook_rejected_total[15m])) > 5
          labels:
            severity: warning
          annotations:
            summary: Stripe webhook deliveries are being refused
            description: >-
              reason="unconfigured": STRIPE_WEBHOOK_SECRET is blank or a placeholder.
              reason="signature": the secret does not match the endpoint registered in Stripe, or someone else
              is calling the route. Payments are not confirmed while this lasts.
        - alert: BjjEireMailFailing
          expr: increase(registration_mail_failures_total[30m]) > 0
          labels:
            severity: warning
          annotations:
            summary: Sign-up mail is not being delivered
            description: Check the SMTP relay and its ServiceEntry. Sign-ups are unaffected; competitors miss mail.
        - alert: BjjEireIdentityDeletionFailed
          expr: increase(competitor_identity_deletion_failures_total[1h]) > 0
          labels:
            severity: warning
          annotations:
            summary: A deleted account is still in the competitor tenant
            description: >-
              The API already refuses the account. Delete the user in the tenant by hand, then check the
              Graph credentials and permission.
```

A health check that needs no alert: `registration_signup_started_total` keeps
rising while `registration_signup_confirmed_total` stays flat. That means
checkouts are opened but none are confirmed. Read the Stripe dashboard's
webhook attempts before anything else.

## Before the flag goes on in a cluster

These are done outside this repository. Do them in this order (research R15).
Each must be in place before the next starts.

1. **Competitor tenant** (T001): the external tenant, the SPA and API app
   registrations in `bjjeire-terraform-azurerm-aks`
   (`main.app-registrations.tf`), and the Graph permission to delete users
   (T009). Then the `VITE_APP_COMPETITOR_*` build arguments in CI; they are
   baked into the image (ADR-0006).
2. **Key Vault secrets**: apply the terraform so that the four
   `bjj-api-competitor-*` and `bjj-api-stripe-*` secrets hold real values. They
   are placeholders today.
3. **Chart** (`bjjeire-deploy`): the API chart takes the Stripe values from a
   Kubernetes secret by reference, and the mail settings (`SPRING_MAIL_*`,
   `MAIL_FROM`, `STRIPE_SUCCESS_URL_BASE`) from values.
4. **GitOps** (`bjjeire-gitops`): an `ExternalSecret` for the four names in
   `kubernetes/apps/base/bjj-eire/app/externalsecrets.yaml` and the preview
   copies, the Helm release mapping, and `ServiceEntry` resources in
   `kubernetes/apps/base/istio-egress/config/service-entries.yaml` for
   `api.stripe.com`, the competitor tenant's sign-in host,
   `graph.microsoft.com` and the SMTP relay. Add the `PrometheusRule` above.
5. **Stripe**: register the webhook endpoint
   `https://<api host>/api/v1/registration/stripe-webhook` for
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.expired`, `checkout.session.async_payment_failed`,
   `refund.created`, `refund.updated` and `refund.failed`, and put its signing
   secret in Key Vault. Use test keys in previews and live keys in production
   only.
6. **Content**: the privacy notice and the terms of entry, including the
   liability waiver. The owner supplies the wording (FR-012).
7. **Preview run**: in a preview with Stripe test mode, run the seven manual
   scenarios in
   [quickstart.md](../specs/001-tournament-registration/quickstart.md) (T112),
   the load check (T110), and the `bjjeire-tests` competitions suite.
8. **Switch on**: `FEATURE_BJJEIRE_COMPETITIONS=true` for the API.
