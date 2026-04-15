# Contributing to BjjEire

Thanks for your interest in contributing! This is a community directory of BJJ gyms, events, competitions, and stores in Ireland. Anyone can suggest an addition.

## Ways to contribute

### 1. Open an issue (easiest, no Git required)
If you just want to **add or update a gym/event**, the fastest path is to [open an issue using one of the templates](https://github.com/ianoflynnautomation/BjjEire/issues/new/choose). When a maintainer applies the `approved:gym` (or `approved:event`) label to your issue, a workflow automatically opens a draft pull request with a pre-filled JSON file. The maintainer then reviews the PR before merging.

### 2. Open a pull request yourself
If you're comfortable with Git, open a PR against `main` following the guide below.

---

## Adding data via pull request

All data lives in [`src/BjjEire.Seeder/data/`](src/BjjEire.Seeder/data). There's a folder per entity type:

| Entity      | Folder                                       | Schema                                              |
| ----------- | -------------------------------------------- | --------------------------------------------------- |
| Gym         | `src/BjjEire.Seeder/data/gyms/`              | `src/BjjEire.Seeder/data/schemas/gym.schema.json`         |
| Event       | `src/BjjEire.Seeder/data/bjj-events/`        | `src/BjjEire.Seeder/data/schemas/bjj-event.schema.json`   |
| Competition | `src/BjjEire.Seeder/data/competitions/`      | `src/BjjEire.Seeder/data/schemas/competition.schema.json` |
| Store       | `src/BjjEire.Seeder/data/stores/`            | `src/BjjEire.Seeder/data/schemas/store.schema.json`       |

### Steps — add a gym

1. **Copy the template**: [`src/BjjEire.Seeder/data/gyms/_template.json`](src/BjjEire.Seeder/data/gyms/_template.json) → a new file named after the gym's slug, e.g. `dublin-submission-bjj.json`.

2. **Fill in the fields**. Key gotchas:
   - `id` — a 24-character hex string. Generate one with:
     ```bash
     node -e "console.log(require('crypto').randomBytes(12).toString('hex'))"
     ```
   - `location.coordinates.coordinates` — GeoJSON order: **`[longitude, latitude]`** — longitude first. Ireland longitudes are negative (e.g. Dublin is `[-6.26, 53.35]`). The CI will reject anything outside Ireland's bounding box.
   - `trialOffer.isAvailable` — must be `true` or `false`, never `null`.
   - Dates — ISO 8601 UTC, e.g. `"2026-04-14T00:00:00Z"`.

3. **Open a PR**. The `Validate Data` CI workflow runs automatically:
   - Every data file is validated against the relevant JSON Schema.
   - Coordinates are checked against Ireland's bounding box.
   - Schemas must be in sync with the C# Domain entities.

4. **A maintainer will review** and either merge, request changes, or close with an explanation. All data PRs require maintainer approval — we don't auto-merge.

### Steps — add an event, competition, or store

Same flow as above, using the appropriate folder and template.

---

## Regenerating JSON schemas

Schemas are **auto-generated** from the C# domain entities in [`src/BjjEire.Domain/Entities/`](src/BjjEire.Domain/Entities/). You only need to regenerate them if you've changed a Domain entity:

```bash
dotnet run --project src/BjjEire.Seeder -- --generate-schemas data/schemas
```

Then commit the updated files in `src/BjjEire.Seeder/data/schemas/`. The CI will fail if schemas drift from the Domain entities.

---

## Validating locally

If you have Node.js installed, you can run the same validation the CI runs:

```bash
npm i -g ajv-cli ajv-formats
ajv validate -c ajv-formats \
  -s src/BjjEire.Seeder/data/schemas/gym.schema.json \
  -d src/BjjEire.Seeder/data/gyms/my-new-gym.json \
  --strict=false
```

---

## Code contributions

Bug fixes and features are welcome. See [CLAUDE.md](CLAUDE.md) for the architectural conventions used throughout the codebase — Clean Architecture, MediatR, feature folders for .NET; `memo(function ...)`, `usePaginatedQuery`, dark theme only for React.

Before pushing:

```bash
# .NET
dotnet build
dotnet test

# Frontend (from src/bjjeire-app/)
npm run lint
npm run typecheck
npm run test
```

---

## For maintainers — turning an issue into a PR

When a community member submits an "Add a gym" or "Add a BJJ event" issue:

1. Skim the issue. If it's spam or clearly bogus, close it.
2. If the data looks plausible, apply the label `approved:gym` (or `approved:event`).
3. The [`Issue to PR`](.github/workflows/issue-to-pr.yml) workflow runs and opens a draft PR with a pre-filled JSON file in the appropriate `data/` folder.
4. CI validates the file against the schema and Ireland coordinate bbox.
5. Review the PR, fix anything CI flags, mark it ready, and merge.

The author is credited in the JSON file's `createdBy` field as `community:@<github-handle>`.

## Code of conduct

Be respectful. We're here to help people find BJJ in Ireland — let's keep it friendly.
