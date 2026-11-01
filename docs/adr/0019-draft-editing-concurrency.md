# ADR-0019: Draft editing — leases + optimistic concurrency (CRDT deferred)

Status: Proposed

## Decision
- One **edit lease** per draft (heartbeat; expiry; permissioned takeover with notification). Others view read-only with presence.
- Saves are **JSON Patch command batches** carrying `base_revision`; mismatch → `409` with server revision; client attempts rebase of non-overlapping operations, otherwise offers keep-mine/keep-theirs/merge-by-node.
- **Fork + three-way structural merge** (kind-aware) for parallel work.
- Cross-item edits are **change sets** applied atomically.
- Review freezes a snapshot by digest; later edits create a new snapshot (approvals bind to digests).
- Real-time multi-cursor co-editing via CRDT is **deferred**: metrological/safety content favors deliberate, attributable edits over merge-by-magic.

## Options
Pessimistic locks only (blocks teams), pure last-write-wins (loses edits), full CRDT (complex, hard to audit semantic merges). Chosen mix: lease + optimistic + structural merge.

## Consequences
+ Predictable, auditable edits. − Less fluid than Google-Docs-style collaboration; acceptable for governed configuration.
