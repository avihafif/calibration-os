# ADR-0009: Sync — idempotent journal replication, leases, conflict quarantine

Status: Proposed

## Context
Stations work offline and later reconcile with central. Required: idempotency, conflict detection, safe recovery, no silent loss.

## Decision
- **Upstream**: stations replicate the per-run hash-chained journal. Each event has a client-generated `event_id` (UUIDv7) and per-run `seq`. Server accepts in order; duplicates (same id+hash) are no-ops; gaps → `409 expected_seq`; same id with different hash → **integrity conflict** (quarantine). Batches resumable; ack returns `acked_seq`.
- **Single-writer per run**: runs are created with a **lease** (`run_id`, `station_id`, `epoch`); runs started offline are *provisional* until central grants. A second claimant (e.g., resumed elsewhere) is rejected into a conflict record. Cross-station handover is an explicit, online, permissioned operation that bumps the epoch.
- **Downstream**: monotonic per-(tenant,environment) **change feed** with tombstones for master data and signed assignment manifests (ADR-0021).
- **Conflict classes**: duplicate-run-claim, stale-basis (run used config/standard later withdrawn), integrity mismatch, clock anomaly, revoked-artifact-used. Resolution is a human workflow; data is never discarded or auto-merged.
- **Artifacts** (evidence files) upload chunked with digest verification; event references commit only after verification.
- **Staleness gate**: lab policy bounds offline duration for starting new production runs (Q-06).

## Options
Bidirectional CRDT/last-writer-wins — inappropriate for records of evidence. Two-phase commit — impossible offline. **Single-writer log shipping + feed** — chosen.

## Consequences
+ Simple correctness argument: append-only, idempotent, verifiable. − Master-data edits are central-only; offline stations cannot change config (intentional).
