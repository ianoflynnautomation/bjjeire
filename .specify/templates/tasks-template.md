---
description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/` or `specs/features/<feature>.md`

**Prerequisites**: spec.md (required), plan.md (required)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story id (US1, US2, …)
- Include exact file paths

## Path Conventions

- API: `src/bjjeire-api/src/main/java/com/bjjeire/api/<feature>/`
- SPA: `src/bjjeire-app/src/features/<feature>/`
- Seeder: `seeder/data/<entity>/`
- Acceptance: `bjjeire-tests` (separate PR unless the change is test-only)

## Phase 1: Specs & contracts

- [ ] T001 Update `specs/features/<feature>.md`
- [ ] T002 [P] Update `specs/database-contracts/<entity>.md` if the document shape moves
- [ ] T003 [P] Update `seeder/data/<entity>/_template.json`

## Phase 2: Tests first

- [ ] T004 [P] [US1] JUnit failing test in `src/bjjeire-api/src/test/java/com/bjjeire/api/<feature>/`
- [ ] T005 [P] [US1] Vitest failing test in `src/bjjeire-app/src/**/__tests__/`
- [ ] T006 [US1] Playwright scenario listed for `bjjeire-tests` (implement there)

## Phase 3: Implementation

- [ ] T007 [US1] Domain / DTO / mapper / service / controller in the feature package
- [ ] T008 [US1] SPA feature hook, page, strings, test IDs
- [ ] T009 Cache invalidation + indexes if queried fields changed

## Phase 4: Verify

- [ ] T010 `mvn -pl src/bjjeire-api test` (targeted) then `verify` if the surface moved
- [ ] T011 `npm run lint && npm run typecheck && npm test` in `src/bjjeire-app`
- [ ] T012 Confirm OpenAPI/Pact gates if the wire shape moved
