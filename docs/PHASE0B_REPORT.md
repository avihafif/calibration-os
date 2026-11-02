# Phase 0B secure metadata foundation — implementation report

Date: 2026-11-02. Branch: `feature/phase0b-secure-metadata`, based on Phase 0A
commit `6a5491b`. This is a simulation-only verification prototype, not a
production security accreditation or a metadata publication system.

## Implemented boundary

- `schemas/package-manifest/v1.schema.json` is the closed signed-manifest
  contract. `tools/codegen.py` generates synchronized Python and TypeScript
  types. The strict parser rejects duplicate JSON keys, floats, unknown fields,
  invalid kind schemas, input over 1 MiB, excessive JSON depth/node count and
  mismatched SHA-256 content digests.
- `calos_security` verifies Ed25519 over canonical manifest bytes, issuer,
  publisher, tenant, package key and deployment scope, time window, revocation
  snapshot freshness and runtime compatibility. Injected trust snapshots are
  copied/frozen and JWT and package public-key roles must differ. All failures
  have stable codes.
- A pinned EdDSA JWT verifier requires issuer, audience, subject, time,
  principal type, tenant, deployment and `package.import` permission. The API
  offers a read-only verification response, with non-removable `simulated` and
  `non_operational` receipt fields; it writes nothing. Denials use
  `application/problem+json`, correlation IDs and code-only denial log fields.
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
| Separate Test and Production rehearsal | Phase 0A Compose resource test retained; default verifier unavailable in both | Local static pass; hardening CI pass |
| Phase 0A regression | Existing 12 tests and tooling gates retained | Local pass |
| New security suite | Nine scenario groups with positive and negative cases | Local and hardening CI pass |

Local checks on 2026-11-02: `tools/check.py` passed 16 unit tests and 9
security scenario groups, with no skipped or failing tests. `mypy --strict`
passed 14 core/API source files; Ruff, import-linter, codegen and TypeScript typing
passed. Docker was unavailable on this Windows host. GitHub Actions
[push run 41394734344](https://github.com/avihafif/calibration-os/actions/runs/41394734344)
and [PR run 41394741209](https://github.com/avihafif/calibration-os/actions/runs/41394741209)
both passed four jobs on hardening tree `937111c2`: Python on Windows and Ubuntu,
TypeScript, and Compose rehearsal. The Compose job checked both isolated
projects, migrations, shell routes, and `503` from the unprovisioned package
route. No CI job failed or was skipped. PR #1 had zero submitted reviews,
inline review comments and issue comments at this review checkpoint.

## Engineering and security review findings

| Finding | Hardening and test |
| --- | --- |
| A miswired authenticator from another deployment could have supplied a valid principal to the Test verifier | Explicit principal-to-verifier deployment equality check and negative vector |
| A verifier for another deployment could be injected into the API composition root | Construction-time API-to-verifier deployment equality check and negative vector |
| Caller-owned mutable trust collections could change after construction | Copy/freeze public-key maps, key tuples and revocation sets; mutation vector |
| JWT numeric date claims could use unexpected types; injected clock could disagree with token validity | Require integer `exp`/`iat`/`nbf` and compare against injected clock as well as PyJWT checks |
| JWT and package signing roles could reuse one public key | Construction-time role separation check and negative vector |
| Oversized or deeply nested JSON could consume excess memory/stack | 1 MiB body check before append; 64-level/10,000-node parser caps; rejection vectors |
| Time parser accepted forms outside RFC 3339 UTC syntax | Closed schema pattern and strict UTC timestamp parser |
| Malformed Base64 signature could raise an uncaught decoding error | Decode exceptions become stable `PACKAGE_SIGNATURE_INVALID` |
| API denials lacked correlation and structured security signals | Problem JSON with request ID and code-only log records; no token or body logged |

No instrument/model branch, arbitrary code execution path, API-to-transport
dependency, configuration write or Production authoring path was found in the
Phase 0B diff. The Phase 0A architecture and isolation gates remain active.
No critical or high-severity implementation defect remained known after this
review and the listed gates. This is an engineering finding, not an independent
security assessment or production-readiness claim.

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
6. No durable audit sink, account disablement or token revocation service is
   implemented; denial logging is a local signal only. Full secret scanning,
   supply-chain scanning, independent security review and production
   infrastructure hardening remain release gates.

See [ADR review and approval matrix](PHASE0B_ADR_REVIEW.md) for each owner
decision. The original specification ADR statuses were not changed.

## Recommended next milestone and Phase 1 proposal

**Next approval milestone:** the [Phase 0C trust and identity proposal](PHASE0C_PROPOSAL.md)
separates work permitted under Accepted ADRs from decisions requiring human
approval. Ratify or revise ADR-0004, ADR-0014, ADR-0016 and ADR-0021 with
named decision owners; decide Q-15 and MI-34. Add approved trust provisioning,
signed revocation/freshness metadata, identity issuer integration and
dual-control issuer changes before enabling a deployed package verifier.

The [Phase 1A implementation plan](PHASE1A_IMPLEMENTATION_PLAN.md) is a
conditional file-level plan for a local-draft visual Builder. It does not
authorize implementation before PR #1 is reviewed and merged and Claude's
architecture/UX design is approved and integrated.

**Phase 1 proposal, only after those gates:** build a minimal schema-driven
Application Builder for one `Manufacturer` and one `InstrumentModel` configuration
kind, then a simulator-only Calibration Execution Engine with a small trusted
step catalog and mandatory simulation marking. Draft, validation, approval,
publication and release operations remain separately gated by governance and
the two-tier safety architecture. The first vertical slice uses no real
instrument transport, SCPI or metrology numbers. Its acceptance test is a
non-programmer creating and revising the application in the GUI, executing
only a simulated procedure, and receiving a non-approvable watermarked draft.
