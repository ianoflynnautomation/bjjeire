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

- **[Entity]**: [meaning; link `specs/database-contracts/<entity>.md`]

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: [technology-agnostic, observable]

## Assumptions

- [Users, scope, data, existing auth]
- Deploy remains Flux / AKS / MongoDB unless an ADR says otherwise.
