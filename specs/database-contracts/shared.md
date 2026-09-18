# Shared document types

Used by gyms and events (and anywhere a venue is shown). Java package
`com.bjjeire.api.common`.

## ObjectId

- 24-character hex string
- Path params validated with `@ValidObjectId`
- Seeder: 24 hex chars, not integer sequences

## `County`

Irish county enum. Bound from query string via `StringToCountyConverter`.
Invalid values → 400 ProblemDetail.

## `Location`

| Field | Type | Notes |
|---|---|---|
| `address` | string | Postal / street |
| `venue` | string | Display name of the venue |
| `coordinates` | `GeoCoordinates` | required for gyms/events |

## `GeoCoordinates`

| Field | Type | Notes |
|---|---|---|
| `type` | string | Default `"Point"` |
| `coordinates` | `[number, number]` | **`[longitude, latitude]`** |
| `placeName` | string | |
| `placeId` | string \| null | |

`latitude()` / `longitude()` are read-only JSON properties derived from the
array. Dublin example: `[-6.2603, 53.3498]`.

## `SocialMedia`

| Field | Type |
|---|---|
| `instagram` | string \| null |
| `facebook` | string \| null |
| `x` | string \| null |
| `youTube` | string \| null |

## Pagination

Request: `page` (min 1), `pageSize` (1–100, default 20).
Response: `PagedResponse<T>` with `PaginationMetadata` (page, pageSize,
totalCount, totalPages, links).

## Audit fields (on every aggregate)

Mongo fields `createdAt` / `createdBy` / `updatedAt` / `updatedBy` map to
Java `createdOnUtc` / `createdBy` / `updatedOnUtc` / `updatedBy`.
