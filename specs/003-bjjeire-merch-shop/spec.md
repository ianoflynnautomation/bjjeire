# Feature Specification: BJJ Éire Merch Shop

**Feature Branch**: `003-bjjeire-merch-shop`

**Created**: 2026-11-17

**Status**: In progress. Slice 1 (US1, `#4005`–`#4007`) built; living spec: [specs/features/shop.md](../features/shop.md). Slices 0 and 2–5 not built.

**Input**: User description: "i would like a add a shop feature in which it should allow me to sell bjjeire merch. I want to be able to sell rashguards, shorts and tshirts. you should rename stores feature to shop and add feature at home of page to allow users to buy bjjeire stuff. under this should be similar to competitions in which  you can shop other ireland stores. users should be able to pay via strip the same as competitions. it should have admin page and have a admin dasnboard of sales, inventory etc."

## Terms

- **Shop**: the section of the site now called Stores. It holds two things on one page:
  - BJJ Éire's own merch, at the top;
  - the existing directory of other Irish BJJ stores, below it.
- **Merch**: clothing BJJ Éire sells itself. There are three kinds: rashguards, shorts and t-shirts.
- **Product**: one item for sale, such as "BJJ Éire Harp Rashguard, long sleeve". It has:
  - a name, a kind, a description, photos and one price;
  - the sizes it comes in.
- **Size**: one of XS, S, M, L, XL, XXL. Each size of each product has its own stock count.
- **Basket**: the products and sizes a shopper has chosen and not yet paid for.
- **Order**: one paid purchase of one or more products and sizes.
- **Organiser**: the BJJ Éire admin, the site owner. The only person who manages products, stock and orders. This is the same organiser who runs BJJ Éire competitions.
- **Shopper**: anyone buying merch.
- **Directory store**: a store in the existing directory of other Irish BJJ stores. BJJ Éire does not sell its goods; it only links to them.

## User Scenarios & Testing *(mandatory)*

User stories are prioritized journeys. Each story is independently testable.

### User Story 1 - Stores becomes Shop, with the directory unchanged below (Priority: P1)

Visitors find the section under its new name, Shop, at a new address.

- The directory of Irish BJJ stores works exactly as it does today, with the same search and the same cards.
- Old links to Stores still lead visitors to it.

**Why this priority**: Everything else in this feature lives on the Shop page. The rename is also the change most likely to break things a visitor relies on today: bookmarks, search results and the site map.

**Independent Test**: Open the site with the merch switch off. The navigation says Shop, the Shop page lists and searches the directory stores as Stores did, and an old Stores link lands on Shop.

