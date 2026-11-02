# Gate A0 readiness — Phase 1A Synthetic Host Builder

Status: **not green**. Prepared against the merged [Phase 1A plan](phase1/13_PHASE1A_PLAN.md)
and [decision register](phase1/11_DECISIONS_REQUIRED.md). PRs #1–#5, #7 and
#8 have merged; PR #6 remains under review. The [delegated product-owner
record](gate-a0/06_PRODUCT_OWNER_DECISIONS_2026-11-02.md) supplies only the
product-scope outcomes it names. This checklist does not approve any other
decision or authorize Builder work.

| Gate | Required evidence | Current state |
| --- | --- | --- |
| A0-1 | Phase 0B PR #1 owner-reviewed and merged, or written agreement to branch from its head | PR #1 merged and product owner accepted it as a verification-only baseline ([GA0-01](gate-a0/06_PRODUCT_OWNER_DECISIONS_2026-11-02.md)); operational activation gates remain open |
| A0-2 / R-4 | Extended fail-closed schema validator and codegen with conformance tests; `pattern` dialect decided | PR #6 open. H-1/M-1/M-3/M-5 corrections and merged-main CI are documented in the [closure matrix](PHASE1A_R4_REVIEW_CLOSURE.md); independent final review remains. ADR-0025 is [Proposed](adr/0025-json-schema-pattern-semantics.md) pending explicit owner approval |
| A0-2 / R-7 | Lifecycle Protocols aligned with `API_CONTRACT §2.3` and Findings contract; no write implementation | PR #4 merged. See [R-7 contract report](PHASE1A_R7_LIFECYCLE_CONTRACTS.md) |
| A0-3 | Named outcomes for D-23, D-11, D-12, D-13, D-18, D-21 | D-23 approved; D-13 palette/tokens approved provisionally **only**. D-11, D-12, D-18, D-21 and D-13 font/legal sign-off remain open ([product-owner record](gate-a0/06_PRODUCT_OWNER_DECISIONS_2026-11-02.md)) |
| A0-4 | ADR-0001 and ADR-0015 ratified or superseded by named owners | Both Proposed |
| A0-5 | Owner acknowledges he/en string ownership and `needs_review` markers while Q-15/MI-31 remain open | Avi Hafif acknowledged product-side coordination ([GA0-11](gate-a0/06_PRODUCT_OWNER_DECISIONS_2026-11-02.md)); specialist language/terminology review remains open |
| Design integration | PRs #2/#3/#5 integrated; conflicts with `NO_CODE_ARCHITECTURE`/`ARCHITECTURE` resolved | PRs #2/#3/#5 merged; D-32 is product-owner approved as a visual reference only. UX/architecture review and [H-2 vocabulary reconciliation](PHASE1A_EDITOR_HINT_DECISION.md) remain open |

**Sequencing decision remains joint:** `13_PHASE1A_PLAN.md §3` requires R-4
before full A0, while §4 assigns it to WP-1A-0 after A0. The product owner
endorsed a scoped WP-1A-1 Path B in [GA0-02](gate-a0/06_PRODUCT_OWNER_DECISIONS_2026-11-02.md),
but architecture co-approval is not recorded. Full A0 still requires R-4 merge;
this report does not treat the endorsement as an architecture approval.

## R-4 schema validator — PR #6 under final review

The dedicated PR uses the existing `schema.py`/`codegen.py`; JSON Schema remains
the source of truth. The original prerequisite scope was:

1. Implement the proposed [ADR-0025](adr/0025-json-schema-pattern-semantics.md)
   Draft 2020-12 search semantics with explicit cross-language absolute anchors.
   The code and manifest patterns require explicit owner approval before merge.
2. Validate a closed, versioned provisional `x-calos-editor` hint subset.
   The authoritative Builder vocabulary remains the explicit
   [H-2 decision](PHASE1A_EDITOR_HINT_DECISION.md); unresolved IDs fail closed.
3. Support only the approved required subset: local `$defs/$ref` with cycle
   detection, exactly-one `oneOf`, `const`, integer minimum/maximum and
   `uniqueItems`. Keep unrecognized keywords, open objects, remote references
   and unsupported unions fail-closed. Reject malformed regex and invalid
   `required` entries during schema registration.
