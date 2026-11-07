# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`

**Created**: [DATE]

**Status**: Draft

**Input**: User description: "$ARGUMENTS"

## User Scenarios & Testing *(mandatory)*

User stories are prioritized journeys. Each story is independently testable.

### User Story 1 - [Brief Title] (Priority: P1)

[Plain-language journey]

**Why this priority**: [value]

**Independent Test**: [how to prove this story alone]

**Acceptance Scenarios** (one AC-ID each, `AC-<FEAT>-NNN`, matching `specs/stc/<feature>/spec.md`):

1. **AC-[FEAT]-001**: **Given** [state], **When** [action], **Then** [outcome]
2. **AC-[FEAT]-002**: **Given** [state], **When** [action], **Then** [outcome]

---

### Edge Cases

- What happens when [boundary]?
- How does the system handle [error]?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST [capability]
- **FR-002**: System MUST [capability]

### Key Entities

- **[Entity]**: [meaning; link `specs/database-contracts/<entity>.md`]

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: [technology-agnostic, observable]

## Acceptance Coverage *(mandatory)*

Visitor-observable scenarios are proven at T6 by Playwright in `bjjeire-tests`.
Its `playwright-test-planner` reads this section and turns the listed AC-IDs into
scenarios.

- **Acceptance spec**: `bjjeire-tests/specs/features/[feature].md`
- **T6 (bjjeire-tests)**: [AC-IDs a visitor or API client can observe end to end]
- **Lower tiers only**: [AC-IDs owned by T1–T5, with the reason, e.g. "T2: ordering is a repository rule"]

## Assumptions

- [Users, scope, data, existing auth]
- Deploy remains Flux / AKS / MongoDB unless an ADR says otherwise.
