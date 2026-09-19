# Testing Strategy Specification

**Product**: BjjEire (Irish BJJ directory)
**Status**: Living
**Applies to**: `src/bjjeire-api`, `src/bjjeire-app`, `specs/`, CI in this repo, and the Playwright suite in `bjjeire-tests`
**SSOT for behaviour**: [specs/](../specs/) — not this file
**Constitution**: [.specify/memory/constitution.md](../.specify/memory/constitution.md)
**Related**: [ADR-0010](adr/0010-spec-driven-development-and-agentic-workflows.md) · [ADR-0002](adr/0002-contracts-as-oci-artifacts.md) · [ADR-0005](adr/0005-flake-analysis-is-advisory.md) · [contract-testing.md](contract-testing.md) · [ci-cd.md](ci-cd.md)

This document is the **testing** contract: which layer owns which assertion, how agents turn a spec into a failing test then green code, and which modern practices this stack adopts versus which it must not invent.

It describes **current practice** (what the tree already does) and **target practice** (what agents may add when a feature needs it). Target items are labelled **ADOPT WHEN**. Do not introduce jqwik, OpenAPI-generated MSW, or screenshot baselines as drive-by refactors.

---

## How to read this

| Signal | Meaning |
|---|---|
| **Current** | Already true of the codebase and CI. Follow it. |
| **STC overlay** | New machine-readable check catalog under `specs/stc/`. Required for new behaviour. |
| **ADOPT WHEN** | High-value enhancement. Add it with the feature that needs it, plus tests. Do not sprinkle it everywhere. |
| **Do not** | A reversal of an ADR, the constitution, or a known production failure mode. |

A failing test is never "just flaky" until the spec and the code have both been checked. The spec decides whether the code is wrong or the spec must change. Agents do not silently weaken assertions to go green.

---

## 1. Spec-Driven Architecture (`docs/specs/stc` → `specs/stc/`)

Generic Spec-To-Code / Spec-To-Check (STC) literature uses a tree named `docs/specs/stc/`. **This repository does not put executable specs there.**

Living specifications already live in [`specs/`](../specs/) ([ADR-0010](adr/0010-spec-driven-development-and-agentic-workflows.md)). `docs/` is human documentation and is `paths-ignore`d by CI. Putting the check catalog under `docs/specs/stc/` would create a second SSOT and hide it from change detection.

| Generic SDD path | This repository |
|---|---|
| `docs/specs/stc/<feature>/spec.md` | Behavioural SSOT: `specs/features/<feature>.md`. Check catalog: `specs/stc/<feature>/spec.md` |
| `docs/specs/stc/<feature>/contract.yaml` | `specs/stc/<feature>/contract.yaml` plus `specs/database-contracts/<entity>.md` plus the served OpenAPI document |
| Traceability matrix | `specs/stc/<feature>/traceability.md` |
| Constitution / templates | `.specify/memory/constitution.md`, `.specify/templates/` |

**Rule**: `specs/features/<feature>.md` remains the narrative SSOT. `specs/stc/<feature>/` is the **executable check overlay** — IDs, Gherkin, contract pointers, and the AC → test → code map. Do not copy the user story twice. If they disagree, the feature spec wins and the overlay is updated in the same PR.

### 1.1 Directory structure

```
specs/
├── README.md
├── system-architecture.md
├── database-contracts/              # Mongo document contracts (existing SSOT)
│   ├── shared.md
│   ├── gym.md
│   ├── bjj-event.md
│   ├── competition.md
│   └── store.md
├── features/                        # visitor-facing behavioural SSOT (existing)
│   ├── gyms.md
│   ├── events.md
│   ├── competitions.md
│   └── stores.md
└── stc/                             # Spec-To-Check overlay (this strategy)
    ├── README.md
    └── <feature>/
        ├── spec.md                  # machine-oriented check catalog
        ├── contract.yaml            # OpenAPI / Pact / MSW / invariants
        └── traceability.md          # AC-ID → tests → implementation
```

Copy the overlay from [`.specify/templates/stc-check.template.md`](../.specify/templates/stc-check.template.md). Worked example: [`specs/stc/gyms/`](../specs/stc/gyms/).

New numbered Spec Kit slices (`specs/00N-slug/`) still follow `.specify/templates/`. When that slice lands as a living feature, add `specs/stc/<feature>/` in the same change. Do not maintain two conflicting behavioural specs for the same capability.

### 1.2 Specification template (check catalog)

Every `specs/stc/<feature>/spec.md` uses this shape. YAML front matter is mandatory so agents can parse it.

