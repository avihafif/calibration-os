# 15 — Architecture integration matrix

| | |
|---|---|
| Status | Proposal. Part A maps what Phase 0B delivered (PR #1, head `b134cca`) onto the Phase 1 design. Part B verifies that the Phase 1 package is consistent with the approved architecture and records every deviation it *proposes* (none is applied). Part C lists ADR dependencies per slice. |
| Legend | **Reuse** = adopt as is · **Extend** = keep, add capability · **Rework** = change before dependent work · **Defer** = not needed yet · Gate = review item in [14](14_PHASE0B_SECURITY_REVIEW.md) |

## Part A — Phase 0B assets → Phase 1

| # | Phase 0B asset (PR #1 path) | Phase 1 consumer | Fit | Action | Gate / slice |
|---|---|---|---|---|---|
| A1 | `calos_domain/deployment.py` `DeploymentIdentity` | Frame badges (03 §2), tokens, manifests, journals | Extend | Resolve `production_rehearsal` vs `production` naming | SR-M3 / R-5 · S0 |
| A2 | `calos_metadata/canonical.py` (RFC 8785, ints ≤ 2^53, no floats) | Content digests (NO_CODE §4.2), approvals-on-digest, `.calapp` | **Reuse** | Add shared Python↔TS vectors and TS implementation | WP-1A-0 · S1 |
| A3 | `calos_metadata/schema.py` fail-closed validator subset | Registry validation, schema-driven inspector | **Rework** | Extend keywords (`x-calos-editor`, `$defs/$ref`, `oneOf`, `const`, bounds, `uniqueItems`); settle `pattern` semantics; registration checks | SR-M1/M2/L4 / R-4 · before 1A |
| A4 | `SchemaRegistry` + `catalog/kinds.json` | Kind registry (07 §8) | Extend | Add `change_classes`, `availability`, designer binding; reject incomplete entries | WP-1A-2 |
| A5 | `calos_metadata/package.py` `PackageParser` (size/depth/node caps, duplicate keys, closed envelope) | `.calapp` / Release Package import (09) | **Reuse strictness**, Extend format | Multi-item ZIP closure with per-file digests, media, `requires`, `intended_modes`, `sequence`; keep strict-parse rules | S1 (Test import), S7 |
| A6 | `schemas/package-manifest/v1` (single-item envelope) | `ApplicationManifest` / `release_manifest.json` | Extend | New manifest version for closure; add `sequence`; align `provenance_status` with 07 §5; keep v1 as *item attestation* | SR-H2/L6 · S1/S7 |
| A7 | `calos_security/verify.py` `PackageVerifier` + trust snapshots | Production import verification (09 §5), Trusted Release Issuers | Rework → Extend | Move to `calos_trust`; signed, versioned trust metadata; replay ledger; validity bounds; domain-separated signatures; issuer scoping | SR-H2/H3/M4/M5/M11/M12 · before any import |
| A8 | `calos_security/auth.py` `JwtAuthenticator` | S0 authentication | Rework → Extend | Lifetime cap, `jti`, `PermissionResolver`, JWKS/`kid` rotation, station principals, step-up | SR-H1 · S0 (1B) |
| A9 | `calos_metadata/lifecycle.py` ports | S1 metadata engine | **Rework** | Redesign to `API_CONTRACT §2.3` (JSON Patch, `base_revision`, lease, Finding, digest-bound approval with reason/step-up, idempotency, diff/impact); no implementations until ADR-0016 | SR-M6 / R-7 · before 1A |
| A10 | `apps/api/main.py` app + problem+json + correlation IDs | Central API conventions | Extend | App factory; `code` + `errors[]`; status mapping; auth-before-body; contract updates | SR-M7/M8/L1/L7 |
| A11 | `/api/v1/config/packages/verify` | Package inspect (08 A15) / release verification | Extend | Align name/permission with contract | SR-M7 / D-14 |
| A12 | `tools/codegen.py` + generated Py/TS types | `domain-types`, API client | Extend | Support new subset; emit definitions/unions | WP-1A-0 |
| A13 | `tests/security/*`, `tests/unit/test_package_parser.py` | Security regression suite pattern | **Reuse**, Extend | Add missing vectors, fuzz, boundary-time cases | SR-M9 / R-1 |
| A14 | `.importlinter` contracts | Architecture gates | Extend | Add `calos_trust`, engine/driver/simulator/VISA split contracts | SR-M11 · F-18 |
| A15 | CI workflow (Py Linux+Windows, TS, Compose, security vectors, 503 check) | Phase 1 CI | **Reuse** | Add dependency audit/SBOM/licence, Playwright, axe, visual, bundle-exclusion tests | SR-M10 |
| A16 | Compose isolation + Test/rehearsal stacks | Release rehearsal (S7), isolation test AC-ENV-01 | **Reuse** | Unchanged until S7 | — |
| A17 | `fixtures/manufacturer/*`, `schemas/manufacturer/v1` | First kind | Extend | Remove hard-coded `en`+`he` requirement (D-11); add provenance per 07 §5 | F-14 · WP-1A-2 |
| A18 | `apps/web` shell (single `App.tsx`, inline strings) | Builder/Operator/Admin shells | Replace | Foundation per 06; strings to i18n keys | WP-1A-1 |
| A19 | `docs/PHASE0B_*`, `PHASE0C_PROPOSAL` | Decision register | Reuse | Fold open items into [11](11_DECISIONS_REQUIRED.md) | — |
| A20 | Phase 0C proposal's "permitted preparatory work" | Parallel hardening lane | Reuse | Keep CI/dependency/fixture hardening independent of Builder UX | — |

## Part B — Consistency of the Phase 1 package with the approved architecture

### B.1 Project rules (AGENTS §2)
| Rule | Where the Phase 1 package upholds it | Residual risk / note |
|---|---|---|
| 1 No invented metrology | Placeholders and `$input` only throughout 02–10; fixtures `synthetic_demo`; 1A scans for values | Human inputs remain open (11 §2) |
| 2 Simulation ≠ calibration | Banners non-themeable (03 §2, §5); limit-check wording (04B SCR-08); reports locked overlays (SCR-09); 1A sandbox banner (13 §6) | — |
| 3 No-Code boundary | Schema-driven inspector (06 §4); WP-1A-6 proof; capability-matrix CI check; vendor-string lint | Hint vocabulary must stay closed (R-19) |
| 4 Safety outside editable content | Safety Console with read-only AHL band, no override control (SCR-11, P1-AC-SAF-09); approval-path rules | No real AHL (MI-26/33 open) |
| 5 No free SCPI | Command Builder produces named typed operations only (SCR-05b); PR-021; no raw-write node | — |
| 6 Central never talks to instruments | Simulation Lab simulator-only; VISA package split proposed (F-18) | Needs D-15 |
| 7 Immutability | Published versions frozen; synthetic host freezes objects (P1A-AC-32) | Server immutability arrives with 1B |
| 8 Decimals | `QuantityInput` decimal strings (P1A-AC-13); canonical JSON rejects floats | — |
| 9 Determinism | Presentation evaluator limited; authoritative evaluator server-side | — |
| 10 Secrets | No credential UI in 1A; keys never shown (09 §3) | — |
| 11 Tenant isolation | S0 RLS + generated coverage test (P1-AC-IAM-06) | Phase 0B did not exercise RLS (SR-M12) |
| 12 Baseline stack | Dependencies listed for approval, none adopted (06 §9); D-12 | ADR-0022 addendum needed |
| 13 Test/Production separation | Production exposes no Builder (P1-AC-FRM-02, P1A-AC-30); release workflow in S7 | Naming (SR-M3) |
| 14 No role bypass | Toxic-combination/dual-control tests (P1-AC-IAM-03/04); Platform Admin has no approval permission | Hazardous Driver Author role needs D-06 |

### B.2 Precedence and documents
| Check | Result |
|---|---|
| NO_CODE_ARCHITECTURE precedence preserved | ✔ No Phase 1 document contradicts it. Where Phase 1 proposes something the specs do not say (e.g., `media` naming, `.calrel`, `application` permission group, Library tiers) it is labelled a proposal with a decision ID. |
| Existing specs edited? | ✘ None (by design). Recommended edits are in [01 §4](01_SPEC_REVIEW.md#4-recommended-edits-to-existing-documents-not-applied). |
| ADRs edited or reinterpreted? | ✘ None. Per-slice ADR dependencies below; accepted ADRs untouched. |
| Phase labels vs requirements | Conflicts surfaced (F-01, F-02, F-03, F-04) rather than silently resolved. |

### B.3 Deviations the Phase 1 package *proposes* (all require a decision)
| Proposal | Departs from | Decision |
|---|---|---|
| Identity/RBAC/RLS/simulator-enrolment in Phase 1 (S0) | FR-SEC-01/02/03/05 phase labels | D-02 |
| Phase 1A UI-first on Synthetic Host | Roadmap order (backend milestones first) | D-23 |
| Deployment-local Library; marketplace deferred | Assignment wording; roadmap P6 | D-03 |
| Theme editor deferred to P2 | BUILDER §13 "themes (limited tokens)" | D-05 |
| New role bundle (Hazardous Driver Author); `config.approve.ui`; `application` group | GOVERNANCE §2.2 | D-06, D-07 |
| `media` vs `assets`; `.calrel` | PLUGIN_SDK §2.1 | D-18 |
| Additional endpoints/error codes (08 §3–4) | API_CONTRACT | D-20 + owner review |
| `environment_kind` stays `{test, production}` (rehearsal as attribute) | Phase 0A/0B code | D-25 |

## Part C — ADR dependencies by slice

| Slice | Accepted (usable now) | Must be ratified before the slice starts |
|---|---|---|
| 1A (UI-first) | 0003, 0022, 0023, 0024 | 0001, 0015 (+ D-12 dependency approvals) |
| S0 (1B backend) | " | 0001, 0008, 0014, 0015 |
| S1 | " | 0016, 0019, 0004 (export signing) |
| S2 | " | 0017, 0010 |
| S3 | " | 0018 (as amended by 0023), 0013, 0005 (boundary) |
| S4 | " | 0006, 0007 |
| S5 | " | 0011, 0012 |
| S6 | " | 0020 |
| S7 | " | 0021 (as amended by 0024), 0004 |

## Part D — Compatibility of PR #1 with the Phase 1 Application Builder (summary)

| Builder need | PR #1 supports | Gap |
|---|---|---|
| Schema-driven inspector with hints and unions | ✘ validator rejects needed keywords | R-4 |
| Content digests for approvals-on-digest | ✔ canonical + SHA-256 | TS twin + vectors |
| Draft/lease/patch/validate/publish API | ✘ (ports only, mismatched) | R-7, ADR-0016 |
| Deployment identity in UI | ✔ concept | Naming (R-5) |
| Signed export/import of `.calapp` | ◐ single-item verification only | Closure format, replay, trust metadata (R-10…R-12) |
| RBAC/SoD/step-up | ✘ claims-only authn | S0 (1B) |
| Findings contract (code, pointer, fix) | ✘ pointer inside code string | SR-M8 |
| Locale policy (he/en) | ✘ hard-coded in schema | D-11 |
| Frontend foundation | ✘ skeleton | WP-1A-1 |
