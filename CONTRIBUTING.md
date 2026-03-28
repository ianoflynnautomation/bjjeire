# Contributing to BJJ Éire

Thank you for taking the time to contribute. BJJ Éire is a community-built, open source directory for the Irish BJJ scene — every gym listing, bug fix, and improvement helps make it better for everyone who trains in Ireland.

There are several ways to contribute, from adding your gym to the directory through to building new features. All levels of experience are welcome.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Adding a Gym or Event to the Directory](#adding-a-gym-or-event-to-the-directory)
- [Reporting a Bug](#reporting-a-bug)
- [Suggesting a Feature](#suggesting-a-feature)
- [Development Setup](#development-setup)
- [Making a Code Contribution](#making-a-code-contribution)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Adding a New Data Source (Fetcher)](#adding-a-new-data-source-fetcher)
- [Commit Message Convention](#commit-message-convention)
- [Project Structure](#project-structure)

---

## Code of Conduct

This project follows a simple rule: be respectful. We are a small community project. Harassment, gatekeeping, or dismissive behaviour toward contributors of any skill level will not be tolerated. If you have a concern, open a private discussion or email the maintainers.

---

## Ways to Contribute

| Type | Effort | Where |
|---|---|---|
| Add or correct a gym listing | Low — edit JSON | `src/BjjEire.Seeder/data/gyms.json` |
| Add or correct an event listing | Low — edit JSON | `src/BjjEire.Seeder/data/bjj-events.json` |
| Report a bug | Low | [GitHub Issues](../../issues) |
| Suggest a feature | Low | [GitHub Discussions](../../discussions) |
| Fix a bug | Medium | Fork → branch → PR |
| Build a feature | Medium–High | Fork → branch → PR |
| Add a new external data source | High | `src/BjjEire.Fetcher/` |

---

## Adding a Gym or Event to the Directory

This is the most common contribution and requires no coding. Edit the JSON seed files directly and open a pull request.

### Adding a Gym

Edit [`src/BjjEire.Seeder/data/gyms.json`](src/BjjEire.Seeder/data/gyms.json) and add an entry following this template:

```json
{
  "id": "<24-character MongoDB ObjectId hex>",
  "name": "Your Gym Name",
  "description": "A short description of the gym.",
  "status": "Active",
  "county": "Dublin",
  "affiliation": {
    "name": "Affiliation Name",
    "website": "https://affiliation.com"
  },
  "trialOffer": {
    "isAvailable": true,
    "freeClasses": 1,
    "freeDays": null,
    "notes": "Contact us to book your free class."
  },
  "location": {
    "address": "Unit 1, Example Business Park, Dublin 12",
    "venue": "Gym Name",
    "coordinates": {
      "type": "Point",
      "coordinates": [-6.2603, 53.3498],
      "placeName": "Example Business Park, Dublin",
      "placeId": null
    }
  },
  "socialMedia": {
    "instagram": "https://www.instagram.com/yourgym",
    "facebook": "https://www.facebook.com/yourgym",
    "x": null,
    "youTube": null
  },
  "offeredClasses": ["BJJGiAllLevels", "BJJNoGiAllLevels", "KidsBJJ"],
  "website": "https://yourgym.ie",
  "timetableUrl": null,
  "imageUrl": null,
  "createdBy": "community",
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedBy": null,
  "updatedAt": null
}
```

**Rules:**

- **`id`** — Generate a valid 24-character MongoDB ObjectId hex string. You can use:
  - `node -e "console.log(new require('mongodb').ObjectId().toString())"` if you have Node
  - Any online ObjectId generator
  - Or ask in the PR and a maintainer will add one
- **`coordinates`** — Must be `[longitude, latitude]` in that order (GeoJSON standard). This is the **opposite** of how Google Maps displays coordinates. Use [geojson.io](https://geojson.io) to find the correct values.
- **`county`** — Must exactly match a value from the `County` enum: `Antrim`, `Armagh`, `Carlow`, `Cavan`, `Clare`, `Cork`, `Derry`, `Donegal`, `Down`, `Dublin`, `Fermanagh`, `Galway`, `Kerry`, `Kildare`, `Kilkenny`, `Laois`, `Leitrim`, `Limerick`, `Longford`, `Louth`, `Mayo`, `Meath`, `Monaghan`, `Offaly`, `Roscommon`, `Sligo`, `Tipperary`, `Tyrone`, `Waterford`, `Westmeath`, `Wexford`, `Wicklow`
- **`status`** — One of: `Active`, `PendingApproval`, `TemporarilyClosed`, `PermanentlyClosed`, `OpeningSoon`, `Draft`, `Rejected`. Use `Active` for a fully open gym.
- **`offeredClasses`** — One or more of: `BJJGiAllLevels`, `BJJNoGiAllLevels`, `BJJGiFundamentals`, `BJJGiAdvanced`, `BJJNoGiFundamentals`, `BJJNoGiAdvanced`, `KidsBJJ`, `WomensOnly`, `Wrestling`, `MuayThai`, `Boxing`, `StrengthTraining`, `YogaOrPilates`, `CompetitionTraining`, `ProTraining`, `Uncategorized`, `Other`
- **`createdBy`** — Use `"community"` for PR contributions
- Set fields you don't know to `null` — don't omit them

### Adding an Event

Edit [`src/BjjEire.Seeder/data/bjj-events.json`](src/BjjEire.Seeder/data/bjj-events.json). The same coordinate, county, and `id` rules apply. Event `type` must be one of: `OpenMat`, `Seminar`, `Tournament`, `Camp`, `Other`. Event `status` must be one of: `Upcoming`, `RegistrationOpen`, `RegistrationClosed`, `Ongoing`, `Completed`, `Postponed`, `Canceled`.

### Validating Your Changes Locally

If you have .NET 10 installed, verify your JSON deserialises cleanly before opening a PR:

```bash
cd /path/to/bjjeire
dotnet run --project src/BjjEire.Seeder -- --dry-run
```

A successful dry run with no errors means the JSON is valid and the entry would seed correctly.

---

## Reporting a Bug

Open a [GitHub Issue](../../issues/new/choose) and select **Bug Report**. Include:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Browser / OS (for frontend issues) or .NET version (for API issues)

For security vulnerabilities, see [`SECURITY.md`](SECURITY.md) — do not open a public issue.

---

## Suggesting a Feature

Open a [GitHub Discussion](../../discussions/new/choose) under the **Ideas** category before opening an issue or PR for a feature. This avoids building something that doesn't fit the project's direction. For small improvements, an issue is fine.

---

## Development Setup

### Prerequisites

| Tool | Version |
|---|---|
| .NET SDK | 10.x |
| Node.js | 24.x |
| Docker Desktop | Latest |
| MongoDB | Via Docker Compose |

### Running Locally

**Option 1 — Dev Container (recommended)**

Open the repo in VS Code or GitHub Codespaces. The dev container configures everything automatically.

**Option 2 — Manual**

```bash
# Clone
git clone https://github.com/ianoflynnautomation/bjjeire.git
cd bjjeire

# Start MongoDB
docker compose up mongodb -d

# Seed data
dotnet run --project src/BjjEire.Seeder -- --dry-run   # preview
dotnet run --project src/BjjEire.Seeder                # seed

# Run the API
dotnet run --project src/BjjEire.Api

# Run the frontend (separate terminal)
cd src/bjjeire-app
npm ci
npm run dev
```

Copy `.env.example` to `.env` in `src/bjjeire-app/` and fill in the required values (see the README for details on Entra ID configuration for local auth).

### Running Tests

```bash
# .NET tests
dotnet test BjjEire.sln --filter "Category=Unit"

# Frontend tests
cd src/bjjeire-app
npm run test

# Frontend type check
npm run typecheck
```

---

## Making a Code Contribution

1. **Fork** the repository and create a branch from `main`:
   ```bash
   git checkout -b fix/gym-card-address-truncation
   # or
   git checkout -b feat/event-calendar-view
   ```

2. **Make your changes.** Keep scope tight — one concern per PR.

3. **Write or update tests** for anything you add or change.

4. **Run the full test suite** and type checks before pushing.

5. **Open a pull request** against `main`. Fill in the PR template.

### Branch Naming

| Type | Pattern | Example |
|---|---|---|
| Bug fix | `fix/<short-description>` | `fix/gym-card-county-display` |
| Feature | `feat/<short-description>` | `feat/event-map-view` |
| Data / content | `data/<short-description>` | `data/add-munster-gyms` |
| Chore / tooling | `chore/<short-description>` | `chore/bump-react-19-1` |

---

## Pull Request Guidelines

- Keep PRs focused — avoid mixing unrelated changes
- Reference any related issue: `Closes #42`
- All CI checks must pass before review
- At least one maintainer approval is required to merge
- Squash commits on merge unless the history is meaningful

### For Data PRs (gyms / events)

- Verify you have the gym/event owner's permission if submitting on their behalf, or that the information is publicly available
- Do not include personal contact details (mobile numbers, personal emails) — link to official websites only
- If you are the gym owner, mention it in the PR description

---

## Adding a New Data Source (Fetcher)

When `BjjEire.Fetcher` is live, new external data sources can be added by implementing `IDataSource`:

1. Create `src/BjjEire.Fetcher/Sources/YourSource/YourSourceFetcher.cs` implementing `IDataSource`
2. Add a `Selectors.cs` alongside it for any HTML selectors (keeps them easy to update when sites change)
3. Register the source in `Program.cs` DI
4. Add integration test data under `tests/BjjEire.Fetcher.Tests/`
5. Document the source's `SourceId` slug and any required secrets in your PR description

Test your source locally with:
```bash
dotnet run --project src/BjjEire.Fetcher -- --dry-run --source your-source-id
```

---

## Commit Message Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) via `release-please`. Your commit messages determine the release version, so follow the format:

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

| Type | When to use |
|---|---|
| `feat` | A new feature (triggers minor release) |
| `fix` | A bug fix (triggers patch release) |
| `data` | Gym or event data changes only |
| `chore` | Tooling, deps, config (no release) |
| `docs` | Documentation only |
| `refactor` | Code change with no behaviour change |
| `test` | Adding or updating tests |

**Breaking changes:** Add `BREAKING CHANGE:` in the commit footer to trigger a major release.

Examples:
```
feat(events): add calendar view for monthly event browsing
fix(gym-card): truncate long addresses on mobile
data: add 12 Connacht gyms
chore: bump MongoDB.Driver to 3.7.0
```

---

## Project Structure

```
bjjeire/
├── src/
│   ├── BjjEire.Api/            # .NET 10 Web API
│   ├── BjjEire.Application/    # MediatR handlers, AutoMapper profiles
│   ├── BjjEire.Domain/         # Entities, enums, value objects
│   ├── BjjEire.Infrastructure/ # MongoDB repositories, external services
│   ├── BjjEire.Seeder/         # Database seeder (CLI)
│   │   └── data/               # ← Gym and event JSON — community editable
│   ├── BjjEire.Fetcher/        # Automated external data fetcher (planned)
│   └── bjjeire-app/            # React 19 + Vite + TypeScript frontend
├── tests/                      # Unit, integration, and E2E tests
├── docs/                       # Documentation and architecture diagrams
├── .github/
│   ├── workflows/              # CI, release, weekly fetch
│   └── actions/                # Composite actions
└── docker-compose.yml          # Local development stack
```

---

## Questions?

If you're unsure about anything, open a [Discussion](../../discussions) rather than guessing. No question is too small — if it's unclear to you it's probably unclear to others too.

**Oss. 🥋**