```markdown
---
feature: gyms
ssot: specs/features/gyms.md
database: specs/database-contracts/gym.md
api_package: com.bjjeire.api.gym
spa: src/bjjeire-app/src/features/gyms
acceptance: bjjeire-tests/tests/features/gyms/
status: living
---

# STC: Gyms

## User intent

A visitor opens Gyms and can scan, search, and filter published gyms.
Writes are authenticated. The gyms flag fails closed to `/about`.

## Acceptance criteria

Each criterion has a stable ID. Tests MUST name that ID in the method
Javadoc / `it()` title or a `@Tag("AC-GYM-001")` / comment on the first line.

### AC-GYM-001 — List published gyms (P1)

Given published gyms exist,
When a client calls `GET /api/v1/gym`,
Then the response is `PagedResponse<GymDto>` ordered by name,
And only Active gyms are returned.

**Owns**: backend `*IT` (real Mongo). Not a Playwright filter matrix.

### AC-GYM-002 — County filter (P1)

Given gyms in several counties,
When `county=Dublin` is supplied,
Then only Dublin gyms are returned.
When `county` is unknown,
Then the API returns 400 ProblemDetail.

**Owns**: `GymControllerTest` (400 mapping) + `GymMongoRepositoryIT` (query).
SPA integration covers the combobox → query-string hop once.

### AC-GYM-003 — Client-side name search (P1)

Given a loaded gyms page,
When the visitor types a gym name,
Then only matching cards remain.
Search is NOT a server query.

**Owns**: SPA page integration (`gyms-page.integration.test.tsx`).
Do not add a `?name=` API parameter to make the test easier.

## Executable contract

See `contract.yaml`. Breaking the listed paths, fields, or auth is a
breaking API change (ADR-0002).

## Traceability

See `traceability.md`. Every AC-ID in this file MUST appear there.
```

### 1.3 `contract.yaml` template

```yaml
# specs/stc/<feature>/contract.yaml
feature: gyms
openapi:
  served: /v3/api-docs
  artifact: ghcr.io/<owner>/bjjeire-openapi-contract
  routes:
    - method: GET
      path: /api/v1/gym
      auth: public
      response: PagedResponse<GymDto>
    - method: GET
      path: /api/v1/gym/{id}
      auth: public
    - method: POST
      path: /api/v1/gym
      auth: bearer
    - method: PUT
      path: /api/v1/gym/{id}
      auth: bearer
    - method: DELETE
      path: /api/v1/gym/{id}
      auth: bearer
pagination:
  page: 1-based
  pageSize: max 100
filters:
  county: County enum; unknown → 400
  name_search: client-side only
invariants:
  - geojson_coordinates: [longitude, latitude]
  - trialOffer.isAvailable: boolean, never null
  - gym_status_wire: PascalCase GymStatus
  - feature_flag: Gyms fail-closed → /about
pointers:
  database: specs/database-contracts/gym.md
  pact: src/bjjeire-app/src/contracts/pact/gym.pact.test.ts
  msw: src/bjjeire-app/src/testing/msw/handlers/gyms.ts
  generated_types: src/bjjeire-app/src/types/generated/api.ts
  ui_strings: src/bjjeire-app/src/config/ui-content.ts
  test_ids: src/bjjeire-app/src/constants/gymDataTestIds.ts
```

This file does **not** replace the served OpenAPI document. It tells agents which paths and invariants the feature owns so they do not invent a parallel schema.

### 1.4 Traceability matrix template

```markdown
# Traceability: gyms

| AC-ID | Layer | Test path | Implementation path |
|---|---|---|---|
| AC-GYM-001 | IT | `src/bjjeire-api/src/test/java/com/bjjeire/api/gym/GymMongoRepositoryIT.java` | `GymService`, `GymRepository` |
| AC-GYM-002 | Unit + IT | `GymControllerTest.java`, `GymMongoRepositoryIT.java` | `GymController`, `GymService` |
| AC-GYM-002 | SPA integration | `src/bjjeire-app/src/pages/__tests__/gyms-page.integration.test.tsx` | `GymsPage`, `useGymsPage` |
| AC-GYM-003 | SPA integration | `gyms-page.integration.test.tsx` | `useListPageSearch` |
| AC-GYM-004 | SPA unit | `src/bjjeire-app/src/features/gyms/components/__tests__/gym-card.unit.test.tsx` | `gym-card.tsx` |
| AC-GYM-001 | Pact | `src/bjjeire-app/src/contracts/pact/gym.pact.test.ts` | `get-gyms.ts` |
| AC-GYM-001 | Acceptance | `bjjeire-tests/tests/features/gyms/` | running images |
```

Every new AC-ID is a new row. An AC-ID with no test path is unfinished work. An implementation path with no AC-ID is unspecced behaviour — stop and update the feature spec first.

### 1.5 Autonomous agent loop (Spec → Test → Code → Verify)

Agents (Claude Code, Cursor, Grok, Devin) execute this loop. It is the constitution's "spec → contract → tests → code" sequence made operational.

```
                    ┌──────────────────────────────┐
                    │ specs/features/<f>.md        │
                    │ specs/stc/<f>/{spec,contract,│
                    │               traceability}  │
                    └──────────────┬───────────────┘
                                   │ parse AC-IDs
                                   ▼
                    ┌──────────────────────────────┐
                    │ Generate failing tests       │
                    │ tagged with AC-IDs           │
                    │ RED: fail for the right      │
                    │ reason (assertion, not       │
                    │ compile)                     │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │ Implement in the feature     │
                    │ package / feature folder     │
                    │ GREEN: minimum code          │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │ Refactor · update            │
                    │ traceability.md · run the    │
                    │ smallest verification        │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────┴───────────────┐
                    │ If the wire shape moved:     │
                    │ OpenAPI + Pact + generated   │
                    │ types + Playwright Zod in    │
                    │ the SAME PR                  │
                    └──────────────────────────────┘
```

**Loop rules**

