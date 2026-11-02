# 12 — Signature-ready packets (nothing signed)

Status: prepared for the designated holder ([11](11_ROLE_DESIGNATION_RECORD.md)). **Outcomes were subsequently recorded by delegation on 2026-11-02 in [13](13_DELEGATED_ARCHITECTURE_SECURITY_LEGAL_RECORD_2026-11-02.md); where they differ from the recommendation (P-6: A5 not accepted) the record governs.** The boxes below are left as originally prepared; use 13 as the authoritative outcome. Evidence for each item: [07](07_PR6_FINAL_REVIEW_VERDICT.md), [08](08_ARCHITECTURE_DECISION_PROPOSALS.md), [09](09_D12_DEPENDENCY_APPROVAL_MATRIX.md), [10](10_WP-1A-1_SCOPED_READINESS_AND_APPROVALS.md).

## How to sign (per packet)
1. Read the linked evidence; choose an outcome.
2. Record it **in a reviewed pull request** by (a) ticking one outcome box below (edit this file) and filling date and evidence link, and (b) where the packet says so, applying the exact status change shown under "If you accept". An approving review/comment on that PR from your account is the evidence link.
3. Do not edit an Accepted ADR afterwards; supersede it.

The dependency packets (P-3…) must be recorded **before** any dependency is added to `package.json`, and WP-1A-1 sub-PRs start only after the packets they depend on ([10 §2](10_WP-1A-1_SCOPED_READINESS_AND_APPROVALS.md)).

---

## P-1 · Architecture owner — GA0-02 (architecture half): scoped Path B
**Recommended: approve** the scope contract of [08 §1](08_ARCHITECTURE_DECISION_PROPOSALS.md): WP-1A-1 only, allowed paths and forbidden areas as listed there; full Gate A0 remains closed.
**If you accept,** add under the PR #8 record's GA0-02 row (in `06_PRODUCT_OWNER_DECISIONS_2026-11-02.md` or a new dated record) the sentence: *"Architecture owner: scoped Path B approved for WP-1A-1 per docs/gate-a0/08 §1; full Gate A0 remains closed."*

| Outcome | ☐ Approved as recommended · ☐ Approved with changes · ☐ Rejected · ☐ Deferred |
|---|---|
| Changes / conditions | |
| Name · role | Avi Hafif · Architecture owner (designated, [11](11_ROLE_DESIGNATION_RECORD.md)) |
| Date · evidence link | |

## P-2 · Architecture owner — PR #6: disposition of H-2 and merge conditions
**Recommended:** record on PR #6: *"H-2 (editor-hint vocabulary) is deferred to GA0-16 and the v1 subset is provisional; accepted for the R-4-only merge. ADR-0025 remains Proposed."* The merge itself is a separate act of yours.

