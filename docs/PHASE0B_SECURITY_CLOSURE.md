# Phase 0B independent security review closure matrix

Status: PR #1 follow-up to the documentation-only [PR #2 review](https://github.com/avihafif/calibration-os/blob/feature/phase-1-design/docs/phase1/14_PHASE0B_SECURITY_REVIEW.md).
The review's `docs/phase1/` files are still a proposal on a separate branch;
this matrix records verified findings and corrections without ratifying ADRs.

| Review item | Phase 0B action | Evidence | Status |
| --- | --- | --- | --- |
| R-1 / SR-M9 #1–2 | Added `alg=none`, HS256 public-key confusion, critical header, token size and whitespace negatives | `test_jwt_algorithm_header_and_size_rejections` | Local and CI pass |
| R-1 / SR-M9 #3–4 | Added issuer/audience, future `iat`/`nbf`, missing claims, boolean/float `exp`, unknown/revoked auth key negatives | `test_jwt_claim_issuer_audience_and_key_rejections` | Local and CI pass |
| R-1 / SR-M9 #5 | Added exact package, token, package-key, package-trust and auth-trust expiry boundaries | `test_exact_expiry_boundaries_rejected` | Local and CI pass |
| R-1 / SR-M9 #7–8 | Added extra/wrong-type/Unicode-lookalike manifest negatives and canonical JSON representation equivalence | `test_signed_manifest_shape_and_canonical_equivalence` | Local and CI pass |
| R-1 / SR-M9 #9 | Added unauthenticated oversized and no-Content-Length chunked body negatives; asserts denial logs and responses omit body marker | API ASGI test | Local and CI pass |
| R-2 / SR-L5 | Replaced stale CI and no-High assertions; explicitly recorded replay, token lifetime, package validity and unsigned trust gaps | `PHASE0B_REPORT.md` | Documented with CI evidence |
| R-3 / SR-H1–H3, SR-M3 | Added open gates to Phase 0C; every receipt is fixed to non-operational, replay-unchecked, untrusted and import-ineligible | `PHASE0C_PROPOSAL.md`, receipt fields, test | Local/CI pass; policy unresolved |

[Push CI 41405379584](https://github.com/avihafif/calibration-os/actions/runs/41405379584)
and [PR CI 41405387138](https://github.com/avihafif/calibration-os/actions/runs/41405387138)
passed all four jobs on the R-1/R-2/R-3 code tree: Python Ubuntu, Python
Windows, TypeScript and Compose rehearsal. The local run passed 16 unit and
14 security test groups, no skips or failures.

The review's SR-M9 #6 (replay rejection) cannot pass before ADR-0004 and a
tenant-scoped replay ledger are approved. The current test demonstrates the
same signed bytes can be verified twice and both receipts remain
`import_eligible=false`. SR-M9 #10–11 (fuzz/property and mutation coverage)
remain quality work for a separate review-gated PR; they are not claimed here.

## Open High gates, with no operational bypass

| Finding | Current boundary | Required before activation |
| --- | --- | --- |
| SR-H1, unbounded self-contained token claims | Injected Test trust only; no deployed token issuer; response cannot authorize import | ADR-0014: maximum lifetime, `jti`/revocation, per-request server-side permission resolution, account state and negative tests |
| SR-H2, package replay/rollback | Verification is stateless and read-only; fixed `replay_checked=false`, `import_eligible=false`; no import path exists | ADR-0004/0016: monotonic signed sequence and atomic tenant-scoped replay ledger on import |
| SR-H3, unsigned trust snapshots | Compose injects no trust, returns `503`; fixed `operational_trust=false`; test keys stay in memory | ADR-0004: signed versioned trust metadata, approved root custody, highest-version persistence and revocation freshness |

SR-M3 remains an architecture decision (D-25). The current
`production_rehearsal` value is simulation infrastructure, not a ratified
Production environment vocabulary. No accepted ADR was edited. No operational
trust provisioning, approval, import, activation or calibration path was added.

## Other open review items

R-4/R-7 are Gate A0 prerequisites with a preparation plan in
[`PHASE1A_GATE_A0.md`](PHASE1A_GATE_A0.md). R-5/R-8/R-9 need D-25, D-14 and
D-26 respectively. R-10/R-11/R-12 remain blocked by ADR-0014/0004/0016.
R-13's auth-before-body and remaining error/schema hardening must be completed
before any verifier is provisioned outside tests. A bounded unauthenticated
request currently gets `413` before auth; this is tested, not hidden.