1. **Read first.** Constitution, the ADR table in `AGENTS.md`, `specs/features/<feature>.md`, `specs/stc/<feature>/spec.md`, and the database contract. If `specs/stc/<feature>/` does not exist, create it from the template before writing tests.
2. **Tests before code.** Write the test that encodes the AC-ID. Run it. Confirm RED is an assertion failure, not a missing import.
3. **One layer owns the behaviour.** See §2. Do not add a Playwright journey that restates a Vitest integration test, and do not mock Mongo in an `*IT`.
4. **Spec vs bug.** If the test is red after a faithful implementation, stop. Either the code is wrong or the spec is wrong. Do not "fix" the test to match accidental implementation, and do not silently edit the spec to match buggy code. Call out the conflict.
5. **Verify with the commands the layer actually uses** (see §3 and §4). Do not run `mvn clean verify` for a CSS class change.
6. **Traceability is part of done.** The PR that adds AC-GYM-00N also adds the row.

Worked gyms overlay: [`specs/stc/gyms/`](../specs/stc/gyms/).

---

## 2. Test Layering & Boundary Matrix

Value-first: each assertion lives in **one** tier. Overlap is allowed only as a thin smoke at the next tier up (one happy path, not the full matrix).

| Tier | Scope | Frameworks | What TO test | What NOT to test | Execution trigger |
|---|---|---|---|---|---|
| **T0 Spec / contract** | Feature AC-IDs, OpenAPI, Pact, generated TS types | Spec Markdown, springdoc `/v3/api-docs`, `oasdiff`, `openapi-typescript`, `@pact-foundation/pact` | Wire shape, auth on writes, pagination envelope, ProblemDetail, DTO field names | UI layout, Mongo indexes, React state | **PR** `generate_openapi_contract` → `check_openapi_breaking` + `check_frontend_api_compat`; **PR** `frontend_build_test` (`npm run test:pact`); **main** `publish_contracts_ghcr` |
| **T1 Backend unit** | Domain, services, validators, mappers, standalone controllers | JUnit 5, Mockito, MockMvc standalone, AssertJ | Business rules, mapping, 400/404 HTTP mapping with a mocked service, GeoJSON derived lat/lng | Spring context, Mongo, network, "does `@Service` exist" | **Commit** `mvn -pl src/bjjeire-api test` (Surefire, `*Test`); **PR** `java_build_test` when `java_api` filter matches |
| **T2 Backend integration** | Repositories, aggregations, indexes, full HTTP + Mongo, OpenAPI export | Spring Boot `@SpringBootTest`, Testcontainers Mongo `mongo:8.2`, Failsafe `*IT`, `RestTemplate` against `RANDOM_PORT` | Real queries, county filter, pagination links, audit fields on write, JWT writer vs reader, served OpenAPI | Mockito against `MongoTemplate` / repositories; embedded/in-memory Mongo; repeating every service unit case | **PR / main** `java_build_test` (`mvn verify`); Testcontainers required. No Flapdoodle. |
| **T3 Frontend unit** | Utils, hooks, presentational components | Vitest `*.unit.test.{ts,tsx}`, jsdom, Testing Library | `price-calculator`, `map-utils`, `GymCard` rendering from a DTO, debounce, focus trap | Network, MSW, router + React Query + page together, CSS screenshots | **Commit** `npm run test`; **PR** `frontend_build_test` |
| **T4 Frontend integration** | Pages, feature hooks, API clients | Vitest `*.integration.test.{ts,tsx}`, MSW, `renderWithProviders` | Page loading / error / empty / list; county combobox writes `?county=`; pagination next page; `getGyms` query-string | `vi.mock` of child components; `vi.mock('@/lib/api-client')` (that is a unit seam); visual pixels | **Commit** `npm run test:integration`; **PR** `frontend_build_test` |
| **T5 In-repo browser** | Behaviours jsdom cannot model | Vitest `*.browser.test.{ts,tsx}`, `@vitest/browser-playwright`, Chromium | `:focus-visible`, native Tab order, real layout focus | Full user journeys, a11y audits of pages, API contract | **PR** `test_frontend_browser` when `frontend` filter matches. Keep this set tiny. |
| **T6 Acceptance / E2E** | Critical visitor journeys against running images | Playwright in **`bjjeire-tests`**, axe-core, Zod against live JSON, Compose `@smoke` / AKS acceptance | Auth-adjacent happy paths, gyms/events/competitions/stores browse+filter on **seeded** data, a11y of those journeys, visual snapshots of critical views | Re-testing calculator arithmetic; asserting "item 1 of an unfiltered list"; mocking Mongo | **PR** `compose_smoke` if `compose` filter or `run-smoke` label; **main** AKS acceptance when enabled; staging schedule |
| **T7 Flake evidence** | Historical (test, project) stability | `atest` / `aplaytest` (`atest_analyze`) | 90-day flake verdict for humans | Merge gating | **PR + main** after a test job; **never** in `pr_complete` / `main_complete` ([ADR-0005](adr/0005-flake-analysis-is-advisory.md)) |

### 2.1 Decision table — which tier owns this assertion?

| If the behaviour is… | Own it at | Do not also |
|---|---|---|
| A pure function / invariant over in-memory data | T1 or T3 | Repeat the matrix in T2 / T4 / T6 |
| HTTP status + ProblemDetail for a bad query param | T1 MockMvc **or** T2 once | Both with identical JSONPath |
| Mongo filter, index, GeoJSON persist/read | T2 | Mock Mongo; in-memory Mongo |
| Page talks to API and shows cards | T4 MSW | Mock `GymCard` from the page test |
| Card renders name / maps href from a DTO | T3 | Drive the same DTO through Playwright |
| Visitor can isolate a **seeded** gym in a real browser | T6, one journey | Every county × every sort in Playwright |
| OpenAPI path or DTO field renamed | T0 | A comment in a controller |

