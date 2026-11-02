# Phase 1A — enterprise UX/UI system and interactive prototype (index)

| | |
|---|---|
| Status | **Proposal for human review.** Design deliverables only: new documents under `docs/phase1a/` and a self-contained, non-operational prototype under `design/phase1a-prototype/`. No application source, schema, catalog, CI workflow, ADR or existing document was modified. |
| Stacked on | PR #2 (`feature/phase-1-design`) — preserved unchanged; this branch (`feature/phase-1a-ux-prototype`) bases on it so the two PRs stay separate and reviewable. |
| Independent of | Codex's work (PR #1, `feature/phase0b-secure-metadata`): none of its files are touched. Its conditional plan `docs/PHASE1A_IMPLEMENTATION_PLAN.md` is reconciled in [05 §4](05_GATE_A0_APPROVAL_PACKAGE.md#4-reconciliation-with-codexs-conditional-phase-1a-plan). |
| Rules | No invented metrology, approvals, role holders, safety limits or supplier permissions. All Hebrew text is an unreviewed placeholder. Prototype data is synthetic; safety/simulation/deployment indicators are non-themeable. |

## Deliverables (mission §10)

| # | Deliverable | Where |
|---|---|---|
| 1 | Enterprise Phase 1A interactive UX prototype | [`design/phase1a-prototype/`](../../design/phase1a-prototype/index.html) · how to run: [`design/README.md`](../../design/README.md) · screenshots: [`screenshots/`](screenshots/) |
| 2 | Finalized visual design system | [01 — Design system](01_DESIGN_SYSTEM.md) |
| 3 | Detailed No-Code Builder UX specification | [02 — Builder UX](02_BUILDER_UX_SPEC.md) |
| 4 | Screen-by-screen implementation guide | [02 §3–§5](02_BUILDER_UX_SPEC.md) + [07 §3](07_CODEX_HANDOFF.md#3-screens-to-implement-final) |
| 5 | Generic metadata-driven editor design | [03 — Metadata → UI binding](03_METADATA_UI_BINDING.md) |
| 6 | Gate A0 decision and approval package | [05 — Gate A0](05_GATE_A0_APPROVAL_PACKAGE.md) |
| 7 | Acceptance-test and usability checklist | [06 — Tests & usability](06_TEST_AND_USABILITY_CHECKLIST.md) |
| 8 | Codex-ready implementation handoff | [07 — Codex handoff](07_CODEX_HANDOFF.md) |
| 9 | Pull request containing design deliverables only | This PR |
| — | Design validation (personas, accessibility, keyboard, responsive, RTL) | [04 — Design validation](04_DESIGN_VALIDATION.md) |

## What was verified (and what was not)
* **Verified by running it:** prototype loads with zero console errors across all routes; full draft → submit → (blocked self-approval) → approve → publish (synthetic) → compare lifecycle; wizard; Hebrew/RTL; dark; phone width; 12 dependency-free design-rule checks pass; in-page accessibility audit over 36 page states clean after fixes.
* **Not verified:** no user testing; no screen-reader or real-device testing; no performance measurement with realistic data; Hebrew wording unreviewed; fonts not bundled (system stack used); CI integration of any of this is *future work* (the checks are dependency-free so Codex can port the rules).

## Open items needing humans
Gate A0 decisions D-23, D-27, D-28, D-29, D-32, D-13, D-18, D-21, D-11, D-12 and ADR-0001/0015 ([05](05_GATE_A0_APPROVAL_PACKAGE.md)); later-gate authorities (metrology/safety/quality) listed in 05 §2.3; Q-15/MI-31 for Hebrew.

## Traceability summary
FR-NC-01/02/03/05 · FR-META-01/02/03/05/06 · FR-GOV-01/02/03 (UX parts) · FR-UIB-03 · FR-UI-02/05/06 · AC-NC-01, AC-NC-09 (model path) · AC-UX-01…06, 09 · P1A-AC-01…64 · NO_CODE_ARCHITECTURE B-1…B-7 — mapping in [07 §10](07_CODEX_HANDOFF.md#10-traceability).
