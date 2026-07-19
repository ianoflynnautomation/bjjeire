# Contributing to BjjEire

This is a community directory of BJJ gyms, events, competitions, and stores in Ireland.

## Ways to Contribute

### Open an Issue

Use the issue templates to suggest a gym or event. A maintainer reviews approved submissions and opens the resulting data PR.

### Open a Pull Request

Fork the repository, create a branch, commit with Conventional Commits, and open a PR against `main`.

## Adding Data

Use the existing data templates and keep these rules:

- `id` is a stable 24-character hex string.
- GeoJSON coordinates are `[longitude, latitude]`.
- `trialOffer.isAvailable` must be `true` or `false`, never `null`.
- Dates use ISO 8601 UTC.

Generate an id with:

```bash
node -e "console.log(require('crypto').randomBytes(12).toString('hex'))"
```

## Validating Locally

Run frontend checks from the SPA directory:

```bash
cd src/bjjeire-app
npm run lint
npm run typecheck
npm test
```

Run backend checks from the repository root:

```bash
mvn clean verify
```

## Code Contributions

See [CLAUDE.md](CLAUDE.md) and [AGENTS.md](AGENTS.md) for the shared architecture and testing conventions.

## Maintainers

When a community issue is valid, apply the appropriate approval label and review the generated PR before merge.

## Code of Conduct

Be respectful. This project exists to help people find BJJ in Ireland.
