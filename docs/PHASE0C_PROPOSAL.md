# Phase 0C proposal — approved trust and identity foundations

Status: proposal for human review, 2026-11-02. This is not an ADR approval or
an instruction to provision operational keys. Phase 0B PR #1 remains
verification-only and simulation-only.

## Work permitted by Accepted decisions now

| Basis | Independent preparatory work | Gate |
| --- | --- | --- |
| ADR-0022 E6 | Keep Ed25519 verification behind injected public-key ports; add canonical digest/signature vectors and dependency review | Do not create a trusted issuer or private production key |
| ADR-0024 | Strengthen Test/Production rehearsal resource-isolation probes and cross-deployment token/package rejection | No shared trust root, station, data or standing cross-deployment connection |
| ADR-0023 | Preserve the separate AHL channel and reject any Safety Profile or hardware-limit operation through metadata verification | No AHL pack, limit value or safety approval may be inferred |
| AGENTS.md and architecture boundaries | Expand read-only schema-registry compatibility fixtures, parser resource limits, codegen drift checks and architecture contracts | No draft, approval, publication or activation writes |

These tasks can proceed while Claude's separate Phase 1 Builder design PR #2
awaits human review: CI hardening, secret and dependency scanning, Docker rehearsal
validation, a read-only schema-version compatibility matrix, canonicalization
vectors, metadata fixture maintenance, and documentation of deployment setup.
They do not require editing Claude's worktree or choosing Builder UX behavior.

## Independent security review gates

Claude's [Phase 0B review in PR #2](https://github.com/avihafif/calibration-os/blob/feature/phase-1-design/docs/phase1/14_PHASE0B_SECURITY_REVIEW.md)
found no Critical issue but identified three High gates. They are open even
though the shipped API has no trust provisioned and returns `503` by default.

| Finding | Present limitation | Gate before any operational verifier or import |
| --- | --- | --- |
| SR-H1 | Token permissions are claim-based; no approved maximum lifetime, `jti`, account/permission lookup or token revocation | ADR-0014: approved short-lived token policy, revocation/replay handling and per-request server-side permission resolver |
| SR-H2 | Stateless verification accepts replay and has no monotonic package sequence or ledger | ADR-0004/0016: signed sequence and tenant-scoped persistent replay/rollback ledger on the import path; pure verification must never grant import eligibility |
| SR-H3 | Test-injected trust/revocation snapshots are unsigned and unversioned, so they cannot prove authority or resist rollback | ADR-0004 and D-24: approved root/targets/snapshot/timestamp custody, signatures, freshness and highest-version persistence |
| SR-M3 | `production_rehearsal` in code differs from the `{test, production}` architectural vocabulary | D-25: decide whether rehearsal is a separate non-operational attribute or an ADR-0024 supersession before releasing signed schemas |

The Phase 0B receipt is permanently marked `simulated`, `non_operational`,
`replay_checked=false`, `operational_trust=false`, and `import_eligible=false`.
No code may turn this receipt into an import, approval, activation or safety
authorization. Token/package validity maxima remain unset pending policy; no
engineering default is a substitute for the named human decisions.

## Decisions blocking operational Phase 0C work

| Decision | Required resolution before implementation |
| --- | --- |
| ADR-0004 | Ratify manifest/signature format, role delegation, trust-root custody, key rotation, signed revocation/freshness feed, monotonic version and offline staleness rules |
| ADR-0014 | Ratify local/OIDC identity choices, token claims/lifetime, issuer and JWKS provisioning, refresh/revocation, station enrolment and account lifecycle |
| ADR-0008 | Ratify tenant-scoped persistence/RLS model before storing users, issuers or package records |
| ADR-0016 and ADR-0021 | Ratify lifecycle, distribution and release semantics before publication, assignment or import writes |
| ADR-0024 operational change control | Name the Quality Manager and Safety Officer who jointly approve Trusted Release Issuers; no direct trust-list edits |
| D-25 / ADR-0024 alignment | Decide the environment-kind vocabulary; do not silently change an Accepted ADR or continue embedding the disputed value in new signed schemas |
| Q-15 and MI-34 | Decide authored-content language ownership and name role holders/deputies; do not invent signatories |

## Proposed implementation sequence after decisions

1. Record the ratified decisions and threat-model review. Define deployment
   public-trust and identity-issuer provisioning interfaces with audit records;
   keep private keys in an approved per-deployment `SecretProvider`/KMS.
2. Implement signed, monotonic trust metadata with expiry and revocation checks,
   plus dual-controlled Trusted Release Issuer changes. Reject stale, rolled
   back, unknown and cross-deployment material.
3. Integrate the approved token issuer/validator and tenant/lab RLS context.
   Test account disablement, key rotation, claim confusion, token expiry,
   privilege conflicts and cross-tenant denial.
4. Enable the existing verification-only endpoint in a controlled Test
   deployment after keys and issuer approvals are recorded. Keep Production
   rehearsal non-operational; Release Package import remains a separate,
   independently approved workflow.
5. Require a security review, negative integration suite, CI secret/dependency
   scans and deployment runbook before any broader metadata lifecycle work.

## Phase 0C exit evidence

- Signed trust and identity metadata have named owners, approval records,
  version/expiry/revocation semantics and separate Test/Production material.
- Cross-deployment, cross-tenant, wrong-role, stale, revoked, tampered and
  rollback vectors fail closed in unit and integration tests.
- The API has structured denial logs with correlation IDs and no token,
  package content, secret or personal data in logs.
- Operational trust provisioning and identity choices match ratified ADRs;
  the Production release path remains independently gated by ADR-0024.
