# R-7 metadata lifecycle contract alignment

Status: contract-only feature branch, stacked on Phase 0B PR #1. This document
records an implementation interface, not approval of a lifecycle or of the
proposed Phase 1 documents in PR #2. Gate A0 remains **not green**.

## Contract surface

| Area | Typed contract | Future implementation obligation |
| --- | --- | --- |
| Actor scope | `ActorContextPort.current()` returns tenant, actor, deployment and environment identity; authoring requests have no caller-supplied identity fields | Host must derive identity from authenticated context and enforce tenant RLS and Test-only authoring |
| Drafts | `CreateDraftRequest`, `DraftRef`, `DraftDocument` and `DraftPort` | Persist revisions, reject cross-tenant reads, prohibit Production drafts |
| Edits | Six RFC 6902 operation types, `PatchDraftRequest` with base revision and lease, fork, three-way merge, atomic changeset request, typed revision/lease/merge conflicts | Apply JSON Patch atomically, enforce lease ownership, revision preconditions, safe merge and idempotency |
| Validation | `Finding` carries stable code, severity, JSON Pointer, localized message key/params, optional remediation and stage; `ValidationResult` carries the revision | Implement server validators and keep local/server finding semantics aligned |
| Governance | Digest-bound `ReviewSnapshotRef`, submit/decision requests, required reason and idempotency key; role, step-up and SoD verification ports | Freeze snapshot, compare asserted digest, resolve current role, validate step-up evidence, enforce SoD, audit transitions |
| Versioning | Immutable version reference, SemVer and change-class proposals, structural diff, dependency/dependent and impact read ports | Compute minimum class/bump independently, pin dependencies, reject reuse, keep published versions append-only |

`ContentDigest` admits only lowercase `sha256:` plus 64 hex digits. Revision,
digest, reason and idempotency request fields are mandatory; their primitive
value objects reject invalid or empty values. JSON Pointers reject malformed
escapes. The `Json` payload inside a draft or patch remains editable data; the
frozen envelope does not claim to deep-freeze authored content.

The contract's `step_up` field is required but may be `None`: whether an action
requires step-up remains a governance decision. An eventual server must call
the role, step-up and SoD ports using its trusted `ScopedActor`; the mere
presence of a reference is never proof of authorization. A caller-proposed
change class or version cannot override the server-computed minimum.

## Architecture compatibility

The contract lives only in `calos_metadata`; it adds no dependency on the API,
database, identity provider, frontend or station. It exposes no route or
composition root. It contains no persistence, signature, release-package,
approval or instrument implementation. The old `ReleasePackagePort` was
removed from the lifecycle module because preparing and importing a release
package is a separate trust/distribution boundary, not an item lifecycle
operation. No production caller used that port.

The future Builder can map the proposed `DraftPort` host interface in PR #2 to
these request/result shapes. `apps/web` must implement injected host ports;
designers must not import an API client directly. A Synthetic Host may model
these shapes in memory with conspicuous simulation labelling; it must never
represent a draft, approval or publish demonstration as an operational action.
The shared TypeScript/JSON transport model and actual server enforcement are
future work and must follow approved schema and governance decisions.

## Verification and open gates

The focused unit suite checks omitted mandatory context, malformed values,
caller identity exclusion and immutable envelopes. A strict-mypy fixture uses
expected `call-arg` errors; if a mandatory field becomes optional, the unused
ignore fails CI. The existing Python CI typing step includes that fixture.
Local verification on Windows: `python tools/check.py` passed (20 unit tests,
14 security tests, codegen, boundaries, isolation and tracked-source scan).
Strict mypy passed 15 files; Ruff lint/format passed; four import contracts
held; TypeScript type/lint/format/boundary/build checks passed. Remote CI is
reported separately in the PR after it runs.

Before any implementation of writes or publication: ratify ADR-0016
(configuration lifecycle), ADR-0008 (tenant RLS), ADR-0014 (identity policy)
and ADR-0021 (distribution); resolve ADR-0004 for trust/replay where packages
are involved, D-25 for environment vocabulary, and MI-30/MI-34 for approval
matrix and named role holders. PR #1 and PR #2 remain unmerged; R-4 schema
validation and other Gate A0 decisions remain separate prerequisites. No
decision is accepted by this contract PR.

Recommended next independent backend prerequisite: R-4 schema validator
registration hardening, limited to closed-schema rejection, local references,
`oneOf`/`const`, integer bounds and `uniqueItems`. Defer the proposed `pattern`
dialect and new dependencies until their human decisions are recorded.
