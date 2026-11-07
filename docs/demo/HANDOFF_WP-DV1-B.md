# HANDOFF_WP-DV1-B.md — first Demo V1 code package (PR-1, pure model and fixtures)

| | |
|---|---|
| Status | **Proposal, documentation only.** It is a briefing, not an assignment: it starts nothing and grants no approval. The owner assigns the package manually (H-1 style) and names the independent reviewer (DV-DEC-09, H-7). |
| Source of truth | [`DEMO_V1_PLAN.md`](DEMO_V1_PLAN.md) (merged in PR #38, `5c3b385`). This file adds only the current gate state and an updated assignment text. If the two differ, the plan wins; report the difference instead of choosing. |
| Companion files | `CONTENT_DECK.md`, `FIXTURES_SPEC.md`, `TEST_PLAN.md` and `OWNER_CHECKLIST.md` are in draft PR #39 and are referenced here by name; they are not links because they are not on `main` yet. |
| Written by | The same agent family that wrote the plan, so a human or different reviewer should read it. |
| Date | 2026-11-07, on `main` at `5c3b385`. |

## 1. What WP-DV1-B is, and what it is not

WP-DV1-B is **PR-1 of three**: the pure TypeScript model behind the demonstration. It has **no UI, no route and is not imported by the app**, so nothing visible ships with it. The five demonstration parts of issue #37 arrive as follows.

| Demonstration part | Data and logic (PR-1, this package) | Screen (PR-2 widgets, PR-3 integration) |
|---|---|---|
| Operations dashboard | KPI and status selectors over the store | `demo-dashboard` |
| Synthetic work orders and instruments | Frozen fixtures: 6 customers, 8 assets, 10 work orders | `demo-work` |
| Job selection and read-only procedure preview | 3 procedure descriptors, compatibility and preflight tables, start rules (plan DV-FN-04) | `demo-job` |
| Scripted simulation console | Scenario `SIM-SCN-001`, reducer, 15-event golden sequence | `demo-run` |
| Watermarked non-official report | Report selector from a completed run (`DEMO-RPT-0001`, never persisted) | `demo-report` |

All content stays Test-only, synthetic and in memory. Unit `su` only. Every metrology slot is an `Input required` marker (MI-nn); the limit check reads "not evaluated".

## 2. Gate state (facts from `main`; none is an approval)

| Prerequisite | State | Evidence |
|---|---|---|
| Plan and wireframes on `main` | Done | PR #38 merged as `5c3b385` |
| DV-DEC-01 to -09 defaults | Recorded, with limits | Plan section 18.1 |
| N1 (strict Unicode display) | Merged | PR #36, `e47b961` |
| **A2** (WP-1A-1e-A2) | **Not merged; not assigned** | `docs/wp-1a-1e/SEQUENCE_AND_A2.md`. Needs D-A2-1 to D-A2-3, optionally H-4a, a named reviewer. Under strict sequence P0, PR-1 waits for it. The owner may instead record a reviewed sequence change (P1: PR-1 is developed beside A2 because its paths are disjoint, and merged only after it) |
| Fixture values and structure approved | **Open** | `OWNER_CHECKLIST.md` section A (FX-RC-01..07, FX-Q2..Q6). Needed before PR-1 |
| Fictional names approved | **Open** | `OWNER_CHECKLIST.md` section B |
| Content deck and test plan accepted | **Open** | `OWNER_CHECKLIST.md` sections C and D (Hebrew stays `needs_review`) |
| Named independent reviewer and human approver | **Open** | DV-DEC-09 |
| Owner's explicit assignment of PR-1 | **Open** | H-1 style |
| DV-DEC-05 exact bundle-gate diff | Open; **not needed for PR-1**, needed for PR-3 (R5) | Plan section 18.1 |

The assignment text in plan Appendix C says the branch "already contains N1 and A2". That is true only once A2 is merged; check the real state of `main` at assignment time.

## 3. Scope and boundaries

- **Allowed paths (exhaustive):** `apps/web/src/demo/model/**` including `*.test.ts`, and `docs/demo/EVIDENCE_PR1.md`.
- **Forbidden:** any other file; `package.json` and the lockfile (no dependency); `.github/**`; `tools/**` (the sentinel is PR-3); existing tests, lint rules and gates; schemas; ADRs; `App.tsx`, routes and `packages/**`.
- **Tests** are `*.test.ts` files under the path above, which Vitest already discovers. The evidence reports discovered and executed file counts. No `*.test.tsx` here; there is no UI.
- **Hard rules** (`AGENTS.md` section 2, plan section 2): no real units, limits, tolerances, test points, ranges, standards, uncertainty or approval wording; decimals as strings, no float arithmetic; no clock, randomness, timers, storage or network; ids match `^(SYN|SIM|DEMO)-[A-Z]+-[0-9]{3,4}$`; generic fictional names; every Hebrew value carries `heStatus: "needs_review"`.

## 4. What to build (suggested shape, from the specification)

| Part | Specification | Tests |
|---|---|---|
| Types and conventions | `FIXTURES_SPEC.md` sections 3 and 4 | TC-FX |
| Frozen fixtures (owner-approved values only) | sections 5 and 7 | TC-FX: one case per guard FX-G-01..15 (section 9) |
| Scenario `SIM-SCN-001`: 11 counted steps plus implicit `end` | section 6 | TC-MODEL, including the 15-event golden vector (section 6.4) |
| Store reducer, start rules, abort, reset, derived values | sections 6.2 and 8, plan section 9 | TC-MODEL, TC-STORE |
| Lexicon and unit-set guards over fixture text | plan Appendix B, `CONTENT_DECK.md` sections 12.3 and 13 | TC-NEG-01, -02, -05 and the L1 part of TC-SAFE-06 and -09 |

Put requirement IDs in code and tests (`@req`). Add property tests for reducer invariants and determinism. Each guard needs a recorded negative (mutation) case: a guard never shown to fail is not accepted (`TEST_PLAN.md` principle 3).

## 5. Done means

A draft PR with: a criterion-to-test table; commands and counts for `pnpm check:ts`, `pnpm lint:ts`, `pnpm test:frontend`, `pnpm test:ts-boundary`, `pnpm build:web` and both bundle checks (Test and Rehearsal, with the model absent from both); the mutation results; the assumed decisions; what was not verified. Then **stop**. First-attempt green CI in both the `push` and `pull_request` events on the exact SHA, an independent exact-SHA review and a human GitHub approval follow (plan section 17.2, tier R1). Merging is the owner's.

**Stop and report** if a metrology value seems necessary, if an existing file must change, if a fixture needs a real name or unit, or if a rule above conflicts with a spec.

## 6. Assignment text (use only after section 2 is satisfied)

```text
You are implementing WP-DV1-B (PR-1, pure demo model and fixtures) for avihafif/calibration-os, manually assigned by the product owner.
Branch from current main; first confirm it contains N1 and A2 (or that the owner recorded a sequence change P1). Do not touch any other branch.
Read first: AGENTS.md; docs/demo/HANDOFF_WP-DV1-B.md; docs/demo/DEMO_V1_PLAN.md (sections 2, 8, 9, 15, Appendix B); docs/demo/FIXTURES_SPEC.md, CONTENT_DECK.md and TEST_PLAN.md (owner-approved values only; open items are marked in OWNER_CHECKLIST.md).
Build only apps/web/src/demo/model/** and docs/demo/EVIDENCE_PR1.md. No UI, no route, no import from the app, no dependency.
Follow section 3 of the handoff exactly. Open a draft PR, state each assumed decision, and stop. Do not merge or approve.
```

## 7. After PR-1

PR-2 (widgets, messages) and PR-3 (screens, e2e, and the sentinel after its own R5 approval) follow in order, each assigned separately. Nothing here changes Gate A0, H-2, the Builder or any class C item.
