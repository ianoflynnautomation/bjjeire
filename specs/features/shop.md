# Feature: Shop

**Status**: In progress. Part 1 (the directory, renamed from Stores) is shipped: slice 1 of [specs/003-bjjeire-merch-shop/](../003-bjjeire-merch-shop/spec.md). Part 2 (BJJ Éire merch) is designed there and not built yet.
**Design record**: [../003-bjjeire-merch-shop/](../003-bjjeire-merch-shop/spec.md)
**Database**: [store.md](../database-contracts/store.md) (directory)
**API**: `/api/v1/store` (directory, unchanged by the rename)
**SPA route**: `/shop`. The old `/stores` address, and anything under it, redirects to `/shop`.
**Feature flags**: `Stores` (the directory, fail-closed). The flag keeps its name.
**Acceptance**: `bjjeire-tests/specs/features/shop.md`, `bjjeire-tests/tests/features/stores/`
**Requirements**: `bjjeire/requirements` · epic `&4` (`#4001`–`#4007`) · merch epic (`#6001`–`#6028`, provisional)

The section visitors used to know as Stores is called **Shop**. Only the
visible name and the address changed. The directory's API, collection, flag
and test ids keep their store names, so no published contract moved.

# Part 1: Directory

## User Story 1 — Browse stores (P1)

1. Given available stores, when a visitor opens Shop, then the store list is displayed
2. Given stores are published, when a client opens the directory, then each published store is returned with its details
3. Given stores are published, when a client opens the directory, then they are ordered by name

## User Story 2 — Search (P1)

1. Given a store name / part of a name, when a visitor searches, then only that store is displayed

Search matches the store name only and is client-side. No county filter.

## User Story 3 — Empty and error (P2)

Same empty / network / server-error pattern as gyms.

## User Story 4 — Stores becomes Shop (P1)

1. `#4005`: Given a visitor on any page, when they look at the site navigation, then the entry that said "Stores" says "Shop" and opens the Shop page; no visible text calls the section "Stores"
2. `#4006`: Given published directory stores, when a visitor opens Shop, then they see the same store cards, order, search, empty state and error handling that Stores had
3. `#4007`: Given a link or bookmark to the old Stores address, when a visitor follows it, then they land on the Shop page, and the site map lists only the Shop address

The page heading and tab title say Shop. Directory copy that names the items
still says stores (the search label, the counts, the "No Stores Found" empty
state), because those are stores. The redirect goes through the `Stores`
switch: with it off, `/stores` and `/shop` land on the default page as before.

## Requirements

- **FR-001**: Public `GET /api/v1/store` returns `PagedResponse<StoreDto>`
- **FR-002**: Default order is name
- **FR-003**: Public reads, authenticated writes
- **FR-004**: The section is called Shop at `/shop`; `/stores/*` redirects there with `replace`; the site map lists `/shop` and not `/stores`

## Success criteria

- **SC-001**: A visitor can isolate a seeded store with search
- **SC-002**: Directory browsing shows no change in behaviour apart from the new name and address

# Part 2: BJJ Éire merch

Not built. Stories 2 to 7, `#6001`–`#6028`, are specified in
[specs/003-bjjeire-merch-shop/spec.md](../003-bjjeire-merch-shop/spec.md)
and move here as each slice ships.
