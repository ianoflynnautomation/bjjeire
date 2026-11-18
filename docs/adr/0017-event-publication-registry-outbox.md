# ADR-0017: Run after-commit work from an event publication registry in MongoDB

- **Status:** Accepted
- **Date:** 2026-11-17
- **Applies to:** `spring-modulith-events-*` in `src/bjjeire-api/pom.xml`; `@ApplicationModuleListener`s (today `registration.RegistrationProfileListener`); `config.EventPublicationSweep`; `config.MongoConfig` (UUID representation); the `event_publication` collection; MongoDB as a single-node replica set (`tools/mongodb/`, `docker-compose*.yml`, `MongoIntegrationTest`, and the `bjj-mongodb` chart in `bjjeire-deploy`)

## Context

Features talk to each other through Spring application events, so the publisher
does not depend on the listener (`competitor` publishes `CompetitorProfileSaved`,
`registration` copies the new name and academy to the competitor's sign-ups).

Those listeners were plain `@EventListener`s: synchronous, in memory, and best
effort. When the copy failed, `RegistrationProfileListener` logged the error and
the sign-ups kept the old name until the competitor saved their profile again.
A crash between the save and the copy lost it silently too.

The merch shop (specs/003) adds more work of this kind: confirmation, dispatch
and refund mails, and stock changes after an order changes state. A message
broker was considered and rejected (below). The application is one deployable
with one organiser and hundreds of orders a year.

## Decision

Work that must happen after a write, in another feature, runs from Spring
Modulith's event publication registry (an outbox), stored in MongoDB:

- **Listeners** are `@ApplicationModuleListener`s: asynchronous, after the
  publishing transaction commits, each in a transaction of its own. A listener
  that throws leaves its publication incomplete.
- **Publishing** happens inside a transaction, so the registry stores the
  publication before any listener runs. `CompetitorServiceImpl.saveOwn`
  publishes in a short `TransactionOperations` block after the save.
- **Retry**: `config.EventPublicationSweep` resubmits incomplete publications
  older than `bjjeire.events.resubmit-older-than` (default 5 minutes) every
  `bjjeire.events.resubmit-interval` (default 5 minutes).
- **Completed publications are deleted** (`spring.modulith.events.completion-mode: delete`).
- **Events carry ids, not personal data.** A stored event is readable in the
  database until it completes. `CompetitorProfileSaved` holds the competitor id
  only, and the listener reads the profile as it is when it runs.
- **Listeners are idempotent.** A resubmission, several pods resubmitting at
  once, or an event arriving after a later save must all be harmless.
- **MongoDB runs as a single-node replica set (`rs0`) everywhere**, because
  Mongo refuses transactions on a standalone server. Compose starts it through
  `tools/mongodb/`; integration tests use `MongoDBContainer.withReplicaSet()`.
- The Mongo client encodes UUIDs as `STANDARD`, because registry documents are
  keyed by UUID. No other stored document holds one.

`registration.RegistrationAnonymiser` stays a synchronous `@EventListener` on
purpose: a failure there must stop the account deletion before anything else
changes.

## Consequences

- A failed or interrupted profile copy is retried until it succeeds, instead of
  being logged and lost.
- **Deploying this API against a standalone MongoDB breaks every profile save**
  with `Transaction numbers are only allowed on a replica set member or mongos`
  (a 500 on `PUT /api/v1/competitor/me`). The cluster's `bjj-mongodb` chart must
  run a replica set before this API version is promoted.
- **The profile save itself is not in the transaction.** Its duplicate-key retry
  for racing first saves cannot run inside a MongoDB transaction, which a failed
  write aborts. If the process dies between the save and the publication, that
  one change is lost, as before. Everything after the publication is durable.
- Sign-ups now follow a profile change a moment after the save, not within the
  same request. Tests wait for the registry to empty (`ProfilePropagationIT`).
- `event_publication` is a new collection, owned by Spring Modulith. Its shape is
  the library's, not ours: do not query it from feature code.
- `IncompleteEventPublications` counts the publications older than *now minus
  the grace period* from the application `Clock`. Under a fixed test clock, ask
  for a negative age to include the ones published "now".

## Alternatives considered

- **A message broker** (Azure Service Bus, RabbitMQ, Kafka). Rejected for now: a
  cluster dependency, a new mesh egress rule, secrets and operations for one
  deployable. Spring Modulith can externalise the same events to a broker later
  without changing the listeners. Revisit if a second deployable needs them.
- **A hand-rolled self-healing sweep** that compares profiles with sign-up
  copies. No new dependency or infrastructure, but it solves one case. Every new
  after-commit job (the merch mails) would need its own.
- **Spring Modulith module structure and verification** (`spring-modulith-core`,
  the starter). Not adopted: only the event modules are used. Splitting feature
  packages into sub-packages is parked (ADR-0001 still holds).