**Acceptance Scenarios** (one GitLab issue each; provisional ids `#4005` onward extend the Stores epic, and `#6001` onward start a new merch epic, both matching `specs/stc/shop/spec.md`. The epic stays on that file's **Requirements** line. `bjjeire-tests` records the same issue on `Covers:`):

1. **`#4005`**: **Given** a visitor on any page, **When** they look at the site navigation, **Then** the entry that said "Stores" says "Shop" and opens the Shop page; no visible text calls the section "Stores"
2. **`#4006`**: **Given** published directory stores, **When** a visitor opens Shop, **Then** they see the same store cards, order, search, empty state and error handling that Stores had
3. **`#4007`**: **Given** a link or bookmark to the old Stores address, **When** a visitor follows it, **Then** they land on the Shop page, and the site map lists only the Shop address

---

### User Story 2 - Shopper browses BJJ Éire merch at the top of Shop (Priority: P1)

A visitor opens Shop and first sees BJJ Éire's own merch in a featured section.

- Each product shows a photo, its name, its kind (rashguard, shorts or t-shirt), its price in euro, and whether it is in stock.
- Opening a product shows its photos, description, price and sizes, and marks which sizes are sold out.
- The directory of other Irish stores follows below, as in Story 1.

**Why this priority**: Before anyone can buy, the merch has to be visible, and placing it at the top of Shop is the user's explicit request.

**Independent Test**: With products published, a visitor who is not signed in opens Shop. They see the merch section above the directory, open a product, and see its sizes with sold-out sizes marked.

**Acceptance Scenarios**:

1. **`#6001`**: **Given** published products, **When** a visitor opens Shop, **Then** a "BJJ Éire merch" section above the directory search shows each product with photo, name, kind, price in euro and an "Out of stock" mark when no size is in stock
2. **`#6002`**: **Given** a published product, **When** a visitor opens it, **Then** they see its photos, description, price and every size it comes in, with sold-out sizes shown and not selectable
3. **`#6003`**: **Given** no product is published, **When** a visitor opens Shop, **Then** there is no merch section and no placeholder, and the directory shows as before
4. **`#6004`**: **Given** a visitor on Shop, **When** they search the directory or move between its pages, **Then** only the directory is filtered or paged and the merch section stays as it is

---

### User Story 3 - Shopper buys merch and pays online (Priority: P1)

A shopper adds one or more products in chosen sizes to a basket and reviews the total. The total covers items and delivery.

- The shopper pays online with the same payment provider BJJ Éire competitions use.
- When payment succeeds, the order is confirmed, stock goes down, and the shopper gets a confirmation email with what they bought, the amount paid and the delivery details.

**Why this priority**: This is the reason for the feature. With stories 1 to 3 the organiser can take money for merch.

**Independent Test**: With a product in stock, a shopper adds two sizes to the basket, pays in test mode, and receives the confirmation. The stock of both sizes has dropped.

**Acceptance Scenarios**:

1. **`#6005`**: **Given** a product size in stock, **When** a shopper adds it to the basket, **Then** the basket shows it with quantity, item price and running total, and the shopper can change the quantity or remove it
2. **`#6006`**: **Given** a basket, **When** the shopper goes to pay, **Then** they see the full amount, items plus delivery, before paying, and are asked for the delivery details the order needs
3. **`#6007`**: **Given** a shopper paying for a basket, **When** the payment succeeds, **Then** the order is confirmed, each size's stock goes down by the quantity bought, and a confirmation email is sent with items, amount paid and delivery details
4. **`#6008`**: **Given** a shopper paying for a basket, **When** the payment fails or is abandoned, **Then** no order is confirmed, no money is taken, and the stock held for them is released
5. **`#6009`**: **Given** the last items of a size, **When** two shoppers try to buy them at the same moment, **Then** only as many as are in stock are sold; the other shopper is told the size sold out and is not charged, or is refunded in full if a charge was taken
6. **`#6010`**: **Given** a basket that holds a size that has since sold out or a price that has since changed, **When** the shopper goes to pay, **Then** they are told what changed before they pay
7. **`#6011`**: **Given** a confirmed order, **When** the shopper follows the link in their confirmation email, **Then** they can see the order's items, amount paid, delivery details and status
8. **`#6012`**: **Given** a visitor with no account, **When** they buy merch, **Then** they check out as a guest with their name and email, and are never asked to sign in or create an account

---

### User Story 4 - Organiser manages products and stock (Priority: P1)

The organiser signs in to an admin page and adds a product.

- A product has a name, kind, description, photos, price and sizes, with a stock count for each size.
- A product is kept as a draft until it is published.
- The organiser can later edit a product, change its stock, and hide it from sale.

**Why this priority**: No merch can be shown or sold until the organiser can put it in the shop.

**Independent Test**: The organiser creates a rashguard with stock in three sizes and publishes it. A visitor sees it on Shop. The organiser then sets one size to zero and the visitor sees it sold out.

**Acceptance Scenarios**:

1. **`#6013`**: **Given** the organiser is signed in, **When** they save a product with name, kind, description, price and at least one size with its stock, and then add its photos, **Then** it is stored as a draft that visitors cannot see. A draft may have no photo yet; publishing needs at least one (`#6014`).
2. **`#6014`**: **Given** a draft product, **When** the organiser publishes it, **Then** visitors see it in the merch section; **When** the organiser hides it, **Then** visitors no longer see or buy it, and orders already placed for it are unchanged
3. **`#6015`**: **Given** a product, **When** the organiser changes its price, **Then** new baskets use the new price and orders already paid keep the price they paid
4. **`#6016`**: **Given** a product size, **When** the organiser sets or adjusts its stock, **Then** the shop shows the new availability straight away
5. **`#6017`**: **Given** a person who is not the organiser, **When** they try to create, edit, publish, hide or restock a product, **Then** they are refused

---

### User Story 5 - Organiser fulfils orders and refunds (Priority: P2)

The organiser sees every order with its items, sizes, amount paid, shopper's contact and delivery details, and status.

- They mark an order as dispatched; the shopper is emailed.
- They can cancel an order with a full refund to the original payment method; the stock goes back and the shopper is emailed.

**Why this priority**: The orders have to be shipped and occasionally refunded. A first run of sales could be fulfilled by hand from the payment provider's dashboard, so this story comes after the ability to sell.

**Independent Test**: The organiser opens a paid order, marks it dispatched, and the shopper gets the dispatch email. The organiser refunds a second order, the shopper is refunded and emailed, and its stock returns.

**Acceptance Scenarios**:

1. **`#6018`**: **Given** confirmed orders, **When** the organiser opens the orders list, **Then** each order shows its date, items and sizes, amount paid, shopper's name, email and delivery details, and status, newest first, and the list can be filtered by status and exported
2. **`#6019`**: **Given** a confirmed order, **When** the organiser marks it dispatched (optionally with a tracking reference), **Then** its status changes and the shopper is emailed
3. **`#6020`**: **Given** a confirmed order not yet dispatched, **When** the organiser cancels it with a refund, **Then** the full amount goes back to the original payment method, the stock returns, the order shows as refunded, and the shopper is emailed
4. **`#6021`**: **Given** a refund the payment provider cannot complete, **When** it fails, **Then** the order shows "refund pending" and the organiser is alerted to resolve it by hand

---

### User Story 6 - Organiser sees a sales and stock dashboard (Priority: P2)

The organiser opens a dashboard.

- It shows sales for a chosen period: the number of orders, the money taken, money refunded, and units sold per product and size.
- It shows stock: what is left of each product size, and which sizes are low or sold out.

**Why this priority**: The user asked for it, and it guides what to reorder. Sales can still happen and be fulfilled without it.

**Independent Test**: After three orders and one refund in a week, the organiser opens the dashboard for that week. The order count, money taken, refunds and units sold match the orders, and a size bought down to its low-stock level is flagged.

**Acceptance Scenarios**:

1. **`#6022`**: **Given** orders over time, **When** the organiser picks a period (today, last 7 days, last 30 days, this year, or two dates), **Then** the dashboard shows the number of paid orders, money taken, money refunded and net sales for that period, matching the orders list
2. **`#6023`**: **Given** orders in a period, **When** the organiser views the dashboard, **Then** they see units sold and money taken per product and per size, best sellers first
3. **`#6024`**: **Given** products in stock, **When** the organiser views the dashboard, **Then** they see the stock left for every product size, with sizes at or below the low-stock level (5 units) and sold-out sizes marked
4. **`#6025`**: **Given** a person who is not the organiser, **When** they try to open the orders list or the dashboard, **Then** they are refused

---

### User Story 7 - The existing site stays as it is when merch is off (Priority: P1)

The merch shop can be switched off as a whole.

- When it is off, Shop shows only the directory, as in Story 1.
- No basket, product page or merch admin screen is reachable.

**Why this priority**: The owner needs to launch merch when stock and photos are ready, independently of the rename, as was done for competitions.

**Independent Test**: With merch switched off, Shop shows the directory and no merch section, and a product address shows "not found".

**Acceptance Scenarios**:

1. **`#6026`**: **Given** merch is switched off, **When** a visitor uses the site, **Then** Shop shows only the directory, and no merch section, basket, product page or merch admin screen can be reached
2. **`#6027`**: **Given** merch is switched on, **When** a visitor who only browses gyms, events, competitions or the store directory uses the site, **Then** nothing they did before needs an account or has changed
3. **`#6028`**: **Given** the store directory is switched off and merch is on, **When** a visitor opens the site, **Then** the Shop navigation entry and the Shop page are still there, showing only the merch section with no directory and no directory search. This deliberately differs from Competitions (`#3015`), where the page goes away with its directory.

---

### Edge Cases

- A payment succeeds but the shopper closes the page before returning: the order must still end up confirmed and the confirmation email still sent.
- A size sells out while a shopper is paying for it: stock is held for them while they pay, for the same limited time as a competition place (30 minutes). It is released if they do not finish.
- The organiser lowers stock below what is held in unpaid baskets: holds already taken are honoured and the shown stock never goes below zero.
- The organiser hides or deletes a product that sits in a shopper's basket or in past orders: the basket says it is no longer available; past orders keep their items, sizes and prices.
- The organiser changes a price while a shopper is paying: the shopper pays the price they were shown at checkout.
- The confirmation email cannot be sent: the order stays confirmed and the organiser can see it.
- A refund is asked for an order already dispatched: the organiser decides by hand; the system allows a refund of a dispatched order only after a warning that the goods have left.
- A basket for a size of 0 stock, a quantity of 0, or a quantity above the stock: refused with a clear message, nothing charged.
- A delivery address outside the Republic of Ireland and Northern Ireland: refused before payment, with an explanation.
- The organiser changes the delivery fee while a shopper is paying: the shopper pays the fee they were shown at checkout.

## Requirements *(mandatory)*

### Functional Requirements

**Shop and directory**

- **FR-001**: The section called Stores MUST be called Shop everywhere a visitor sees it, at a Shop address. Old Stores addresses MUST lead to Shop.
- **FR-002**: The directory of Irish stores MUST keep its current content, order, search, empty and error behaviour on the Shop page. It stays read-only.
- **FR-003**: When merch is on and at least one product is published, Shop MUST show a BJJ Éire merch section above the directory. Searching or paging the directory MUST NOT change it.

**Products and stock**

- **FR-004**: The organiser MUST be able to create, edit, publish and hide products. A product has a name, a kind (rashguard, shorts or t-shirt), a description, one or more photos, a price in euro, and the sizes it comes in.
- **FR-005**: Each size of each product MUST have its own stock count. The organiser can set or adjust it. A size with no stock MUST show as sold out and MUST NOT be sold.
- **FR-006**: Only published products MUST be visible to visitors. Drafts and hidden products MUST NOT be shown or sold.
- **FR-007**: A price change MUST apply only to new checkouts. Paid orders keep the price paid.

**Basket and payment**

- **FR-008**: Shoppers MUST be able to add product sizes to a basket, change quantities, and remove items. A quantity can never exceed the stock of that size.
- **FR-009**: The shopper MUST be shown the full amount, items plus delivery, and asked for delivery details before paying.
- **FR-010**: Payment MUST be taken online through the same payment provider and hosted checkout BJJ Éire competitions use. Card details MUST NOT reach or be stored by BJJ Éire.
- **FR-011**: The stock in a checkout MUST be held for 30 minutes while the shopper pays, and released if payment is not completed.
- **FR-012**: An order MUST be confirmed only when the payment provider reports a successful payment, whether or not the shopper returns to the site. One payment MUST confirm at most one order, and no shopper is charged twice for one order.
- **FR-013**: More items than are in stock MUST NOT be sold. A payment that arrives for stock that is no longer there MUST be refunded in full automatically.
- **FR-014**: The system MUST email the shopper when an order is confirmed, dispatched, and cancelled or refunded.
- **FR-015**: A shopper MUST be able to see an order's items, amount, delivery details and status from the link in their confirmation email, without anyone else being able to see it.
- **FR-016**: Anyone MUST be able to buy as a guest with a name and email address. No account or sign-in is needed, and a competitor account gives no extra shop features.
- **FR-017**: BJJ Éire MUST deliver only to addresses in the Republic of Ireland and Northern Ireland, for one flat delivery fee per order that the organiser sets. An address elsewhere MUST be refused before payment.

**Orders and refunds**

- **FR-018**: The organiser MUST be able to list, filter by status and export all orders. Each row shows its items, sizes, amount, payment and refund status, shopper contact and delivery details.
- **FR-019**: The organiser MUST be able to mark an order dispatched, with an optional tracking reference.
- **FR-020**: The organiser MUST be able to cancel an order with a full refund to the original payment method. The stock of a refunded order that was not dispatched MUST return.
- **FR-021**: A refund the payment provider cannot complete MUST show as "refund pending" and alert the organiser.
- **FR-022**: Each payment and refund MUST be recorded with amount, time and outcome, and kept for six years for accounting. This matches the retention of competition payments.

**Dashboard**

- **FR-023**: The organiser MUST see, for a chosen period, the number of paid orders, money taken, money refunded and net sales.
- **FR-024**: The organiser MUST see units sold and money taken per product and size for that period, best sellers first.
- **FR-025**: The organiser MUST see current stock of every product size, with low stock (5 units or fewer) and sold-out sizes marked.
- **FR-026**: Dashboard figures MUST match the orders list for the same period.

**Access and switching**

- **FR-027**: Only the organiser MUST be able to manage products, stock and orders and see the dashboard. Shoppers, competitors and visitors are refused.
- **FR-028**: Merch MUST be switchable off as a whole, separately from the directory, leaving Shop with only the directory. The directory MUST be switchable off separately too, leaving Shop with only the merch section. Shop is reachable while either is on.
- **FR-029**: Gyms, events, competitions and the store directory MUST stay browsable without an account and behave as before.

### Key Entities

- **Product**: a merch item for sale, with name, kind, description, photos, price, state (draft, published, hidden) and sizes. Contract to be added at `specs/database-contracts/product.md`.
- **Product size**: one size of a product with its stock count and the amount held in unpaid checkouts. Part of the product contract.
- **Order**: one purchase, with:
  - a line for each product, size, quantity and unit price paid;
  - the delivery charge, total, shopper contact and delivery address;
  - its state: awaiting payment, confirmed, dispatched, cancelled, refunded;
  - its payment and refund records.

  Contract to be added at `specs/database-contracts/merch-order.md`.
- **Payment / refund record**: what was charged or returned for an order, when, and whether it succeeded. Holds no card details.
- **Directory store**: the existing store record (`specs/database-contracts/store.md`), unchanged.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A shopper can go from opening Shop to a paid order in under 3 minutes.
- **SC-002**: 100% of confirmed orders correspond to exactly one successful payment. No shopper is charged twice for one order.
- **SC-003**: No size is ever sold beyond its stock. Every oversold payment is refunded in full without organiser action.
- **SC-004**: The organiser can add and publish a product with photos and stock in three sizes in under 5 minutes.
- **SC-005**: Dashboard totals for any period match a hand calculation from that period's orders in 100% of checks.
- **SC-006**: Stock shown on Shop reflects a sale, refund or organiser change within 1 minute.
- **SC-007**: The confirmation email reaches the shopper within 5 minutes of payment.
- **SC-008**: Existing directory browsing shows no change in behaviour apart from the new name and address, verified by the existing store acceptance tests passing against Shop.

## Acceptance Coverage *(mandatory)*

Visitor-observable scenarios are proven at T6 by Playwright in `bjjeire-tests`.
Its `playwright-test-planner` reads this section and turns the listed requirement issues into
scenarios. Those issues are GitLab issues in `bjjeire/requirements`. CI stays on GitHub.

- **Acceptance spec**: `bjjeire-tests/specs/features/shop.md`. It replaces `stores.md`, whose scenarios move there.
- **T6 (bjjeire-tests)**: `#4005`, `#4006`, `#4007`, `#6001`, `#6002`, `#6003`, `#6004`, `#6005`, `#6006`, `#6007`, `#6008`, `#6010`, `#6011`, `#6012`, `#6013`, `#6014`, `#6016`, `#6018`, `#6019`, `#6020`, `#6022`, `#6024`, `#6026`, `#6028`. Payment scenarios run against the payment provider's test mode.
- **Lower tiers only**:
  - `#6009`: simultaneous last-item purchases. A concurrency rule, owned by integration tests.
  - `#6015`: price change after payment. A service rule.
  - `#6017`, `#6025`: organiser-only refusals, owned by API integration tests.
  - `#6021`: refund failure and alert, with the payment provider stubbed.
  - `#6023`: per-product and per-size aggregation, owned by unit tests of the dashboard calculation.
  - `#6027`: unchanged directory, owned by the existing suites.

## Clarifications

### Session 2026-11-17

- Q: Who may buy merch? → A: Anyone, as a guest with a name and email address. No account is needed. The order is viewed from the link in its confirmation email.
- Q: Where does BJJ Éire deliver, and what does it cost? → A: The Republic of Ireland and Northern Ireland only, for one flat fee per order that the organiser sets.

## Assumptions

- "Add feature at home of page… under this should be similar to competitions" is read as follows. BJJ Éire merch sits at the top of the Shop page. The directory of other Irish stores sits below it. This mirrors how BJJ Éire competitions are featured above the competitions directory. It is not read as a change to the site's landing page.
- Only the visible name and address change from Stores to Shop. The directory's data and its public interface keep their current names, because renaming them would break published contracts for no visitor benefit. The plan decides this and records it.
- The three kinds are fixed for this release: rashguard, shorts, t-shirt. A colour or design is a separate product, not an option.
- Sizes are XS to XXL. A product need not come in every size.
- Prices include VAT and are in euro only. Discount codes, bundles, gift cards and sale prices are out of scope.
- The organiser is the same single admin who runs BJJ Éire competitions, with the existing organiser sign-in. Shoppers can never manage products.
- Payment uses the owner's existing Stripe account through hosted checkout, as competitions do. Card details never reach BJJ Éire. Requirements say "payment provider" to describe behaviour, not the vendor.
- Refunds are whole-order and full-amount only, made by the organiser. Partial refunds, returns and exchanges are handled by hand outside the app. Shoppers cannot cancel an order themselves once paid.
- The low-stock level is 5 units per size and is fixed in this release.
- Shopper personal data (name, email, address) is personal data under GDPR. It is visible only to the organiser. It is kept with the order's accounting records for six years and then removed. The owner provides a privacy notice and terms of sale, including the right to withdraw within 14 days, which is handled by hand. Their wording is not part of this spec.
- Product photos are uploaded by the organiser. The plan decides where they are stored.
- Merch sits behind its own switch that fails closed, as BJJ Éire competitions do. The existing Stores switch keeps governing the directory.
- Out of scope: other merch kinds, product reviews, wish lists, stock from directory stores, international currencies, automated shipping labels or carrier integration, and inventory purchase orders.
- Deploy remains Flux / AKS / MongoDB unless an ADR says otherwise.