### 2.2 Speed budgets (targets, not CI timeouts)

| Tier | Per-test target | Suite target locally |
|---|---|---|
| T1 Java unit | < 5 ms | seconds |
| T2 Java IT | seconds (container reused per JVM) | 1–3 min warm |
| T3 Vitest unit | < 50 ms | seconds |
| T4 Vitest integration | < 500 ms | tens of seconds |
| T5 Vitest browser | < 2 s | small N |
| T6 Playwright | seconds, retry-hostile | 10–20 journeys, not 200 |

`MongoIntegrationTest` shares one Mongo container and one Spring context across `*IT` classes. Do not add `@DirtiesContext` without a measured reason — it destroys that budget.

---

## 3. Backend Strategy (Java + MVC + MongoDB + Testcontainers)

Layout: tests live in the **same feature package** as production code.

```
src/bjjeire-api/src/test/java/com/bjjeire/api/
├── gym/
│   ├── GymControllerTest.java          # T1 standalone MockMvc
│   ├── GymServiceTest.java             # T1 Mockito, no Spring
│   ├── GymMapperTest.java              # T1
│   └── GymMongoRepositoryIT.java       # T2 Testcontainers
├── event/   …BjjEvent*Test + *IT, BjjEventCostCalculatorTest
├── competition/ …
├── store/ …
├── common/  GeoCoordinatesTest, PaginationRequestTest, …
├── web/     OpenApiContractIT.java
└── testsupport/
    └── MongoIntegrationTest.java       # shared container + cleanup
```

Maven split ([`pom.xml`](../src/bjjeire-api/pom.xml)):

- Surefire runs `*Test`, excludes `*IT`
- Failsafe runs `*IT` during `verify`

```bash
# T1 only
mvn -pl src/bjjeire-api test

# T1 + T2 (Testcontainers Mongo)
mvn -pl src/bjjeire-api verify
```

### 3.1 Unit testing (JUnit 5 + Mockito)

**Target.** Domain models, pure calculators, validators, mappers, services, standalone controllers.

**Rules.**

- **No Spring context.** `@ExtendWith(MockitoExtension.class)`, not `@SpringBootTest`.
- **No database.** Mock `MongoTemplate` / repositories at the interface. The moment a test needs a real query, it is an `*IT`.
- **Mocks only at external boundaries** (persistence, `UriService`, `AuditRecorder`, JWT). Do not mock the class under test's collaborators that are value objects.
- Method names: `should{ExpectedBehaviour}` (`shouldReturnNotFoundWhenGymMissing`).
- Controller tests use **standalone** MockMvc + `ApiExceptionHandler`. They assert HTTP mapping, not SQL.

```java
@ExtendWith(MockitoExtension.class)
class GymControllerTest {
    @Mock
    private GymService gymService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new GymController(gymService))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void shouldRejectListingWhenCountyIsUnknown() throws Exception {
        mockMvc.perform(get(ApiRoutes.GYM).param("county", "Invalid"))
                .andExpect(status().isBadRequest());
    }
}
```

Service example — business rule, mocked persistence:

```java
@ExtendWith(MockitoExtension.class)
class GymServiceTest {
    @Mock
    private MongoTemplate mongoTemplate;
    // …

    @Test
    void shouldStampAuditFieldsWhenCreatingGym() {
        givenAuditContext();
        given(mongoTemplate.save(any(Gym.class))).willAnswer(inv -> inv.getArgument(0));

        CreateGymResponse response = service.create(new CreateGymCommand(dto(GYM_ID)));

        ArgumentCaptor<Gym> gym = ArgumentCaptor.forClass(Gym.class);
        then(mongoTemplate).should().save(gym.capture());
        assertThat(gym.getValue().getCreatedBy()).isEqualTo(AUDIT_USER);
    }
}
```

**Do not** start the servlet container in T1. **Do not** assert Mongo index names here. **Do not** use `@MockBean` — that is a Spring test and belongs in T2 if at all.

**ADOPT WHEN — property-based (jqwik)** for edge-heavy pure logic. First candidates: `BjjEventCostCalculator`, `GeoCoordinates` GeoJSON order, `PaginationRequest` clamping. See §6.3. Example-based tests stay; properties add a universal quantifier, they do not replace the named AC-ID examples.

### 3.2 Integration testing (Spring Boot + Testcontainers + MongoDB)

**Target.** Repositories, derived / `Criteria` queries, aggregation pipelines, controller endpoints through the real stack, cache invalidation, write auth, the served OpenAPI document.

**Rules.**

- Extend `com.bjjeire.api.testsupport.MongoIntegrationTest`.
- **Real MongoDB** via Testcontainers `mongo:8.2` and `@ServiceConnection`. **Zero** embedded/in-memory Mongo. Mocking Mongo in ITs previously caused production incidents — it is forbidden.
- One container + one Spring context per JVM. Cleanup is mandatory (already in the base class).
- Hit HTTP with `restTemplate` against `RANDOM_PORT`, not MockMvc, when the assertion is "the running app + Mongo".
- Seed through the repository or authenticated POST; never assume leftover documents.

Base-class isolation (already implemented — do not reimplement per class):

```java
@BeforeEach
void resetPersistentState() {
    for (Class<?> entityType : List.of(
            Gym.class, BjjEvent.class, Competition.class, Store.class,
            DeactivationLock.class, AuditLogEntry.class)) {
        mongoTemplate.remove(new Query(), entityType);
    }
    // also drop ApiCache tags
}
```

