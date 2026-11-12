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

**Acceptance Scenarios** (one GitLab issue each, `#1001`, matching `specs/stc/<feature>/spec.md`. The epic stays on that file's **Requirements** line. `bjjeire-tests` records the same issue on `Covers:`):

1. **`#1001`**: **Given** [state], **When** [action], **Then** [outcome]
2. **`#1002`**: **Given** [state], **When** [action], **Then** [outcome]

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
Its `playwright-test-planner` reads this section and turns the listed requirement issues into
scenarios. Those issues are GitLab issues in `bjjeire/requirements`. CI stays on GitHub.

- **Acceptance spec**: `bjjeire-tests/specs/features/[feature].md`
- **T6 (bjjeire-tests)**: [requirement issues a visitor or API client can observe end to end]
- **Lower tiers only**: [requirement issues owned by T1–T5, with the reason, e.g. "T2: ordering is a repository rule"]

## Assumptions

- [Users, scope, data, existing auth]
- Deploy remains Flux / AKS / MongoDB unless an ADR says otherwise.
