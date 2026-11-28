# Database contract: ShopSettings

The shop's settings (FR-017). Built in slice 3 of [specs/003-bjjeire-merch-shop/](../003-bjjeire-merch-shop/spec.md): read by checkout; the organiser's screen to change it comes with slice 4.

**Collection**: `ShopSettings`, one document with `_id = "shop"`
**Java**: `com.bjjeire.api.order.ShopSettings`
**Seeder**: none
**API contract**: [../stc/shop/contract.yaml](../stc/shop/contract.yaml) (`GET /api/v1/order/delivery`)

## Document

| Field | Mongo | Type | Notes |
|---|---|---|---|
| `id` | `_id` | string | always `"shop"` |
| `deliveryFeeCents` | `deliveryFeeCents` | int | 0–5000, one flat fee per order. Copied onto each order when it is made, so a change applies to new orders only. **Until the document exists, delivery is free (0)** |
| `version` | `version` | long | optimistic lock for the organiser's write (slice 4) |
| audit | `updatedAt` / `updatedBy` | | |