IT example — real county filter + JSON mapping:

```java
class GymMongoRepositoryIT extends MongoIntegrationTest {
    @Autowired
    private GymRepository gymRepository;

    @Test
    void shouldListOnlyActiveGymsWhenFilteringByCounty() throws Exception {
        gymRepository.save(gym("Active Gym", GymStatus.Active));
        gymRepository.save(gym("Pending Gym", GymStatus.PendingApproval));

        ResponseEntity<String> response =
                restTemplate.getForEntity(ApiRoutes.GYM + "?county=Dublin&page=1&pageSize=20", String.class);

        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(body.at("/data/0/name").asText()).isEqualTo("Active Gym");
        assertThat(body.at("/pagination/totalItems").asInt()).isEqualTo(1);
    }
}
```

**OpenAPI export** is an IT (`OpenApiContractIT`) because the published spec must be what the app **serves**, not what annotations claim ([ADR-0002](adr/0002-contracts-as-oci-artifacts.md)).

**Do not** introduce WireMock for Mongo. WireMock is for **outbound HTTP** the API does not yet need in tests. If a future Google Places proxy appears, Testcontainers + WireMock (or a stub server) belongs at T2 for that client only.

**Do not** `@MockBean GymRepository` in an `*IT`. That test is then a slow unit test.

---

## 4. Frontend Strategy (TypeScript + Vitest + MSW + Playwright)

Layout and naming are enforced by Vitest `include` globs. A bare `*.test.tsx` **does not run**.

```
src/bjjeire-app/
├── vitest.unit.config.ts              # *.unit.test.{ts,tsx}     npm run test
├── vitest.integration.config.ts       # *.integration.test.{ts,tsx}
├── vitest.browser.config.ts           # *.browser.test.{ts,tsx}
├── vitest.pact.config.ts              # contracts/pact
└── src/
    ├── testing/                       # renderWithProviders, MSW, factories
    ├── contracts/pact/                # T0 consumer contracts
    ├── utils/__tests__/*.unit.test.ts
    ├── features/gyms/
    │   ├── api/__tests__/get-gyms.integration.test.ts
    │   ├── components/__tests__/*.unit.test.tsx
    │   └── testing/gyms-test-helpers.tsx
    └── pages/__tests__/*-page.integration.test.tsx
```

Canonical harness notes: [`src/bjjeire-app/src/testing/README.md`](../src/bjjeire-app/src/testing/README.md).

```bash
cd src/bjjeire-app
npm run lint && npm run typecheck && npm test && npm run test:integration
```

### 4.1 Unit testing (Vitest)

**Target.** Pure utils (`price-calculator`, `map-utils`, `county-utils`), custom hooks that do not need a network, presentational components given a DTO.

**Rules.**

- jsdom (Happy-DOM is not the current environment — do not switch it in a drive-by).
- **No network.** No MSW in unit files. If the unit calls `api.get`, either extract the pure function or move the test to T4.
- Testing Library queries in this order: `getByRole` > `getByLabelText` > `getByText` > `getByTestId`. Test IDs come from `src/constants/*DataTestIds.ts` ([ADR-0008](adr/0008-ui-strings-and-test-ids-are-centralised.md)). Visible copy comes from `ui-content.ts` — tests may assert that copy; components must not inline it.
- `it('given …, when …, then …')` — business language, never "renders correctly".
- Factories for DTOs (`createGym()`), not one-off literals, when the object is a gym/event/competition/store.

```tsx
describe('GymCard', () => {
  it('given a gym with full details, when the card renders, then name, status, county, address link and website link are shown', () => {
    const card = renderCard(MOCK_GYM_FULL)
    expect(within(card).getByRole('heading', {
      name: new RegExp(MOCK_GYM_FULL.name, 'i'),
      level: 3,
    })).toHaveTextContent(MOCK_GYM_FULL.name)
  })
})
```

**Do not** assert `data-testid` plumbing. **Do not** re-test a child from the parent. **Do not** snapshot entire DOM trees.

### 4.2 Integration & component testing (Vitest + MSW)

**Target.** Pages, feature API modules, `usePaginatedQuery`, form / filter flows that cross the HTTP boundary.

**Rules.**

- Intercept HTTP **at the network** with the shared MSW server (`@/testing/msw/server`). `onUnhandledRequest: 'error'`.
- Seed via feature helpers (`seedGyms`, `seedGymsByCounty`, `seedGymsError`) — do not open a second `setupServer()` in the test file.
- `renderWithProviders` (QueryClient `retry: false`, `MemoryRouter`, feature flags). Feature flags fail closed in production; tests that need `/gyms` pass `featureFlags: { Gyms: true }`.
- **Do not** `vi.mock` child components. **Do not** `vi.mock('@/lib/api-client')` in integration files — that bypasses the contract MSW is there to enforce.
- Handlers and factories should stay assignable to generated OpenAPI types (`src/types/generated/api.ts`).

```tsx
describe('GymsPage Integration (API + Query + UI)', () => {
  it('given a failing API, when the page renders, then an error alert with a retry button is shown', async () => {
    seedGymsError()
    renderGymsPage()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('given a loaded page, when the user selects a county filter, then only that county is fetched and shown', async () => {
    const { getLastUrl } = seedGymsByCounty({ Dublin: [dublinGym] }, [dublinGym, corkGym])
    const { user } = renderGymsPage()

    await user.selectOptions(screen.getByRole('combobox', { name: /select county/i }), 'Dublin')

    await waitFor(() => {
      expect(getLastUrl()?.searchParams.get('county')).toBe('Dublin')
    })
  })
})
```

