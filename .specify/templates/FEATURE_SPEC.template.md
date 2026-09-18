# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`
**Created**: [DATE]
**Status**: Draft
**Repos**: `bjjeire-java` (API + SPA) · `bjjeire-tests` (acceptance)
**Input**: User description: "$ARGUMENTS"

## User Scenarios & Testing *(mandatory)*

User stories are prioritized journeys. Each story is independently testable.

### User Story 1 - [Brief Title] (Priority: P1)

[Plain-language journey]

**Why this priority**: [value]

**Independent Test**: [how to prove this story alone]

**Acceptance Scenarios**:

1. **Given** [state], **When** [action], **Then** [outcome]
2. **Given** [state], **When** [action], **Then** [outcome]

---

### Edge Cases

- What happens when [boundary]?
- How does the system handle [error]?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST [capability]
- **FR-002**: System MUST [capability]

### Key Entities

- **[Entity]**: [meaning, key attributes, link to `specs/database-contracts/`]

### API Contract

- Route(s): `/api/v1/...`
- Read vs write auth
- Pagination / filters
- Breaking-change impact (OpenAPI + Pact + Playwright Zod)

### UI Contract

- Route: `/...`
- Feature flag (fail-closed)
- Strings file keys / test IDs
- Dark theme only

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: [observable, technology-agnostic]

## Assumptions

- Seeded data in `seeder/data-test/` (and `bjjeire-tests/tests/testdata/seeded/`) covers the P1 journey.
- Deploy remains Flux from `bjjeire-gitops`; this spec does not introduce a new cloud stack.

## Test mapping

| Story | App tests (this repo) | Acceptance (`bjjeire-tests`) |
|---|---|---|
| US1 | `src/bjjeire-api/src/test/...` · `src/bjjeire-app/src/**/__tests__/` | `tests/features/<feature>/*.acceptance.spec.ts` |
