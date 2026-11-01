# ADR-0003: Station local-first, journal-based persistence (SQLite)

Status: **Accepted** (2026-11-01) · **Baseline extension E1 — confirmed via ADR-0022 (Q-01 closed)**

## Context
The baseline mandates "local offline-capable station operation" and PostgreSQL centrally, but names no station store. Runs must survive process kill and power loss and be resumable; data must later sync idempotently.

## Decision
Use **embedded SQLite (WAL, `synchronous=FULL` for journal commits)** at the station. The **journal** (hash-chained, append-only event log) is the source of truth for run state; relational tables (`run`, `reading`, …) are **projections** rebuilt by replay. A content-addressed store (CAS) holds config blobs and evidence. Event envelope in ARCHITECTURE §11.2. Event-sourcing is scoped to the run aggregate and config activation, not to the whole product.

## Options
1. Local PostgreSQL — heavy service to install/patch on every bench; larger attack surface. Rejected for v1.
2. Flat files/NDJSON — simple, but atomicity, indexing and concurrent reader support are hand-built. Rejected.
3. **SQLite** — ubiquitous, transactional, single file, mature. Chosen.
4. Embedded KV (LMDB/RocksDB) — fewer relational features; no clear advantage.

## Consequences
+ Atomic "event + projection" commit; trivial backup; offline by construction.
+ Replay gives exact reproduction of projections (AC-ARCH-05).
− Second database technology; schema migrations on the fleet (forward-only, backup before migrate).
− SQLite at-rest encryption is optional (SQLCipher licensing/build) — default is OS ACLs + DPAPI-wrapped keys for secrets; encryption-at-rest listed as *should* (SECURITY_MODEL).
− Corruption handling must be explicit (quarantine, never auto-repair — FS-09).

## Revisit triggers
Multi-writer needs at one station; encryption-at-rest mandated by customers; scale beyond SQLite practical limits.
