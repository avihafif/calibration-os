# 08 — Structured design review

Method: expert walkthrough by the design author against the checklist below, using the prototype and the automated checks in 07. **Not user research.** Ratings: ✔ meets intent in prototype · ◐ partly / needs work · ✖ gap.

| # | Dimension | Rating | Evidence | Gaps / follow-ups |
|---|---|---|---|---|
| 1 | **Engineer workflows** (create → build → validate → simulate → fix → review) | ✔ | all ten demonstrations pass `flows-in-page.js`; failure card links to the exact step/Metrology/Safety | no templates beyond three presets; no copy/paste between procedures; no multi-select |
| 2 | **No-Code completeness** | ◐ | inspector is catalogue-generated; presets are ordinary steps; driver ops authored without code | missing building blocks G-1…G-5 (04); uncertainty/decision-rule editors are Phase 2; selecting a *specific* reference standard not modelled |
| 3 | **Navigation** | ✔ | five workspaces, deep links from findings/failures, roving focus, skip link | no breadcrumb for deep driver↔procedure links; back-navigation after "Go to" loses dock tab |
| 4 | **Error prevention** | ✔ | placement refusal with reason, disabled-with-reason controls, typed args, inclusivity has no default, retry/resume constraints, bound can only narrow, run blocked on errors | drop refusal reason shown as toast/title only; add inline hint while dragging |
| 5 | **Keyboard access** | ◐ | full add/move/nest/delete/duplicate/breakpoint by keyboard on canvas and outline; menus and dialogs trap/return focus | no keyboard equivalent for drag between *panes*; Alt+Arrow may collide with browser/OS shortcuts (needs remappable bindings — D-16) |
| 6 | **Hebrew RTL** | ✔ | mirrored layout, logical CSS, `ltr` islands for ids/code/numbers, Alt+←/→ semantics mirrored, number-line diagram stays LTR | translations are design-author drafts — **need professional review**; mixed-direction wrapping of long codes in narrow columns not exhaustively checked |
| 7 | **Responsive behaviour** | ◐ | 3-pane → 2-pane → single pane with switcher; tables scroll; audit clean at 746 px and emulated phone | authoring on a phone is awkward by nature; recommend read-only/review on phones and authoring on ≥ tablet (D-17) |
| 8 | **Simulation clarity** | ✔ | permanent banner/badge/flags; failure explanation; wire log marks NOT SENT; report preview watermark; stale-run warning | virtual time vs real time could confuse; add legend; trace is dense for long runs (needs virtualisation) |
| 9 | **Safety UX** | ✔ | read-only AHL with reason, narrowing-only profile, SoD, withdrawal fails closed, envelope diagram + table, blocked-operation list, no override control (test-enforced) | real step-up and signed packs are out of scope; hazard authoring role is a proposal (D-06) |
| 10 | **Architecture consistency** | ✔ | one command path for insert/move; one view-model; closed schemas; no raw SCPI; boundary lint test; no copy of prototype code intended for production | prototype computes authoritative things client-side (D-10); ADR-0006 still *Proposed* |

## Top risks for the product team
1. Treating the client-side validation/simulation in the prototype as authoritative.
2. Letting "convenient" escape hatches creep in (raw send, safety override, optional watermark) — each has a test; keep them.
3. Governance rules shown here are **proposals** (roles, co-approval, evidence) — they need explicit human decisions.
4. Hebrew strings need professional localisation review; metrology terms need a glossary.
