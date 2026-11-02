# 14 — Independent review of Phase 0B (Pull Request #1)

| | |
|---|---|
| Subject | [PR #1 "Phase 0B: authenticated verification-only metadata foundation"](https://github.com/avihafif/calibration-os/pull/1), head `b134cca6e6cf2e3feca46c1c807f62654274f889`, base `main` (`6a5491b`), 29 files, **draft**, GitHub reports it mergeable/clean |
| Reviewer | Claude (design/spec lane). Independent of the author (Codex). |
| Date | 2026-11-02 |
| Nature | Read-only review. **Nothing on the PR branch was modified; no review comment was posted to GitHub; the PR was not merged.** Findings are recommendations for the owners. No ADR was changed, ratified or reinterpreted. |
| Scope | `packages/py/calos_security/*`, `packages/py/calos_metadata/{package,schema,canonical,lifecycle}.py`, `packages/py/calos_domain/deployment.py`, `schemas/package-manifest/v1.schema.json`, `apps/api/calos_api/main.py`, `tests/security/*`, `tests/unit/test_package_parser.py`, CI/Docker/lock changes, and the documents `PHASE0B_REPORT`, `PHASE0B_ADR_REVIEW`, `PHASE0C_PROPOSAL`, AGENTS/README/Capability-Matrix edits. |

## 1. Verdict

* **Critical findings: none.** I found no way to make the verifier accept a tampered, unsigned, wrong-key, wrong-deployment, wrong-tenant, expired-package, forged-token, `alg=none` or algorithm-confused token input, and no path that writes data, reaches an instrument transport, or enables authoring in Production. The endpoint is inert by default (`503 VERIFIER_UNAVAILABLE`) and the Compose deployments contain no trust material.
* **High findings: 3**, all *gating* rather than exploitable today: (SR-H1) permissions come from token claims with no lifetime cap, (SR-H2) no replay or rollback protection, (SR-H3) trust/revocation snapshots are unsigned, unversioned, in-memory objects. Each must be resolved before the verifier is enabled outside tests, and before Phase 1 relies on it for import.
* **Medium: 12. Low: 7.**
* **Recommendation to the owner** (the merge decision is theirs): PR #1 is acceptable to merge **as a verification-only, simulation-only foundation** once the three "before merge" items in §6 (cheap, no ADR needed) are done, *provided* the merge is not read as accepting the trust model — ADR-0004 and ADR-0014 remain Proposed. Phase 1 work must not start building on the verifier until the "before Phase 1A" corrections in §6 are made. I do not approve any behaviour listed under §2.3 as unverified.

## 2. Evidence

### 2.1 What I ran (independently)
| Check | Result |
|---|---|
| Detached checkout of `b134cca`; `python -m unittest discover -s tests/security` | **9 tests OK** |
| `python -m unittest discover -s tests/unit` | **16 tests OK** |
| Adversarial probes (own script, not in the PR): HS256 key-confusion token; `alg=none` token; 10-year token; identical package replayed; package `expires_at` year 9999; backdated `issued_at`; `runtime_min > runtime_max`; non-ASCII `content_digest`; schema `pattern` semantics; unsupported schema keyword | HS256 and `alg=none` **rejected** (`UNAUTHENTICATED`); non-ASCII digest **rejected** (`SCHEMA_PATTERN`); `format` keyword **fails closed** (`SCHEMA_KEYWORD_UNSUPPORTED`); range inversion **rejected**; **10-year token accepted**; **replay accepted twice**; **year-9999 package accepted**; backdated issue within key window **accepted**; pattern uses **full-match** semantics (see SR-M1) |
| GitHub-reported CI for the head commit | Both workflow runs (`41394734344`, `41394741209`) show **success** for Python Ubuntu, Python Windows, TypeScript, Compose rehearsal (read via the GitHub REST API; I did not re-run them) |
| Diff review of AGENTS.md, README, Capability Matrix, ADR directory | No ADR file was modified; AGENTS rules 1–14 were not weakened; Capability Matrix edit is a status note (class unchanged) |

### 2.2 Positive findings (design strengths worth preserving)
1. **Fail-closed by default**: no verifier ⇒ `503`; unsupported schema keywords, open objects and unknown properties are errors; unknown `kid`, kind, schema version → rejection.
2. **Strict parsing**: duplicate-key rejection, float/NaN rejection, UTF-8 strict, size/depth/node caps, closed envelope, canonical-JSON digest with constant-time compare, strict canonical base64 for signatures.
3. **Layered identity checks**: deployment and environment on token, manifest, trust snapshot and verifier; principal-to-verifier equality; production-rehearsal refuses direct verification; JWT and package signing keys must differ (`TRUST_ROLE_CONFLICT`).
4. **Immutable injected trust** (copy/freeze), stable error codes, structured denial logs with correlation IDs and no token/body.
5. **Honest documentation**: limitations, unverified claims and decision gates are written down (`PHASE0B_REPORT`, `PHASE0C_PROPOSAL`); ADR statuses untouched.
6. **No-Code boundary respected**: verification is kind-agnostic (any registered kind), no model/vendor strings, no instrument path, `apps/api` does not import transports.

### 2.3 Not verified by me (do not treat as approved)
* Execution on **Python 3.12** with the **locked** dependency set. I ran Python 3.11.9 against current PyPI releases in an isolated directory; the repository requires ≥3.12 and pins `cryptography 50.0.2`, `PyJWT 2.15.1`, `fastapi 0.156.8`, `starlette 1.10.0`. I could not independently verify these versions' provenance, advisories or licences.
* `mypy --strict`, `ruff`, `lint-imports`, TypeScript gates, Docker/Compose behaviour (I relied on GitHub-reported CI).
* Real network isolation, DNS-rebinding, deployed TLS, secret handling, Windows service behaviour.
* Behaviour with real key custody, rotation or revocation — none exists.
* Any claim about ADR-0004/0014 *final* semantics — both are Proposed; I compared the code to the ADR texts as written.

## 3. Findings

Format: **ID · Severity · Title** — *Files* — Description/evidence — **Correction** — *Gate*.

### 3.1 Critical
None found.

### 3.2 High

**SR-H1 · High · Authorization comes from unbounded, self-asserted token claims**
*Files:* `packages/py/calos_security/calos_security/auth.py` (`authenticate`, claims decode and `exp/iat/nbf` checks, ≈ lines 78–137); `packages/py/calos_security/calos_security/verify.py` (`"package.import" not in principal.permissions`, ≈ line 168).
*Evidence:* a token with `exp` ten years ahead is accepted (probe). Permissions are read from the token's `permissions` claim; there is no maximum `exp − iat`, no `jti`, no server-side permission resolution or token revocation. `API_CONTRACT §1` states "authorization is evaluated server-side per request"; ADR-0014 requires short-lived access tokens.
**Correction:** (1) add `max_token_lifetime` to `AuthTrustSnapshot` and reject `exp − iat` above it (and `exp` too far from `now`); (2) require `jti` and add a replay/revocation hook port; (3) introduce a `PermissionResolver` port so the token carries identity (`sub`, tenant, deployment) and permissions are resolved per request from RBAC state (Phase 1 S0), keeping claim-embedded permissions only behind a clearly named *test seam*; (4) add vectors for each. *Gate:* before any non-test token issuer is provisioned (ADR-0014).

**SR-H2 · High · No replay or rollback protection for packages**
*Files:* `packages/py/calos_security/calos_security/verify.py` (`PackageVerifier.verify`); `schemas/package-manifest/v1.schema.json` (no sequence/nonce field); `packages/py/calos_metadata/calos_metadata/lifecycle.py` (no replay ledger port).
*Evidence:* the same signed bytes verify repeatedly (probe); a superseded package remains acceptable until its own `expires_at`. ADR-0004 §3 requires monotonic versions and rejection of older metadata.
**Correction:** add a monotonic `sequence` (per `package_id` lineage) to manifest v1 (or v2, since nothing is released), a `ReplayLedger` port (persistent, tenant-scoped) consulted and updated by the *import* path, and tests for replay, older sequence, equal-sequence/different-digest. Pure verification may stay stateless but its receipt must state "replay not checked". *Gate:* before any import/persistence (S1/S7).

**SR-H3 · High · Trust and revocation snapshots are unsigned, unversioned, in-memory objects**
*Files:* `verify.py` (`PackageTrustSnapshot`, ≈ lines 54–73); `auth.py` (`AuthTrustSnapshot`).
*Evidence:* revocation lists and keys are caller-supplied; replacing a snapshot with an older copy silently un-revokes keys/packages; freshness is the snapshot's own `expires_at` field, which the supplier controls. This is acknowledged by Codex (limitation 2) but is the central unresolved trust problem; ADR-0004 §2–4 specify role-separated, signed, monotonic metadata.
**Correction:** model trust metadata as a signed document (`version`, `issued_at`, `expires_at`, `signatures`) verified against an offline root; the verifier persists the highest accepted `version` and refuses lower ones; separate `targets` (authorised issuer keys) from `snapshot/timestamp` (freshness); revocation inside signed metadata only. Keep injected-key construction as a test seam. *Gate:* ADR-0004 ratification (owner decision D-24 in [11](11_DECISIONS_REQUIRED.md)).

### 3.3 Medium

**SR-M1 · Medium · JSON Schema `pattern` is evaluated with full-match semantics**
*Files:* `packages/py/calos_metadata/calos_metadata/schema.py` (≈ line 104, `re.fullmatch`); `schemas/package-manifest/v1.schema.json` (all `pattern` values are unanchored).
*Evidence:* `"pattern":"[a-z]+"` rejects `"123abc456"` here; standard Draft 2020-12 validators (including a future TS validator, Ajv, or any external schema consumer) accept it. The schema is only correct because of the non-standard validator. Python and TS implementations will diverge.
**Correction:** either (a) require anchored patterns (`^…$`), reject unanchored ones at registration in `_check_schema`, and switch to `re.search`, or (b) document and test the full-match dialect and add a conformance vector run by the TS implementation. Recommend (a). Update both schema files and add vectors.

**SR-M2 · Medium · Validator subset cannot express the Phase 1 Builder's schemas (planning blocker, not a defect)**
*Files:* `schema.py` (`KEYWORDS`, ≈ lines 26–45; `_check_schema`).
*Evidence:* `x-calos-editor`, `$defs`/`$ref`, `oneOf`, `const`, `minimum`/`maximum`, `uniqueItems`, `if/then`, `patternProperties`, `null` types are all rejected as `SCHEMA_KEYWORD_UNSUPPORTED`. That is the correct fail-closed behaviour — and it means every Phase 1 kind (07) is blocked until the subset is extended.
**Correction:** a dedicated PR before S1: allow `x-calos-editor` (validated against the closed hint vocabulary, ignored by value validation); add `$defs/$ref` (local only, cycle-checked), `oneOf` (exactly-one semantics), `const`, numeric bounds for integers, `uniqueItems`; keep fail-closed for everything else; add tests per keyword and a differential test against a reference validator in CI (dev-only). Do not claim 2020-12 conformance (P0A-G04).

**SR-M3 · Medium · `environment_kind` value `production_rehearsal` departs from ADR-0024 / API contract**
*Files:* `packages/py/calos_domain/calos_domain/deployment.py` (≈ line 17), `schemas/package-manifest/v1.schema.json` (≈ line 18), `apps/api/calos_api/main.py`, `verify.py` (`environment_kind != "test"` check).
*Evidence:* ADR-0024, `API_CONTRACT §1`, `DOMAIN_MODEL` and `SECURITY_MODEL` define `environment_kind ∈ {test, production}`. The skeleton (Phase 0A) introduced `production_rehearsal`; Phase 0B propagates it into a signed schema. Tokens and packages minted for "production" in the future would not match.
**Correction (needs a human decision, not a silent change):** keep the enum `{test, production}` and represent rehearsal as a separate deployment attribute (e.g., `operational: false`), **or** amend ADR-0024 via a superseding ADR. Until decided, do not add further schemas that embed the rehearsal value. Fix before the manifest is released outside tests.

**SR-M4 · Medium · Signatures have no domain separation**
*Files:* `package.py` (`signed_bytes = canonical_bytes(manifest)`), `verify.py` (`key.public_key.verify(…, package.signed_bytes)`).
*Evidence:* the signed message is the bare canonical JSON. `format_version` inside the manifest helps, but another future signed object with identical canonical bytes (trust metadata, hardware-limits manifests, release manifests) could be replayed across roles if a key is ever shared in error.
**Correction:** sign `b"calos.package-manifest.v1\x00" + canonical_bytes(manifest)` (context string per signed-object type, recorded in ADR-0004), add a cross-context negative vector. Cheap now, painful later.

**SR-M5 · Medium · Package validity and issuance are unbounded**
*Files:* `verify.py` (≈ lines 186–194), `schemas/package-manifest/v1.schema.json`.
*Evidence:* `expires_at = 9999-12-31T23:59:59Z` is accepted; `issued_at` may be backdated anywhere inside the key window.
**Correction:** add `max_package_lifetime` and `max_issue_age` (policy values, not metrology) to the trust snapshot; add skew tolerance and boundary vectors.

**SR-M6 · Medium · Lifecycle ports do not match the approved contracts**
*Files:* `packages/py/calos_metadata/calos_metadata/lifecycle.py` (≈ lines 31–54).
*Evidence:* `ValidationPort.validate → tuple[str, …]` (the contract's Finding is `{code, severity, pointer, fix, stage}`); `ApprovalPort.approve(snapshot, actor_id)` carries no digest/reason/step-up and no SoD; there is no `reject`, lease/`base_revision` patching (`PATCH /config/drafts/{id}` with JSON Patch), idempotency key, diff, impact or SemVer assignment; `DraftPort.create(tenant_id, …)` takes tenant as a parameter rather than from scoped context (RLS rule).
**Correction:** redesign the ports against `API_CONTRACT §2.3` and `07 §2.1` before S1 uses them (they are `Protocol`s, so the change is cheap); do not implement writes until ADR-0016 is ratified.

**SR-M7 · Medium · Permission and endpoint drift**
*Files:* `verify.py` (`"package.import"`), `main.py` (route `/api/v1/config/packages/verify`), `docs/PHASE0B_REPORT.md` vs `docs/PHASE0B_ADR_REVIEW.md`.
*Evidence:* the report and code use `package.import` (a state-changing permission in `GOVERNANCE §2.1`) for a read-only operation; the ADR review says `package.verify`, which is not in the permission catalog; the endpoint is not in `API_CONTRACT`.
**Correction:** owner decides D-14; then update `CONFIGURATION_GOVERNANCE §2.1`, `API_CONTRACT §2.3`, code, docs and tests consistently. Recommendation: add `package.verify` (least privilege).

**SR-M8 · Medium · Error taxonomy and HTTP mapping**
*Files:* `schema.py` (raises codes such as `SCHEMA_TYPE:/pointer`), `main.py` (≈ lines 87–96).
*Evidence:* codes embed JSON pointers (not stable identifiers; `API_CONTRACT` puts pointers in `errors[]`); all non-listed failures map to `422`, including trust failures (`RELEASE_ISSUER_UNTRUSTED`, `PACKAGE_REVOKED`, `PACKAGE_KEY_REVOKED`) that are authorization-class (403). New codes (`PACKAGE_*`, `SCHEMA_*`, `VERIFIER_UNAVAILABLE`, …) are not in the contract's list.
**Correction:** return `code` (stable) plus `errors:[{pointer, code}]`; extend the contract list (08 §4); map trust/revocation failures to 403, expiry/incompatibility to 422, stale trust to 503.

**SR-M9 · Medium · Test-suite gaps for a security boundary**
*Files:* `tests/security/test_package_verification.py`, `tests/unit/test_package_parser.py`.
Missing vectors (I verified items 1–2 by probe; they pass but are not guarded by tests):
1. `alg=none` and HS256/public-key-as-secret token confusion; 2. `crit` header, oversized/whitespace token; 3. `iss`/`aud` mismatch, `nbf`/`iat` in the future, each missing required claim, boolean/float `exp`; 4. revoked and unknown **auth** `kid`; 5. exact-boundary times (`now == expires_at`, `== key.valid_until`, `== trust.expires_at`); 6. replay and older-sequence (SR-H2); 7. manifest with extra property, wrong types, lookalike/Unicode `package_id`; 8. canonicalisation differential (re-ordered keys/whitespace/Unicode escapes must not verify as different bytes); 9. API: unauthenticated large body, chunked body without length, log-redaction of **body** content (only token redaction is asserted); 10. fuzz/property tests for the parser and canonicalizer (required by `ROADMAP §6.2` for loaders); 11. coverage/mutation score for `verify.py`/`auth.py` (security-critical; recommended even though AGENTS mandates mutation only for metrology).
**Correction:** add these to `tests/security/` (and a Hypothesis corpus under `tests/fuzz/`), run on Ubuntu and Windows in CI.

**SR-M10 · Medium · Library selection and supply chain not recorded**
*Files:* `packages/py/calos_security/pyproject.toml`, `uv.lock`, `.github/workflows/phase0a.yml`.
*Evidence:* ADR-0022 requires library choices within E6 to be recorded in an addendum; `PHASE0B_ADR_REVIEW` says the library must be selected and reviewed, but no addendum exists. CI has no `pip-audit`/licence/SBOM step (Codex lists this as a remaining gate).
**Correction:** ADR-0022 addendum naming PyJWT and `cryptography` with licence, maintenance and CVE review; add dependency audit + licence check + SBOM job; pin Docker base image digest. Needs owner approval (AGENTS §8).

**SR-M11 · Medium · `calos_security` mixes identity and trust concerns**
*Files:* `packages/py/calos_security/calos_security/{auth,verify}.py`, `.importlinter`.
*Evidence:* user authentication (JWT) and package trust (Ed25519 manifests, revocation) live in one package; `verify.py` imports `calos_metadata` and consumes `JwtAuthenticator`. Phase 1 adds RBAC, SoD, step-up and dual control (identity side) and release/issuer trust (trust side) — they will grow in different directions and have different owners/reviewers.
**Correction:** before S0, split into `calos_security` (authn/authz/SoD/step-up) and `calos_trust` (signing, trust metadata, revocation, package verification) with import-linter contracts in both directions; move `TRUST_ROLE_CONFLICT` to a shared key-role registry.

**SR-M12 · Medium · Tenant and issuer model conflicts with ADR-0024 and ID conventions**
*Files:* `verify.py` (`TrustedMetadataKey.tenant_id`), `schemas/package-manifest/v1.schema.json` (`tenant_id` free string ≤120), `lifecycle.py`.
*Evidence:* Trusted Release Issuers are **deployment-scoped** (Production trusts a Test deployment's key); binding each key to one tenant couples issuer trust to tenancy. Tenant IDs are arbitrary strings whereas the contract uses UUIDv7. Tenant isolation is an equality check only (no RLS path exercised) — appropriate for this phase but must not be mistaken for isolation.
**Correction:** scope issuer keys to a deployment (and optionally allowed tenants), use UUID types for tenant/deployment IDs, and require RLS-backed lookups when persistence arrives (ADR-0008).

### 3.4 Low

| ID | Title | Files | Correction |
|---|---|---|---|
| SR-L1 | Request body is read (≤ 1 MiB) **before** authentication | `apps/api/calos_api/main.py` (≈ lines 64–103) | Check `Authorization` presence/format and `Content-Length` first; authenticate before streaming |
| SR-L2 | No clock-skew leeway on `iat`/`nbf`/`issued_at` | `auth.py` (≈ line 135), `verify.py` (≈ lines 188–190) | Configurable small leeway in trust snapshot; boundary vectors |
| SR-L3 | Stale *auth* trust returns `401` (indistinguishable from bad credentials) | `auth.py` (≈ line 80) | Raise a distinct operational error → `503` and alert |
| SR-L4 | Invalid `pattern` or `required` not in `properties` not rejected at registration; `re.error` would escape as an unmapped exception | `schema.py` (`_check_schema`, ≈ line 104) | Compile patterns and cross-check `required` at registration; map `re.error` |
| SR-L5 | Documentation is stale: `PHASE0B_REPORT` says hardening "awaits a new CI run" but CI on the head commit passed; PR still draft | `docs/PHASE0B_REPORT.md` | Update evidence line with run IDs `41394734344` / `41394741209` |
| SR-L6 | `provenance_status ∈ {synthetic_demo, authored}` differs from the specified `{synthetic_demo, draft, verified, approved}` | `schemas/package-manifest/v1.schema.json` | Align with `07 §5` (decision D-09) before the manifest is released outside tests |
| SR-L7 | `app = create_app(_identity_from_environment())` runs at import time | `apps/api/calos_api/main.py` (≈ line 124) | Use an app factory (`uvicorn --factory`) so imports have no environment side effects |

## 4. Compliance review against project rules

| Rule | Assessment |
|---|---|
| AGENTS §2.1 no invented metrology | ✔ none present |
| §2.2 simulation not calibration | ✔ receipts carry `simulated` and `non_operational` constants |
| §2.3 No-Code boundary | ✔ verifier is kind-agnostic; no vendor/model strings |
| §2.4 safety outside editable content | ✔ no safety kinds handled; AHL channel untouched |
| §2.5/2.6 no free SCPI; central never talks to instruments | ✔ no transport imports in `apps/api`; **note:** a VISA/simulator package split is still needed (F-18) |
| §2.7 immutability | ✔ nothing written |
| §2.8 decimals | ✔ floats rejected at parse; canonical form integer-only |
| §2.9 determinism | ✔ clock injected; no randomness in library code |
| §2.10 secrets | ✔ keys only in tests, in memory; no secret in logs |
| §2.11 tenant isolation | ◐ equality check only; RLS not exercised (SR-M12) |
| §2.12 baseline stack | ◐ PyJWT/`cryptography` added within E6 but not recorded (SR-M10) |
| §2.13 Test/Production separation | ◐ identity checks strong; `production_rehearsal` naming (SR-M3) |
| §2.14 no role bypass | ✔ no bypass path |
| ADRs untouched | ✔ no `docs/adr/*` change; Proposed ADRs not treated as ratified |
| Architecture contracts | ✔ import-linter extended, not weakened |

## 5. Fail-closed behaviour matrix (as verified)

| Condition | Observed result | Verified how |
|---|---|---|
| No verifier configured | `503 VERIFIER_UNAVAILABLE` | Unit test + CI Compose check (CI-reported) |
| Missing/forged/expired/unprivileged token | `401`/`403` | Unit tests; probes for `alg=none`, HS256 confusion |
| Wrong deployment / environment / tenant | `403 DEPLOYMENT_MISMATCH` / `FORBIDDEN` | Unit tests |
| Tampered content / manifest / signature | `422 PACKAGE_DIGEST_MISMATCH` / `RELEASE_ISSUER_UNTRUSTED` / `PACKAGE_SIGNATURE_INVALID` | Unit tests |
| Unknown schema/keyword | `SCHEMA_UNKNOWN` / `SCHEMA_KEYWORD_UNSUPPORTED` | Unit test + probe |
| Oversize/duplicate key/float/deep JSON | `413` / `PACKAGE_*` | Unit tests |
| Stale or revoked trust (as supplied) | `503` / `422` | Unit tests |
| **Replay, over-long token, over-long package validity** | **Accepted** | Probes — see SR-H1/H2/M5 |

## 6. Required corrections, by gate

| When | ID | Action | Files | Needs decision? |
|---|---|---|---|---|
| **Before merging PR #1** (cheap, no ADR) | R-1 | Add the missing negative tests (SR-M9 items 1–5, 7–9) | `tests/security/test_package_verification.py`, `tests/unit/test_package_parser.py` | No |
| | R-2 | Update `PHASE0B_REPORT` evidence (SR-L5) and state that replay/lifetime/validity bounds are **not** enforced | `docs/PHASE0B_REPORT.md` | No |
| | R-3 | Record SR-H1–H3 and SR-M3 as open gating risks in `PHASE0C_PROPOSAL` | `docs/PHASE0C_PROPOSAL.md` | No |
| **Before Phase 1A starts** | R-4 | Extend schema validator subset (SR-M2) and settle `pattern` semantics (SR-M1) | `packages/py/calos_metadata/calos_metadata/schema.py`, `schemas/*`, `tools/codegen.py`, tests | Dialect choice |
| | R-5 | Decide environment-kind naming (SR-M3) | `calos_domain/deployment.py`, manifest schema, `main.py` | **Yes (ADR-0024 alignment)** |
| | R-6 | Split `calos_security` / `calos_trust` (SR-M11); add contracts | `packages/py/*`, `.importlinter` | No |
| | R-7 | Redesign lifecycle ports against the contract (SR-M6) | `calos_metadata/lifecycle.py` | No (ports only) |
| | R-8 | Permission/endpoint/error alignment (SR-M7, SR-M8) | `main.py`, `verify.py`, `API_CONTRACT`, `GOVERNANCE` | **Yes (D-14)** |
| | R-9 | ADR-0022 addendum + dependency/licence/SBOM CI (SR-M10) | `docs/adr/0022…` (addendum), workflow | **Yes (owner)** |
| **Before enabling the verifier outside tests / before any import** | R-10 | Token lifetime cap, `jti`, `PermissionResolver` (SR-H1) | `auth.py`, `verify.py` | ADR-0014 |
| | R-11 | Replay ledger + monotonic sequence (SR-H2) | manifest schema, `verify.py`, new port | ADR-0004 |
| | R-12 | Signed, versioned trust metadata with rollback protection (SR-H3); domain-separated signatures (SR-M4); validity bounds (SR-M5); issuer scoping (SR-M12) | `calos_trust` | **ADR-0004 ratification** |
| | R-13 | Authenticate before reading body; leeway; stale-auth `503`; schema registration checks (SR-L1–L4, L7) | `main.py`, `auth.py`, `schema.py` | No |

## 7. Compatibility with the proposed Phase 1 Application Builder
See [15 — Architecture integration matrix](15_ARCHITECTURE_INTEGRATION_MATRIX.md). In short: the strict parser, canonical digest, deployment checks and fail-closed posture are **reusable as-is**; the schema validator subset, lifecycle ports, environment naming, permission naming and package boundary need the corrections above before S1; the single-item verification envelope is **not** the `.calapp` closure format and must be extended (not replaced) in S1/S7.

## 8. Items for human decision arising from this review
D-14 (permission name), D-24 (trust-metadata design owner for ADR-0004), D-25 (environment-kind naming), D-26 (ADR-0022 addendum / library approval) — see [11](11_DECISIONS_REQUIRED.md). No ADR status was changed by this review.