**ADOPT WHEN — OpenAPI-seeded MSW.** Handlers are currently hand-written. When a feature's wire shape churns, generate or validate MSW handlers from the OpenAPI artifact so they cannot silently drift from Java controllers. See §6.1. Until then, `check_frontend_api_compat` + Pact + typed factories are the net.

### 4.3 Browser E2E & critical paths (Playwright)

Two different Playwright uses. Do not collapse them.

| Suite | Where | Job | Purpose |
|---|---|---|---|
| Vitest browser | `src/bjjeire-app/**/*.browser.test.{ts,tsx}` | `test_frontend_browser` | jsdom gaps (`:focus-visible`, Tab order). Tiny. |
| Acceptance | **`bjjeire-tests`** (`tests/features/<feature>/*.acceptance.spec.ts`) | `compose_smoke`, AKS acceptance, staging | Real stack, seeded data, a11y, visual, Zod on live JSON |

**Rules for T6 (the product's external contract).**

- Run against live preview / Compose / staging — never against MSW.
- **~10–20 critical journeys**, not a combinatorial explosion. Gyms: open directory, search a seeded gym, filter county, empty/error once. Repeat per feature only where the journey differs.
- Environments hold **full** datasets. Never assert a fixture is on page 1 of an unfiltered list (constitution).
- Selectors: `getByRole` / `getByText` / central test IDs. Never generated CSS/XPath.
- axe-core and screenshot snapshots live **here**, not in Vitest unit tests (the SPA testing README is explicit).
- Seeded data is shared with `seeder/data-test/` and `bjjeire-tests/tests/testdata/seeded/`.

**Do not** add Playwright coverage in this repo that duplicates `bjjeire-tests`. **Do not** grow Vitest browser tests into a second E2E suite.

---

## 5. Agentic Testing Workflow & Execution Rules

These rules bind AI coding agents. They are also the human TDD bar.

### Agent Rule 1 — Reading specs

Before writing production code or tests for a feature:

1. `.specify/memory/constitution.md`
2. The ADR table in `AGENTS.md` for the surface (API, copy, CI, contracts, …)
3. `specs/features/<feature>.md`
4. `specs/database-contracts/<entity>.md` when documents move
5. `specs/stc/<feature>/spec.md` + `contract.yaml` + `traceability.md` — **create from the template if missing**
6. Nearby tests in the owning package / `__tests__/` folder

Do not invent routes, GeoJSON order, or status enums. Dual-case API routes exist historically; new mappings use `ApiRoutes`.

### Agent Rule 2 — Red → Green → Refactor

1. Derive tests from AC-IDs. Put the ID in the test name or `@Tag("AC-GYM-002")`.
2. Run the **owning** suite. Confirm RED is the assertion you wrote.
3. Implement the minimum in the feature package (`com.bjjeire.api.gym`, `src/features/gyms/`).
4. GREEN. Refactor. Update `traceability.md`.
5. If OpenAPI moved: regenerate SPA types, update Pact, update Playwright Zod in `bjjeire-tests` **in the same PR** (or an explicit follow-up issue the PR links).

```bash
# SPA — fail first
cd src/bjjeire-app
npx vitest run --project integration src/pages/__tests__/gyms-page.integration.test.tsx

# API — fail first
mvn -pl src/bjjeire-api -Dtest=GymControllerTest,GymServiceTest test
mvn -pl src/bjjeire-api -Dit.test=GymMongoRepositoryIT verify
```

Never ship implementation for new behaviour without a failing test already in place.

### Agent Rule 3 — Anti-fragility (selectors)

- Prefer `getByRole`, `getByLabelText`, `getByText`.
- `getByTestId` only with constants from `src/constants/*DataTestIds.ts`.
- Playwright / Vitest browser: same rule. **Never** auto-generated CSS selectors or XPaths (`div.flex > div:nth-child(3)`).
- Icon-only controls need `aria-label`. If the test cannot find a role, the UI is inaccessible — fix the UI, do not switch to a CSS selector.
- Copy changes go through `ui-content.ts` so `bjjeire-tests` can follow the diff ([ADR-0008](adr/0008-ui-strings-and-test-ids-are-centralised.md)).

### Agent Rule 4 — Test cleanup & isolation

- **Java IT:** rely on `MongoIntegrationTest.resetPersistentState()`. Add new `@Document` types to that list when you add a collection. Do not share documents across tests.
- **Java unit:** no leftover static state; new service instance in `@BeforeEach` as today.
- **Vitest integration:** the setup file already `server.resetHandlers()` and resets factory ID counters in `afterEach`. Do not start/stop MSW in the test file.
- **Playwright:** fixtures create and dispose their own data, or use known seeded rows. No test depends on another test's writes.
- **Time:** ITs use a fixed `Clock` (`2026-05-31T00:00:00Z`). Do not call `Instant.now()` in assertions.
- **Auth:** writer JWT by default; tokens containing `"reader"` are 403 on writes. Do not hit real Entra in CI.

### Agent Rule 5 — Minimal overlap

Before adding a test, answer: **which AC-ID, which one tier?** If T4 already proves the county combobox writes `?county=Dublin`, T6 may smoke "filter a seeded county" once. It must not enumerate every county.

### Agent Rule 6 — CI honesty

- Path filters gate jobs ([ADR-0003](adr/0003-path-filtered-ci-with-aggregator-gate.md)). A docs-only PR may skip almost everything — that is intended. Spec-only Markdown can still run `spec-review`.
- Adding a job does not gate merges until it is in `pr_complete.needs` / `main_complete.needs`.
- **Never** add `atest_analyze` to an aggregator ([ADR-0005](adr/0005-flake-analysis-is-advisory.md)).
- `fail-on-flaky: true` stays. A retry is a defect signal, not a pass.

---

## 6. Gap Analysis & Modern Cutting-Edge Recommendations

What a typical Spring + React enterprise suite already has here, and the four upgrades that actually pay rent on this stack.

### 6.1 OpenAPI-driven contract validation (MSW stays honest)

**Current net**

| Gate | Catches |
|---|---|
| `OpenApiContractIT` | Served paths, Bearer on writes, export artifact |
| `check_openapi_breaking` (`oasdiff`) | Breaking vs last published OCI contract |
| `check_frontend_api_compat` | Regenerated `api.ts` no longer typechecks the SPA |
| Pact consumer tests | SPA HTTP expectations vs a mock server |
| `bjjeire-tests` Docker contracts | Live container JSON vs downloaded OpenAPI |

**Gap.** MSW handlers in `src/bjjeire-app/src/testing/msw/handlers/` are hand-written. They can return a 200 with a shape TypeScript still accepts (factories are typed) but that no longer matches a new required field the API started emitting — until Pact or live contract tests fire.

**ADOPT WHEN** a feature's DTO churns more than once in a PR series:

1. Treat the GHCR OpenAPI artifact as the schema for MSW. Options, in order of cost: (a) assert each handler's JSON with a generated Zod/OpenAPI validator in a small `handlers.contract.test.ts`; (b) generate handler stubs from OpenAPI and fill bodies via factories typed from `api.ts`.
2. Keep Pact as the **consumer intent** document (what the SPA needs), not as a second OpenAPI.
3. Do not stand up a Pact Broker until a second consumer exists ([contract-testing.md](contract-testing.md)). GHCR OCI artifacts remain the store ([ADR-0002](adr/0002-contracts-as-oci-artifacts.md)).

Java side stays Testcontainers + served spec. Do not add WireMock in front of Mongo.

### 6.2 Flakiness control — evidence, not folklore

**Current net**

- `fail-on-flaky: true` on test jobs — a retry is red.
- `atest_analyze` scores `(test, project)` over 90 days. **Advisory only.** PR reads the baseline; main writes it.
- Vitest browser: `retry: 1` in CI, Playwright trace `on-first-retry`, screenshots on failure under `__screenshots__/`.
- Playwright acceptance healing evidence lives in `bjjeire-tests` + atest, not in this repo's unit XML.

**Practice**

| Symptom | Response |
|---|---|
| Fails locally every time | Bug or spec. Fix code or spec. |
| Fails in CI, passes locally, trace shows a race | Fix the wait (`findByRole`, Playwright auto-wait). Do not raise timeout first. |
| Passes on retry, atest says new | Treat as a defect; do not merge hoping main is quieter. |
| atest says chronic over 90 days | Human decides to rewrite or quarantine. **Agents must not auto-skip.** |

**Do not** set `fail-on-flaky: false` to green a pipeline. **Do not** add `atest_analyze` to `pr_complete`. **Do not** retry T1/T3 tests — if a 5 ms unit test is flaky, the test is broken.

### 6.3 Property-based testing for complex data

**Current.** Example-based only (`BjjEventCostCalculatorTest`, `GeoCoordinatesTest`, SPA `price-calculator.unit.test.ts`). Those named examples stay — they are the AC-ID illustrations.

**Gap.** Pricing × schedule × session types, GeoJSON order, pagination clamp, and county enum parsing are **universally quantified** rules. A handful of examples will miss the case that production hits.

**ADOPT WHEN** touching those units. Libraries:

| Side | Library | First properties |
|---|---|---|
| Java | [jqwik](https://jqwik.net/) | `BjjEventCostCalculator`: Free ⇒ total = 0 for any schedule; FlatRate ⇒ total = amount; GeoJSON `coordinates[0] == longitude`; `PaginationRequest` pageSize always in 1..100 after bind |
| SPA | [fast-check](https://fast-check.dev/) inside Vitest | `calculateEventPrices` matches the Java rules for the same DTO; map URL uses **lat, lng** query order derived from GeoJSON `[lng, lat]` |

Sketch (Java) — do not add the dependency until the first property lands with the feature:

```java
@Property
void freePricingIsAlwaysZero(@ForAll("fixedSchedules") BjjEventSchedule schedule) {
    List<CalculatedCost> costs = BjjEventCostCalculator.calculate(
            schedule, List.of(pricing(PricingType.Free, "0", null, null, null)));
    assertThat(costs.get(0).total()).isEqualByComparingTo("0");
}
```

Sketch (Vitest):

```ts
import fc from 'fast-check'

it('given GeoJSON [lng, lat], when a maps href is built, then the query is lat,lng', () => {
  fc.assert(
    fc.property(fc.double({ min: -180, max: 180 }), fc.double({ min: -90, max: 90 }), (lng, lat) => {
      const href = buildMapsHref({ coordinates: [lng, lat] })
      expect(href).toContain(`${lat},${lng}`)
      expect(href.indexOf(String(lat))).toBeLessThan(href.indexOf(String(lng)))
    })
  )
})
```

Keep shrinking output in the test report. A property that cannot name the failing seed is not done.

### 6.4 Agentic self-healing CI — bounded, not autonomous merge

**Current net**

- `spec-review` and `schema-drift` are gh-aw workflows. They **comment**; they are not in `pr_complete` (same class of failure ADR-0005 forbids).
- Playwright healing belongs in `bjjeire-tests`, driven by atest evidence.
- Agents in this repo already run TDD locally.

**Target operating model** (what an agent may do when CI is red):

1. Parse the failing job: Surefire/Failsafe XML, Vitest JUnit, Playwright trace zip, `oasdiff` output.
2. Map the failure to an AC-ID via `traceability.md`. No row → the test is unspecced or the overlay is stale.
3. Classify:
   - **Code bug** — RED matches the spec. Fix implementation. Keep the test.
   - **Spec revision** — product intent changed. Update `specs/features/` + `specs/stc/` + tests in one PR. Say so in the commit.
   - **Selector drift** — UI copy/ID moved. Update `ui-content.ts` / `*DataTestIds.ts` and `bjjeire-tests` together. Do not "heal" by switching to XPath.
   - **Flake** — atest + trace. Fix waits or isolation. Do not quarantine from this repo.
4. Re-run the **smallest** suite. Do not re-run the entire `mvn verify` for a Vitest failure.

**Hard limits**

- No auto-merge.
- No auto-skip / auto-quarantine of tests.
- No adding retries to T1/T3.
- No weakening Pact matchers or OpenAPI breaking gates to go green.
- No calling live Azure, Mongo Atlas, or Entra from an agent loop.

That is "self-healing" as **closed-loop diagnosis + a PR**, not as a bot that edits the suite until CI is quiet.

---

## 7. Ownership, commands, and Definition of Done

### 7.1 Who owns what

| Artifact | Owner repo |
|---|---|
| Feature specs, STC overlay, database contracts | `bjjeire-java` (`specs/`) |
| Java unit + IT, OpenAPI export | `bjjeire-java` (`src/bjjeire-api/src/test`) |
| Vitest unit / integration / browser, Pact, MSW | `bjjeire-java` (`src/bjjeire-app`) |
| Playwright acceptance, axe, visual, live Zod | `bjjeire-tests` |
| Flake history | `atest` (`aplaytest`) |
| Deploy | `bjjeire-gitops` + `bjjeire-deploy` — not tested here |

### 7.2 Smallest verification

| You changed | Run |
|---|---|
| Java service / controller | `mvn -pl src/bjjeire-api -Dtest=…Test test` |
| Java repository / query / OpenAPI | `mvn -pl src/bjjeire-api -Dit.test=…IT verify` |
| SPA util / card | `cd src/bjjeire-app && npm run test` |
| SPA page / API client | `npm run test:integration` |
| `:focus-visible` / Tab | `npm run test:browser` |
| Wire shape | Expect `check_openapi_breaking` + `check_frontend_api_compat`; `npm run test:pact` |
| Compose / Caddy / Dockerfiles | `compose_smoke` or label `run-smoke` |

Frontend gate locally: `lint → typecheck → test` (then `test:integration` if T4 changed).

### 7.3 Definition of Done for a behaviour change

- [ ] `specs/features/<feature>.md` updated (or a numbered Spec Kit slice that will merge into it)
- [ ] `specs/stc/<feature>/` exists; new AC-IDs have tests and traceability rows
- [ ] Database contract updated if the document moved
- [ ] Failing test observed at the owning tier, then green
- [ ] No new overlap with a higher tier beyond a single smoke
- [ ] User-visible copy and test IDs still centralised
- [ ] If HTTP moved: OpenAPI + SPA types + Pact + `bjjeire-tests` Zod in the same change set
- [ ] Smallest verification command run; agents report what they ran

---

## Appendix A — Current vs target at a glance

| Practice | Current | Target (this strategy) |
|---|---|---|
| Behavioural SSOT | `specs/features/` | Unchanged |
| Machine-readable AC-IDs | Informal Gherkin in feature specs | `specs/stc/<feature>/` overlay |
| Java unit / IT split | Surefire `*Test` / Failsafe `*IT` + Testcontainers | Unchanged |
| SPA unit / integration | Vitest globs + MSW | Unchanged; OpenAPI-validate MSW when DTOs churn |
| E2E | `bjjeire-tests` Playwright | Unchanged; cap at critical journeys |
| a11y / visual | Playwright in `bjjeire-tests` | Unchanged; do not duplicate in Vitest |
| Property-based | None | jqwik / fast-check on calculators and GeoJSON **when those units change** |
| Flake | `fail-on-flaky` + advisory atest | Unchanged; agents must not quarantine |
| Agent loop | Constitution TDD | Spec overlay → RED → GREEN → traceability |

## Appendix B — Forbidden moves (regression list)

- Embedded / in-memory Mongo in ITs
- `atest_analyze` in `pr_complete` or `main_complete`
- Second behavioural SSOT under `docs/specs/stc/` (use `specs/stc/`)
- Playwright in this repo that duplicates `bjjeire-tests`
- `vi.mock` of the API client in integration tests
- Auto-generated CSS/XPath selectors
- Asserting unfiltered page-1 membership against a full environment
- `trialOffer.isAvailable: null` in seeder JSON
- GeoJSON as `[latitude, longitude]`
- Silent spec edits to match a bug, or silent test edits to match accidental code
