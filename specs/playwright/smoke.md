# Smoke — critical visitor journeys

**Seed:** [seed.md](seed.md)  
**Suite:** `bjjeire-tests` · `npm run test:smoke` · tag `@smoke`  
**CI:** Compose `compose_smoke` (path/label) and Firefox/WebKit projects (smoke only)

`@smoke` is the **critical happy path only**. Do not mark search/filter/error
matrices as smoke. Living wording: `specs/features/`.

## 1. Gyms

**Seed:** `tests/features/gyms/gyms.ui.acceptance.spec.ts`  
**File:** `bjjeire-tests/tests/features/gyms/`

### 1.1 Open the directory (UI)

**Steps:**

1. Open `/gyms`.
2. Wait until the gym list is loaded.

**Expected:** Gym cards are visible. Header indicates gyms were found.

**Existing:** `Given available gyms, when a visitor opens Gyms, then the gym list is displayed`

### 1.2 List published gyms (API)

**File:** `bjjeire-tests/tests/features/gyms/gyms.api.acceptance.spec.ts`

**Expected:** `GET /api/v1/gym` returns `PagedResponse<GymDto>` of published gyms.

## 2. Events

**File:** `bjjeire-tests/tests/features/events/`

### 2.1 Open Events (UI)

**Expected:** Given available events, when a visitor opens Events, then the event list is displayed.

### 2.2 List upcoming events (API)

**Expected:** Listing excludes finished/inactive events.

## 3. Competitions

**File:** `bjjeire-tests/tests/features/competitions/`

### 3.1 Open Competitions (UI)

**Expected:** Given available competitions, when a visitor opens Competitions, then the competition list is displayed.

### 3.2 List published competitions (API)

## 4. Stores

**File:** `bjjeire-tests/tests/features/stores/`

### 4.1 Open Stores (UI)

**Expected:** Given available stores, when a visitor opens Stores, then the store list is displayed.

### 4.2 List published stores (API)

## 5. About and chrome

**Files:** `tests/features/about/`, `tests/layout/`

### 5.1 About page loads (UI + snapshot)

### 5.2 Header logo and footer copyright snapshots

Generator: if a smoke scenario is missing, add it next to the existing feature
file with `{ tag: ['@smoke', '@acceptance'] }`. Do not create a parallel
`smoke.spec.ts` at the tests repo root.
