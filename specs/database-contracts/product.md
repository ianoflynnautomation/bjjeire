# Database contract: Product

BJJ Éire merch (ADR-0016). Built in slice 2 of [specs/003-bjjeire-merch-shop/](../003-bjjeire-merch-shop/spec.md).

**Collection**: `Product`
**GridFS bucket**: `productPhotos` (`productPhotos.files`, `productPhotos.chunks`)
**Java**: `com.bjjeire.api.product.Product` (embedded `ProductSize`), `com.bjjeire.api.product.ProductPhotoStore`
**Seeder**: test dataset only, `seeder/data-test/products/` (`_template.json` documents the shape), with the photos they name in `seeder/data-test/product-photos/`, loaded into GridFS under their SHA-256. There is no production seed: the organiser adds products through the shop admin, and a production seeder run neither writes nor prunes this collection.
**API contract**: [../stc/shop/contract.yaml](../stc/shop/contract.yaml)
**Design record**: [../003-bjjeire-merch-shop/data-model.md](../003-bjjeire-merch-shop/data-model.md)

## Document

| Field | Mongo | Type | Notes |
|---|---|---|---|
| `id` | `_id` | ObjectId string | |
| `version` | `version` | long | 0 on create, +1 on every organiser write (update, publish, hide, stock, photo upload). Each write filters on the version it was made from; a stale one is refused with 409 |
| `slug` | `slug` | string | **unique**; 3–60 lowercase letters, digits and single hyphens; `admin` and `photo` are reserved |
| `name` | `name` | string | required, ≤ 80, stored trimmed |
| `kind` | `kind` | enum | `RASHGUARD`, `SHORTS`, `T_SHIRT` |
| `description` | `description` | string | required, ≤ 2000, plain text, stored trimmed |
| `priceCents` | `priceCents` | int | 100–100000, VAT included. A change applies to new checkouts only (FR-007) |
| `currency` | `currency` | string | always `"EUR"` |
| `photos` | `photos` | string[] | SHA-256 hex of files in `productPhotos`, in display order; 0–6. Publishing needs 1–6 |
| `sizes` | `sizes` | `ProductSize[]` | one per size, in the order XS, S, M, L, XL, XXL. Publishing needs at least one |
| `status` | `status` | enum | `DRAFT`, `PUBLISHED`, `HIDDEN`. Only `PUBLISHED` is shown or sold |
| audit | `createdAt` / `createdBy` / `updatedAt` / `updatedBy` | | |

### ProductSize (embedded)

| Field | Mongo | Type | Notes |
|---|---|---|---|
| `id` | `_id` | enum string | `XS`, `S`, `M`, `L`, `XL`, `XXL`; one entry per size. Spring Data maps an embedded `id` property to `_id`; query it as `sizes._id` |
| `stock` | `stock` | int | ≥ 0; on the shelf and not yet sold; set by the organiser |
| `held` | `held` | int | ≥ 0 and ≤ `stock`; in unpaid checkouts. Only the order flow changes it (slice 3). An organiser write keeps it as it is and is refused when it changed meanwhile |

Derived, never stored: `available = max(0, stock - held)`, and `soldOut = available == 0`. A product is out of stock when every size is sold out. The public routes show `available` and `soldOut` only, never `stock` or `held`.

### State transitions

| From | To | When |
|---|---|---|
| `DRAFT` | `PUBLISHED` | The organiser publishes, with 1–6 photos and at least one size |
| `PUBLISHED` | `HIDDEN` | The organiser hides it |
| `HIDDEN` | `PUBLISHED` | The organiser shows it again, under the same rule as publishing |

Only a `DRAFT` can be deleted. A draft was never on sale, so no order names it. An edit of a published product must leave it publishable.

### Organiser writes

Every write is one `findAndModify` guarded by the `version` it was made from, the expected `status`, and, for each size, the `held` value it read. A checkout taken meanwhile therefore makes the write miss (409, reload and retry) rather than overwrite a hold. Stock below `held` is refused with 409 `stock-below-held`, and removing a size with holds is refused with 409 `size-has-holds`. Every write evicts `ApiCache.MERCH_TAG` on the replica that served it, so the next read there shows it; the other replicas' merch region expires after 30 seconds, and the SPA treats a merch read as fresh for 30 seconds, so Shop shows a change within a minute everywhere (SC-006), and is recorded in `AuditLog` with entity type `Product`.

## Photos (`productPhotos`)

| Field | Notes |
|---|---|
| `filename` | SHA-256 hex of the content. The same bytes are stored once |
| `metadata.contentType` | `image/jpeg`, `image/png` or `image/webp`, from the first bytes; never from the client |
| `metadata.uploadedBy` | the organiser, or `seeder` |

An upload is at most 5 MB (413 `payload-too-large`). Anything that is not a JPEG, PNG or WebP by its first bytes is 415 `unsupported-image`. A seventh photo is 409 `too-many-photos`. A file is deleted when an update or delete leaves no product naming it. Served at `GET /api/v1/product/photo/{sha256}` with `Cache-Control: public, max-age=31536000, immutable` and `X-Content-Type-Options: nosniff`.

## Indexes

Declared in `config/MongoIndexInitializer`:

| Name | Keys | Notes |
|---|---|---|
| `ux_product_slug` | `slug` | unique |
| `ix_product_status_kind_name` | `status`, `kind`, `name` | the public catalogue: published, by kind then name |

## Not yet used

`held` stays 0 until slice 3 adds checkout holds.
