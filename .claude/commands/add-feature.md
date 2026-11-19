---
description: Scaffold a new feature from its reviewed spec, following the gym feature's layout
argument-hint: <spec path, e.g. specs/features/seminars.md>
---

Scaffold the feature specified in `$ARGUMENTS`. This is the first step of building a brand-new
feature. For a change to an existing feature, use `/build-feature` instead.

1. If `$ARGUMENTS` is not a spec with requirement issues (`specs/features/<feature>.md` with
   `specs/stc/<feature>/spec.md`, or a Spec Kit `specs/###-slug/spec.md`), stop and suggest
   `/spec`. Never scaffold without a spec.
2. Read the spec, `.claude/rules/api.md`, `react.md` and `testing.md`, and the gym feature,
   which is the reference: `src/bjjeire-api/.../gym/`, its tests, `src/bjjeire-app/src/features/gyms/`
   and `pages/GymsPage.tsx`. Copy its shape; do not invent structure.
3. Create compiling, empty shells only: no behaviour and no test bodies. `/build-feature` then
   writes each requirement issue's failing test, then its code. Create only what the spec
   needs. The full set, for a public paged list:

   **API**, one flat package `com.bjjeire.api.<feature>` (ADR-0001):
   - the domain class with `ENTITY_NAME` and `@Document(ENTITY_NAME)`, and its enums;
   - `<Feature>Dto`, plus `Create…Command` and `Update…Command` only if the spec has writes;
   - `<Feature>Mapper`, `<Feature>Repository`;
   - `<Feature>Service` (interface) and `<Feature>ServiceImpl` (the bean);
   - `<Feature>Controller`, thin, on a singular lowercase route constant added to
     `common.ApiRoutes`. No PascalCase alias.
   - Also: a cache tag in `common.ApiCache`, indexes in `config/MongoIndexInitializer`, the
     route in `SecurityConfig` (public read, writer-scope write), and a flag if the spec asks
     for one, in all three places (`web.FeatureFlag`, `application.yml`, `definitions.ts`).

   **API test classes**, same package under `src/test`, still empty: `<Feature>ControllerTest`
   (standalone MockMvc), `<Feature>ServiceTest`, `<Feature>MapperTest`, and
   `<Feature>MongoRepositoryIT` extending `testsupport.MongoIntegrationTest`.

   **SPA**, `src/bjjeire-app/src/features/<feature>s/`:
   - `api/get-<feature>s.ts`, through `api` and `API_ROUTES`;
   - `hooks/use<Feature>sPage.ts` on `useListPage`;
   - `components/<feature>-card/`, `<feature>-list.tsx`, `<feature>-page-header.tsx`;
   - `testing/<feature>s-test-helpers.tsx`, written before the page tests;
   - `pages/<Feature>sPage.tsx`, a route in `config/paths.ts` and `config/features.ts`;
   - copy in `config/content/<feature>s.ts`, test ids in `constants/<feature>DataTestIds.ts`,
     handwritten types in `src/types/`, and a factory in `src/testing/factories/`.

   **Specs and data:** `specs/database-contracts/<entity>.md`; `seeder/data/<entity>/_template.json`
   and a `seeder/data-test/` seed if the spec needs seeded data; the overlay's
   `traceability.md` rows.
4. Prove the shells compile (`mvn -pl src/bjjeire-api test-compile`, `npm --prefix src/bjjeire-app run typecheck`),
   list what you created, and stop. Next: `/build-feature $ARGUMENTS`, which owns the
   failing-test-first loop and the independent review.
