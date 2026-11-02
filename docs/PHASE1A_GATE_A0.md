# Gate A0 readiness — Phase 1A Synthetic Host Builder

Status: **not green**. Prepared against the merged [Phase 1A plan](phase1/13_PHASE1A_PLAN.md)
and [decision register](phase1/11_DECISIONS_REQUIRED.md). PRs #1–#5 have
merged; their design proposals are not approvals. PR #6 remains under review.
This checklist does not approve any decision or authorize Builder work.

| Gate | Required evidence | Current state |
| --- | --- | --- |
| A0-1 | Phase 0B PR #1 owner-reviewed and merged, or written agreement to branch from its head | PR #1 merged |
| A0-2 / R-4 | Extended fail-closed schema validator and codegen with conformance tests; `pattern` dialect decided | PR #6 open. ADR-0025 is [Proposed](adr/0025-json-schema-pattern-semantics.md) pending verifiable owner confirmation; H-1/M-1/M-3/M-5 corrections and CI require review |
| A0-2 / R-7 | Lifecycle Protocols aligned with `API_CONTRACT §2.3` and Findings contract; no write implementation | PR #4 merged. See [R-7 contract report](PHASE1A_R7_LIFECYCLE_CONTRACTS.md) |
| A0-3 | Named outcomes for D-23, D-11, D-12, D-13, D-18, D-21 | All blank in PR #2's register |
| A0-4 | ADR-0001 and ADR-0015 ratified or superseded by named owners | Both Proposed |
| A0-5 | Owner acknowledges he/en string ownership and `needs_review` markers while Q-15/MI-31 remain open | No named acknowledgement recorded |
| Design integration | PRs #2/#3/#5 integrated; conflicts with `NO_CODE_ARCHITECTURE`/`ARCHITECTURE` resolved | PRs #2/#3/#5 merged as design proposals; Gate A0 approvals and H-2 vocabulary reconciliation remain open |

**Sequencing correction required:** `13_PHASE1A_PLAN.md §3` requires R-4 to
be merged *before* A0, while §4 assigns R-4 to WP-1A-0 *after* A0. The owner
must classify WP-1A-0 as an A0 prerequisite (recommended) or amend the gate.
This report does not silently treat either sequence as approved.

## R-4 schema validator preparation — proposed prerequisite PR

Work from the existing `schema.py`/`codegen.py` rather than replacing the
registry. The schema remains the source of truth. Scope a dedicated PR to:

1. Apply [ADR-0025](adr/0025-json-schema-pattern-semantics.md): Draft 2020-12
   search semantics with explicit cross-language absolute anchors. Update the
   manifest patterns and prove Python/TS parity with conformance vectors.
2. Validate a closed, versioned `x-calos-editor` hint vocabulary, including
   localized message keys, widget ID, group/order and quick-fix references.
   Reject unknown hints at registration and never execute hint content.
3. Support only the approved required subset: local `$defs/$ref` with cycle
   detection, exactly-one `oneOf`, `const`, integer minimum/maximum and
   `uniqueItems`. Keep unrecognized keywords, open objects, remote references
   and unsupported unions fail-closed. Reject malformed regex and invalid
   `required` entries during schema registration.
4. Extend Python/TypeScript codegen for those exact constructs, add valid and
   negative fixture corpora and a differential test against a reference
   validator **after** its dependency/licence approval (D-12/D-26).

Acceptance: [P1A-AC-01…04](https://github.com/avihafif/calibration-os/blob/feature/phase-1-design/docs/phase1/13_PHASE1A_PLAN.md#5-phase-1a-acceptance-criteria).
No new metadata kind or Builder screen belongs in this prerequisite PR.

## R-7 lifecycle contract preparation — proposed prerequisite PR

The current `calos_metadata.lifecycle` Protocols have no implementation.
Redesign only their types against `API_CONTRACT §2.3` and the proposed shared
`Finding` in Phase 1 `07_METADATA_SCHEMAS.md §2.1`:

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
| Phase 1A scope | D-23 approves the UI-first Synthetic Host; D-11 locale/schema policy; D-12 frontend and test dependencies with licences/CSP; D-13 palette/font rights; D-18 media/Release naming; D-21 simulated lease defaults |
| Architecture | Ratify ADR-0001 module boundaries and ADR-0015 i18n/RTL. D-25 resolves `{test, production}` versus `production_rehearsal` before new signed schemas embed it. R-6 package split and R-8 permission/error alignment need their own review before dependent backend work. |
| Identity and trust | D-14 least-privilege `package.verify` decision; D-24/ADR-0004 trust metadata owner and design; ADR-0014 identity policy; D-26/ADR-0022 dependency addendum. No token/issuer/trust activation until SR-H1–H3 are closed. |
| Later governed persistence | ADR-0008 RLS, ADR-0016 lifecycle, ADR-0019 metadata tests and ADR-0021 distribution; MI-30 approval matrix and MI-34 named role holders. |
| Authored language/metrology | Q-15 owner, MI-31 reviewed Hebrew terminology, metrology MI inputs and Q-08 vendor rights stay open. The Synthetic Host uses only labelled synthetic data and no metrology numbers. |

## Proposed first Phase 1A PR

Recommended sequence: deliver R-4/WP-1A-0 and R-7 as **separate prerequisite
PRs** and merge them before Gate A0. After A0 is green, create a **new** branch
from the merged, approved baseline for **WP-1A-1 only**: `packages/ts/i18n`,
`packages/ts/ui-kit`, app frame/routing, bilingual messages, protected
simulation/deployment badges, accessible reusable controls, theme/contrast
tokens, and Playwright/axe/visual test harness in CI. Acceptance is
P1A-AC-05…14 with no real login, persistence, signing, publish, instruments or
Builder screen. The dependency and font approvals D-12/D-13 must be recorded
first. Deliver WP-1A-2…7 as separate PRs following the approved [13 plan](https://github.com/avihafif/calibration-os/blob/feature/phase-1-design/docs/phase1/13_PHASE1A_PLAN.md#4-work-packages).