4. Extend Python/TypeScript codegen for those exact constructs and add valid
   and negative fixture corpora. A differential test against a reference
   validator awaits its dependency/licence approval (D-12/D-26).

The [R-4 report](PHASE1A_R4_SCHEMA_ENGINE.md) and [review closure matrix](PHASE1A_R4_REVIEW_CLOSURE.md)
give actual implementation and test status. P1A-AC-01…04 are not claimed fully
complete: a shipped TypeScript structural validator remains future work. No
new metadata kind or Builder screen belongs in this prerequisite PR.

## R-7 lifecycle contract — PR #4 merged

The `calos_metadata.lifecycle` Protocols remain unimplemented. PR #4 aligned
their types with `API_CONTRACT §2.3` and the shared `Finding` contract:

- Use a scoped tenant/actor context supplied by the host port, never a
  caller-supplied `tenant_id` argument that a draft method can override.
- Draft create/read, lease/takeover, JSON Patch with `base_revision`, fork,
  merge and atomic changesets return versioned revision metadata.
- Validation returns structured findings (`code`, `severity`, JSON pointer,
  localized message key/params, optional fix, stage), not strings.
- Submit freezes a digest-bound review snapshot; approve/reject require the
  asserted digest, reason, role/step-up proof and idempotency key; actual SoD
  enforcement remains a server responsibility in a later approved phase.
- Publish accepts an idempotency key and minimum SemVer/change-class proposal;
  output is an immutable version reference. Diff/impact have read-only ports.
- Keep release-package building/import separate from single-item verification
  and avoid any concrete write implementation before ADR-0016/0021.

Acceptance: static type/contract checks prove that consumers cannot omit
revision, digest, reason or idempotency context. No endpoint, table, permission,
approval or Production workflow is implemented by this port-only PR.

## Human decisions and architecture corrections

| Needed for | Human approval or correction |
| --- | --- |
| Phase 1A scope | D-23 is product-owner approved for a Test-only in-memory Synthetic Host. D-13 palette/tokens are provisionally approved; font/legal sign-off is open. D-11 locale/schema policy, D-12 dependencies with licences/CSP, D-18 media/Release naming and D-21 lease defaults remain open. |
| Architecture | Ratify ADR-0001 module boundaries and ADR-0015 i18n/RTL. D-25 resolves `{test, production}` versus `production_rehearsal` before new signed schemas embed it. R-6 package split and R-8 permission/error alignment need their own review before dependent backend work. |
| Identity and trust | D-14 least-privilege `package.verify` decision; D-24/ADR-0004 trust metadata owner and design; ADR-0014 identity policy; D-26/ADR-0022 dependency addendum. No token/issuer/trust activation until SR-H1–H3 are closed. |
| Later governed persistence | ADR-0008 RLS, ADR-0016 lifecycle, ADR-0019 metadata tests and ADR-0021 distribution; MI-30 approval matrix and MI-34 named role holders. |
| Authored language/metrology | Avi Hafif coordinates product-side he/en UI strings; Q-15 qualified translation owner, MI-31 reviewed Hebrew terminology, metrology MI inputs and Q-08 vendor rights stay open. The Synthetic Host uses only labelled synthetic data and no metrology numbers. |

## Proposed first Phase 1A PR

R-7 is merged and R-4 is PR #6 under final review. Full Gate A0 (Path A)
requires R-4 merged; the product owner endorsed a scoped WP-1A-1 Path B, but
architecture co-approval is still open. After the applicable gate is green,
create a **new** branch from the merged, approved baseline for **WP-1A-1
only**: `packages/ts/i18n`,
`packages/ts/ui-kit`, app frame/routing, bilingual messages, protected
simulation/deployment badges, accessible reusable controls, theme/contrast
tokens, and Playwright/axe/visual test harness in CI. Acceptance is
P1A-AC-05…14 with no real login, persistence, signing, publish, instruments or
Builder screen. D-12 dependency approval must be recorded before adding
packages; D-13 font/legal approval is needed before bundling fonts. Deliver
WP-1A-2…7 as separate PRs under the [Phase 1A plan](phase1/13_PHASE1A_PLAN.md)
after their own gates are closed.
