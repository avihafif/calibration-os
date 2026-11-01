# Phase 0B secure metadata foundation — implementation report

Date: 2026-11-02. Branch: `feature/phase0b-secure-metadata`, based on Phase 0A
commit `6a5491b`. This is a simulation-only verification prototype, not a
production security accreditation or a metadata publication system.

## Implemented boundary

- `schemas/package-manifest/v1.schema.json` is the closed signed-manifest
  contract. `tools/codegen.py` generates synchronized Python and TypeScript
  types. The strict parser rejects duplicate JSON keys, floats, unknown fields,
  invalid kind schemas, oversized input and mismatched SHA-256 content digests.
- `calos_security` verifies Ed25519 over canonical manifest bytes, issuer,
  publisher, tenant, package key and deployment scope, time window, revocation
  snapshot freshness and runtime compatibility. All failures have stable codes.
- A pinned EdDSA JWT verifier requires issuer, audience, subject, time,
  principal type, tenant, deployment and `package.import` permission. The API
  offers a read-only verification response, marked `simulated` and
  `non_operational`; it writes nothing.
- The supplied Compose deployments have **no authentication or package trust
  material**. The endpoint fails closed with `503 VERIFIER_UNAVAILABLE`.
  Cryptographic acceptance tests generate private keys in process memory and
  inject only public keys into the verifier.
- `calos_metadata.lifecycle` declares version-aware Draft, Validation,
  Approval, Publication and Release Package ports. No lifecycle write method
  has a concrete implementation in this phase.

## Acceptance and evidence

| Criterion | Evidence | Status |
| --- | --- | --- |
| Signed and authorized package | In-memory Ed25519 and JWT ASGI test returns a simulated verification receipt | Local pass; test trust only |
| Modified or unsigned package | Digest, manifest-signature, wrong-key and unsigned vectors | Local pass |
| Unauthorized operation | Missing, forged, expired or unprivileged JWT vectors | Local pass |
| Other deployment/environment/tenant | Token, package and trust-snapshot negative vectors | Local pass |
| Schema/compatibility failure | Unknown schema, invalid envelope and runtime-range vectors | Local pass |
| Separate Test and Production rehearsal | Phase 0A Compose resource test retained; default verifier unavailable in both | Local static pass; CI pending |
| Phase 0A regression | Existing 12 tests and tooling gates retained | Local pass |
| New security suite | Seven scenario groups with positive and negative cases | Local pass; CI pending |

Local checks on 2026-11-02: `tools/check.py` passed 15 unit tests and 7
security scenario groups, with no skipped or failing tests. `mypy --strict`
passed 12 core source files; Ruff, import-linter, codegen and TypeScript typing
passed. Docker was unavailable on this Windows host; the expanded Compose job
will verify the fail-closed endpoint and existing migrations in GitHub Actions.

## Security limitations and dependencies

1. ADR-0004 and ADR-0014 are still Proposed. No operational issuer approval,
   signed trust metadata, key ceremony, rotation, account store, token issuer,
   refresh flow or station enrolment is implemented. An injected trust snapshot
   is a *test seam* and cannot establish an approved root of trust by itself.
2. Revocation is checked against a caller-supplied snapshot and fails when the
   snapshot expires. The authority, signature, distribution, monotonic version,
   offline grace and staleness policy require ADR-0004/0021 ratification.
3. Package verification is not publication, release approval, promotion or
   activation. Production rehearsal exposes no configured verifier; no
   `synthetic_demo` content can cross into a release path. ADR-0016/0021 and
   independent Production approvals are prerequisites for those operations.
4. The first content kind remains `Manufacturer`. Full JSON Schema Draft
   2020-12, schema up-converters, dependency closure, TUF delegated roles,
   immutability storage and broad application compatibility are not claimed.
5. Q-15 and MI-34 remain open. No metrology values, signatories or real
   calibration artifacts are supplied by engineering.

See [ADR review and approval matrix](PHASE0B_ADR_REVIEW.md) for each owner
decision. The original specification ADR statuses were not changed.

## Recommended next milestone and Phase 1 proposal

**Next approval milestone:** ratify or revise ADR-0004, ADR-0014, ADR-0016
and ADR-0021 with named decision owners; decide Q-15 and MI-34. Implement
approved trust provisioning, signed revocation/freshness metadata and identity
issuer integration before enabling a deployed package verifier. Add dual-control
issuer changes and audit evidence before any Production Release Package import.

**Phase 1 proposal, only after those gates:** build a minimal schema-driven
Application Builder for one `Manufacturer` and one `InstrumentModel` configuration
kind, then a simulator-only Calibration Execution Engine with a small trusted
step catalog and mandatory simulation marking. Draft, validation, approval,
publication and release operations remain separately gated by governance and
the two-tier safety architecture. The first vertical slice uses no real
instrument transport, SCPI or metrology numbers. Its acceptance test is a
non-programmer creating and revising the application in the GUI, executing
only a simulated procedure, and receiving a non-approvable watermarked draft.