| Outcome | ☐ Deferral accepted · ☐ Not accepted (state what must change first) |
|---|---|
| Name · role · date · evidence link (the comment on PR #6) | Avi Hafif · Architecture owner · |

## P-3 · Architecture owner + Security reviewer — GA0-05 / D-12 dependencies and policy
Rows, pins and evidence: [09](09_D12_DEPENDENCY_APPROVAL_MATRIX.md). Tick per row (recommended outcome in the last column).

| Row | Package @ exact version | Approve | Reject | Defer | Recommended |
|---|---|---|---|---|---|
| R1 | `react-intl@12.1.5` | ☐ | ☐ | ☐ | Approve |
| R2 | `react-router@8.5.0` (library mode only; lint-forbidden APIs per 09) | ☐ | ☐ | ☐ | Approve with conditions (or in-house router) |
| D1 | `vitest@5.0.5` | ☐ | ☐ | ☐ | Approve |
| D2 | `jsdom@30.1.3` | ☐ | ☐ | ☐ | Approve |
| D3 | `@testing-library/react@16.3.3` | ☐ | ☐ | ☐ | Approve (may defer) |
| D4 | `@testing-library/dom@10.4.2` | ☐ | ☐ | ☐ | Approve (with D3) |
| D5 | `@testing-library/user-event@14.6.8` | ☐ | ☐ | ☐ | Approve (may defer) |
| D6 | `@playwright/test@1.64.1` (CI-only pinned browser download) | ☐ | ☐ | ☐ | Approve with condition |
| Policy | exact pins, ≥ 14-day-old releases, lifecycle scripts off, Node ≥ 22.22.2, `pnpm audit` + OSV + `pnpm sbom` in CI (09 §1) | ☐ | ☐ | ☐ | Approve |
| Vite | raise declared floor to `^8.3.5` | ☐ | ☐ | ☐ | Approve |

Name · role · date · evidence link: Avi Hafif · Architecture owner **and** Security reviewer (designated) · ____ · ____

## P-4 · Legal approver — MPL-2.0 for `axe-core` and `@axe-core/playwright`
Facts: MPL-2.0 (file-level weak copyleft); used **unmodified, development-time only**, not distributed in release artefacts, listed in the dev SBOM; MPL-2.0 is already present transitively (`lightningcss` via Vite). No alternative engine was evaluated; without an accessibility engine P1A-AC-10 cannot be verified. *Technical reading, not legal advice.*
**Recommended: accept** for D7 `axe-core@4.14.0` and D8 `@axe-core/playwright@4.14.0` under these conditions only.

| Outcome | ☐ Accepted under the stated conditions · ☐ Rejected (alternative needed) · ☐ Deferred (blocks sub-PR 1e only) |
|---|---|
| Name · role · date · evidence link | Avi Hafif · Legal approver (designated; not a qualified legal opinion) · ____ · ____ |

## P-5 · Architecture owner — ADR-0026 (frontend dependency addendum)
**Recommended: accept** after P-3/P-4 are recorded, with the table limited to the rows actually approved.
**If you accept,** in `docs/adr/0026-frontend-dependencies-addendum.md` replace the Status line with:
`Status: **Accepted** · Date: <date> · Deciders: Avi Hafif (Architecture owner, designated 2026-11-02; Security reviewer; Legal approver for MPL-2.0) · Amends (additively): ADR-0022` — remove the "Not approved" notice, delete table rows you did not approve, and add the ADR-0026 row to `docs/adr/README.md` (after PR #6 lands).

| Outcome | ☐ Accepted · ☐ Accepted with changes · ☐ Rejected · ☐ Deferred |
|---|---|
| Date · evidence link | |

## P-6 · Architecture owner — ADR-0001 (GA0-09)
**Recommended: accept with amendments A1–A5.**
**If you accept,** in `docs/adr/0001-modular-monorepo-boundaries.md` set: `Status: Accepted · Date: <date> · Deciders: Avi Hafif (Architecture owner, designated)`; rename "## Proposed amendments (…)" to "## Amendments (accepted <date>)" and delete its first two explanatory sentences. Then (separate PR) apply the follow-up edits listed in [08 §3](08_ARCHITECTURE_DECISION_PROPOSALS.md): ARCHITECTURE §6/§6.1 TS rules, `docs/phase1a/07 §2.3(5)`, `docs/integration/01 §3`, `docs/procedure-designer/03`. Also state the **CI time budget** for A5 (a number only you can supply): ______

| Outcome | ☐ Accept with A1–A5 · ☐ Accept as originally written · ☐ Revise · ☐ Reject |
|---|---|
| Date · evidence link | |

## P-7 · Architecture owner — ADR-0015 (GA0-10)
**Recommended: accept with amendments B1–B6.**
**If you accept,** in `docs/adr/0015-i18n-and-rtl.md` set `Status: Accepted · Date: <date> · Deciders: Avi Hafif (Architecture owner, designated); content owner for the glossary (not yet named)`; rename the amendments heading as in P-6. B3's finding-key namespace stays subject to GA0-16.

| Outcome | ☐ Accept with B1–B6 · ☐ Accept as originally written · ☐ Revise · ☐ Reject |
|---|---|
| Date · evidence link | |

## P-8 · Product owner — ADR-0025 confirmation (GA0-02b)
ADR-0025 is **Proposed** (corrected by PR #6). It describes the restricted ASCII grammar actually enforced; the manifest-boundary behaviour is verified unchanged (36,000-string differential). **Recommended: confirm** — or leave Proposed if you want an independent confirmer.
**If you confirm,** change the ADR-0025 Status line (it lives in PR #6, so do this in or right after that PR) to `Status: Accepted · Date: <date> · Decider: Avi Hafif (product owner)`, and update the ADR index row.

| Outcome | ☐ Confirmed · ☐ Remains Proposed · ☐ Revise |
|---|---|
| Date · evidence link | |

## Not covered by any packet (still no authority named)
Fonts and their licences (GA0-06b), Hebrew terminology review (MI-31/Q-15), D-11, D-18, D-21, GA0-16 (before WP-1A-2/3), metrology/safety/quality items, trust/identity provisioning, Production. They are not WP-1A-1 blockers except as stated in [10](10_WP-1A-1_SCOPED_READINESS_AND_APPROVALS.md).
