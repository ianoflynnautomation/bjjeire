# Quickstart: validating the BJJ Éire Merch Shop

Manual checks, one per story, against the local stack. The automated proof is the tests named in `specs/stc/shop/traceability.md` once built. Routes are in [contracts/contract.yaml](contracts/contract.yaml); states and fields are in [data-model.md](data-model.md).

## Prerequisites

- **Stack**: the dev container, with the local stack running (`README.md`):
  - API on `127.0.0.1:5003`;
  - SPA on `localhost:3000`;
  - Mailpit on `127.0.0.1:8025`.
- **Data**: `SEED_DATASET=test`. It seeds the directory stores and `seeder/data-test/products/`, which holds three published products:
  - a rashguard with stock in S, M and L, and XL sold out;
  - shorts with low stock (4 in M);
  - a t-shirt.
- **Flags**: `FEATURE_STORES=true` and `FEATURE_MERCH=true` for the API, then restart it.
- **Stripe**: test keys as in `docs/stripe-local.md`, with a second listener for the shop endpoint:

  ```bash
  stripe listen --api-key "$STRIPE_SECRET_KEY" \
    --forward-to 127.0.0.1:5003/api/v1/order/stripe-webhook \
    --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.expired,checkout.session.async_payment_failed,refund.created,refund.updated,refund.failed
  ```

  Set the `whsec_…` it prints as `STRIPE_SHOP_WEBHOOK_SECRET`. Keep the registration listener running too: both endpoints must receive each event, and each must ignore the other's.
- **Organiser**: local organiser sign-in (ADR-0014).

## 1. Rename (US1)

1. Open `/`. The navigation says **Shop**, not Stores.
2. Open `/stores`. You land on `/shop`.
3. On `/shop`, the directory lists the seeded stores, search filters them, and an unmatched search shows the empty state.
4. `sitemap.xml` lists `/shop` and not `/stores`.
5. `GET /api/v1/store` answers exactly as before.

## 2. Browse merch (US2)

1. On `/shop`, a **BJJ Éire merch** section sits above the directory search. Each product shows a photo, name, kind and euro price.
2. Open the rashguard. You see its photos and description. The sizes are XS to XXL as seeded, with XL marked sold out and not selectable.
3. Search the directory for "zzz". The merch section stays put.
4. Switch `FEATURE_MERCH=false`:
   - `/shop` shows only the directory;
   - `/shop/products/<slug>` redirects away;
   - `GET /api/v1/product` answers 404.

## 3. Buy (US3)

1. Add the rashguard in M (quantity 2) and the shorts in M to the basket, then open the basket. You see the lines, the item totals and a running total.
2. Check out with an Irish address and no Eircode, for example "Main St, Ennis, Clare, IE". You see items plus the flat delivery fee before paying.
3. Pay with `4242 4242 4242 4242`. Then:
   - the order page shows **Confirmed**;
   - Mailpit has one confirmation mail with the items, amount, address and a link;
   - in admin, rashguard M stock has dropped by 2 and shorts M by 1.
4. Open the link from the mail in a private window. The order shows. Change one character of the `#key=`. You get "Order not found".
5. Check out again and close the Stripe tab. After 32 minutes, or after triggering `checkout.session.expired`, the order shows **Expired** and the held stock is back.
6. Put the last unit of a size in two browsers' baskets. Pay in one. The other's checkout is refused with "sold out", and it is not charged.
7. Put shorts M in the basket, then raise its price in admin, then check out. You are told the price changed before paying.
8. Try a delivery address in GB with postcode `SW1A 1AA`. It is refused before payment. `BT1 1AA` is accepted.

## 4. Products and stock (US4)

1. In `/admin/shop`, create a t-shirt with one photo and S, M and L at stock 5. It is a **Draft**, and `/shop` doesn't show it.
2. Publish it. `/shop` shows it.
3. Hide it. `/shop` no longer shows it. An order already placed for it is unchanged.
4. Set M to 0. The product page shows M as sold out.
5. While a checkout holds 2 of S, try to set S to 1. You are told 2 are held.
6. Call `POST /api/v1/product/admin` with no token, then with a competitor token. You get 401, then 403.

## 5. Orders (US5)

1. The orders list shows the confirmed order with items, sizes, amount, email, address and status, newest first. Filter by **Confirmed**, then export the CSV.
2. Dispatch it with tracking reference "AN123". Mailpit has the dispatch mail.
3. Refund a second, undispatched order:
   - Stripe test mode refunds it;
   - the order shows **Refunded**;
   - the stock returns;
   - Mailpit has the refund mail.
4. Pay with `4000 0000 0000 5126` and refund that order. It shows **Refund pending**, then failed, and the API logs an `ALERT`.

## 6. Dashboard (US6)

1. After steps 3 and 5, open the dashboard for **Today**. The order count, money taken, money refunded and net match the orders list for today.
2. The rashguard leads the best sellers, with M showing the units sold.
3. The stock table marks shorts M as low (≤ 5) and rashguard XL as sold out.
4. Call `GET /api/v1/order/admin/dashboard` with no token. You get 401.

## 7. Directory unaffected (US7)

Run the `bjjeire-tests` gyms, events, competitions and shop-directory suites with `Merch` on and then off. They pass unchanged apart from the Shop name.
