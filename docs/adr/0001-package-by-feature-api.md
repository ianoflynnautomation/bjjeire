# ADR-0001: Organise the Java API package-by-feature, not by layer

- **Status:** Accepted
- **Date:** 2026-09-09 (recorded; decision predates this record)
- **Applies to:** `src/bjjeire-api/src/main/java/com/bjjeire/api/`

## Context

The API serves four closely-shaped resources — events, gyms, competitions,
stores. Each has a controller, a service, a repository, a domain model, DTOs, a
mapper, validation, and a handful of enums.

The conventional Spring layout groups those by *kind*: `controller/`,
`service/`, `repository/`, `dto/`, `model/`. With four features that produces
five packages where every one contains four unrelated files, and adding a
feature means touching five directories.

## Decision

One flat package per feature, holding everything that feature owns:

```
com/bjjeire/api/
  event/         competition/     gym/         store/
  common/        audit/           deactivation/
  web/           config/          seeder/
```

`event/` contains `BjjEventController`, `BjjEventService`,
`BjjEventRepository`, `BjjEvent`, `BjjEventDto`, `BjjEventMapper`,
`BjjEventDtoValidator`, `BjjEventCostCalculator`, `BjjEventDeactivator`, the
command and response records, and the enums only that feature uses
(`EventStatus`, `PricingType`, `PricingModel`, `WeekDay`, `ScheduleKind`) —
about 25 types.

Genuinely shared code goes in `common` (`County`, `Location`,
`GeoCoordinates`, `PagedResponse`, `PaginationRequest`, `ApiRoutes`),
`web` (exception handling, feature flags, operational endpoints), `config`
(security, Mongo, filters), `audit`, and `deactivation`.

**Controllers stay thin** and delegate use cases to services.

**New backend code goes in its feature package**, not in a shared or layered
package.

## Consequences

- Everything one feature needs is in one directory. Adding a feature is one new
  package, not five edits.
- The blast radius of a feature change is visible from the file tree.
- **The pressure is on `common`.** The failure mode is not misplaced feature
  code — it is `common` slowly accumulating types that only two features share,
  until it is the layered design again under a different name. Something
  belongs in `common` when three or more features use it, or when it models a
  domain concept in its own right (`County`, `Location`).
- Feature packages look large — 25 files in `event/` is normal here and is not
  a sign the package needs splitting by kind.
- Cross-feature imports are a design smell worth noticing. If `gym/` needs a
  type from `event/`, it probably belongs in `common`.
- Advice and scaffolding for Spring almost always assumes the layered layout.
  Generated code will need moving.

## Alternatives considered

- **Layered packages** (`controller/`, `service/`, `repository/`, `dto/`).
  Familiar to any Spring developer and matches most tutorials. Rejected: with
  four similar features it scatters every change across five directories and
  makes the feature boundary invisible.
- **A module per feature** (separate Maven modules). Enforces the boundary at
  compile time rather than by convention. Rejected as disproportionate for four
  features in a single deployable.
- **Hexagonal / ports-and-adapters.** More ceremony than a CRUD-shaped
  directory API justifies.
