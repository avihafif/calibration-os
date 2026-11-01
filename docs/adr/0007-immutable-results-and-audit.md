# ADR-0007: Immutable approved results and hash-chained audit

Status: Proposed

## Context
Approved calibration results and the audit trail are records. They must be tamper-evident and unalterable by application bugs or privileged-but-unauthorized users; corrections must preserve history.

## Decision
1. **Sealed snapshot**: on approval, the system builds a canonical JSON (RFC 8785) `ResultSnapshot` pinning: run/journal head digest, procedure and all configuration versions+digests, plugin digests, standards/certificate snapshot, readings digests, evaluations, report template/dataset digests, approvals. Its SHA-256 is stored and (optionally) signed with a server key.
2. **DB enforcement**: tables for approved revisions and audit are append-only: application role has `INSERT/SELECT` only; `UPDATE/DELETE/TRUNCATE` revoked and blocked by triggers; DDL only by a separate migration role.
3. **Audit chain**: each audit row stores `prev_hash` and `hash`; a verification job re-computes continuously; head hash periodically anchored (export or RFC 3161 timestamp — optional).
4. **Corrections** are new **revisions** with `supersedes` link and mandatory reason; originals remain retrievable and reports of superseded revisions are watermarked superseded when re-rendered.
5. Config versions follow the same rule (ADR-0016).

## Options
Soft immutability (flags) — rejected. WORM/object-lock storage for snapshots — complementary option for customers requiring it.

## Consequences
+ Strong integrity story for assessors. − Mistakes require revision workflow; data-subject deletion requests need a documented policy (cryptographic erasure of personal fields vs. retention law — Q-04).
