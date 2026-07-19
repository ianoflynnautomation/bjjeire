# BjjEire — Claude Instructions

Keep this file short and broad. Put only always-on project instructions here, and use narrower guidance files for specialized workflows.

## Project Overview

Full-stack BJJ directory for Ireland:

- Java 21 Spring Boot API
- React 19 + TypeScript SPA
- MongoDB-backed data

## Repo Layout

```text
pom.xml
src/
  bjjeire-api/
  bjjeire-app/
tests/
docker-compose.yml
```

## High-Signal Shared Rules

- The Java API is package-by-feature: one flat package per feature (`event`, `gym`, `competition`, `store`) holding its controller, service, DTOs, domain model, and repository, plus shared `common`, `audit`, `deactivation`, `web`, `config`, and `seeder` packages. New backend code goes in its feature package.
- Controllers stay thin and delegate use cases to services.
- Frontend list endpoints use `usePaginatedQuery`.
- All user-visible strings live in `src/bjjeire-app/src/config/ui-content.ts`.
- Dark theme only.
- TDD first for both frontend and backend.
- GeoJSON coordinates are `[longitude, latitude]`.

## Standard Commands

```bash
# Java
mvn clean verify
mvn -pl src/bjjeire-api test
mvn -pl src/bjjeire-api spring-boot:run

# React
cd src/bjjeire-app
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
```

Frontend verification order: `lint -> typecheck -> test`

## Coordination With Codex

`AGENTS.md` is the Codex-facing version of the shared repo rules. Keep shared conventions aligned between the two top-level files, and keep tool-specific detail in the tool-specific locations.
