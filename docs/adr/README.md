# Architecture Decision Records

Format: lightweight MADR. Status ∈ `Proposed | Accepted | Superseded by ADR-xxxx | Rejected`. All ADRs below are **Proposed** until ratified in Phase 0 (roadmap exit criterion). An ADR is immutable once Accepted; changes are made by a new ADR that supersedes it.

Template:
```
# ADR-NNNN: Title
Status · Date · Deciders
## Context
## Decision
## Options considered
## Consequences (positive / negative / risks)
## Revisit triggers
```

| ADR | Title | Status |
|---|---|---|
| [0001](0001-modular-monorepo-boundaries.md) | Modular monorepo with enforced boundaries | Proposed |
| [0002](0002-execution-engine-build-vs-opentap.md) | Execution engine: build vs. OpenTAP | Proposed |
| [0003](0003-station-local-first-journal.md) | Station local-first, journal-based persistence (SQLite) | **Accepted** — baseline extension E1 |
| [0004](0004-package-signing-and-trust.md) | Package signing and trust model (Class A and B) | Proposed |
| [0005](0005-plugin-isolation-and-broker.md) | Class B plugin isolation and capability broker | Proposed |
| [0006](0006-structured-bounded-procedure-ir.md) | Structured, bounded procedure IR (graph is a view) | Proposed |
| [0007](0007-immutable-results-and-audit.md) | Immutable approved results and hash-chained audit | Proposed |
| [0008](0008-multitenancy-rls.md) | Multi-tenancy via shared schema + Row-Level Security (within one deployment) | Proposed |
| [0009](0009-sync-protocol.md) | Sync: idempotent journal replication, leases, conflicts | Proposed |
| [0010](0010-decimal-quantities.md) | Decimal quantities with dimensions; no binary floats in records | Proposed |
| [0011](0011-station-ui-delivery.md) | Station UI delivered as local web app | Proposed |
| [0012](0012-windows-service-and-agent-update.md) | Windows service hosting and agent update | Proposed |
| [0013](0013-simulation-marking.md) | Non-removable simulation marking | Proposed |
| [0014](0014-authentication-and-station-enrolment.md) | Authentication: local + optional OIDC; station enrolment | Proposed |
| [0015](0015-i18n-and-rtl.md) | Internationalization and RTL approach | Proposed |
| [0016](0016-metadata-engine.md) | Versioned metadata engine as the platform core | Proposed |
| [0017](0017-typed-expression-language.md) | Typed, dimension-checked, terminating expression language | Proposed |
| [0018](0018-declarative-drivers-and-safety.md) | Declarative drivers, hazard classes, and out-of-band safety profiles (amended by ADR-0023) | Proposed |
| [0019](0019-draft-editing-concurrency.md) | Draft editing: leases + optimistic concurrency (CRDT deferred) | Proposed |
| [0020](0020-dynamic-ui-and-report-rendering.md) | Metadata-driven UI and report rendering | Proposed |
| [0021](0021-config-distribution-and-environments.md) | Configuration distribution and assignments (environment model amended by ADR-0024) | Proposed |
| [0022](0022-baseline-extensions.md) | Baseline extensions (queue, object store, telemetry, tooling) | **Accepted** (E1–E6) |
| [0023](0023-safety-profile-ownership-and-hardware-limits.md) | Safety Profile ownership, separation of duties, immutable hardware limits (resolves Q-13) | **Accepted** |
| [0024](0024-separate-test-and-production-deployments.md) | Separate Test and Production deployments (resolves Q-14) | **Accepted** |
