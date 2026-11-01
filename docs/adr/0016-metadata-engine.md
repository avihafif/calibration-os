# ADR-0016: Versioned metadata engine as the platform core

Status: Proposed · Mandate-driven

## Context
No-Code-First requires a uniform way to store, validate, version, review, publish, distribute and audit all configuration.

## Decision
Build a **generic metadata engine** (`calos_metadata`): a registry of Configuration Kinds (JSON Schema per `schema_version` + semantic validators + editor hints), a draft/snapshot/version lifecycle, content addressing (SHA-256 of RFC 8785 canonical JSON), pinned dependency graph (DAG), packages, assignments (mutable pointer, append-only history), approvals with separation of duties, and kind-aware diff/merge. Published versions are immutable (grants + triggers). Details: NO_CODE_ARCHITECTURE §4, CONFIGURATION_GOVERNANCE.

All product behavior that is "content" (instruments, drivers, procedures, metrology, UI, reports, translations, policies) is stored through it. The platform's own system UI is shipped as read-only system-scope items.

## Options
1. Hardcode models/screens/procedures in Python/TS — violates mandate. Rejected.
2. Adopt a generic low-code product/BPM suite — introduces foreign stack, weak metrology semantics. Rejected.
3. Store config as files in Git, deploy via CI — good for developers; not for non-programmer authors. Rejected as primary; export to files is supported for backup/diffs.
4. **Purpose-built metadata engine on PostgreSQL JSONB** — chosen.

## Consequences
+ Uniform governance, audit, impact analysis, offline distribution. − Large upfront investment (it *is* the product core); schema-evolution discipline required; performance of JSONB queries (indexes, materialized dependency edges mitigate).

## Revisit triggers
Metadata volume or query patterns outgrow JSONB; need for graph database for dependency analysis (unlikely at expected scale).
