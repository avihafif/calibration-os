# 05 — Design-system extensions (on top of Phase 1A)

Reused unchanged: tokens (light/dark), chips, buttons, forms, dialogs, governed confirmation, data grid, disabled-with-reason pattern, toasts, i18n/RTL rules. Additions below live in `css/designer.css` and must be promoted into `packages/ts/ui-kit` only after design review.

| Pattern | Purpose | Rules |
|---|---|---|
| **Workspace tabs** | Switch Procedure / Command Builder / Metrology / Safety / Simulation Lab | `aria-current="page"`; scrolls horizontally on phones |
| **Workflow lane** | Setup, As-found, Teardown, Safe state | safe-state lane uses the hazard token and a "runs on any failure" chip; colour is never the only cue |
| **Step card** | Canvas node | glyph + title + type chip + resume chip + hazard chip; roving tabindex; selected = outline + `aria-pressed` |
| **Slot** | Container child list | dashed inline-start rule, label (Body/Then/Else/Handler/Finally); mirrors in RTL |
| **Drop zone** | Insert position | 2 px indicator; green = accepted, red = refused (with reason as title + announcement); `+` button pointer-only (`tabindex=-1`, keyboard uses Insert/outline) |
| **Outline tree** | Accessible equivalent | `role=tree/treeitem`, `aria-level`, `aria-selected`; same keyboard ops |
| **Hazard chip** | H0–H4 | H2+ shows ⛔ and 🔒; fixed tokens, not themeable |
| **Execution status glyph** | ✔ ✖ ▶ ⛔ ↷ on canvas/outline during/after a run | glyph + text label, not colour only |
| **Findings list** | Validation | severity chip + code (`ltr`) + message + jump links |
| **Review flow** | Draft → In review → Approved → Published | `aria-current="step"` |
| **Envelope diagram** | AHL ∩ profile ∩ step bound with test-point markers | SVG with `role=img` + `aria-label`; **mandatory table equivalent**; number line stays LTR in RTL |
| **Run status strip / controls toolbar** | Simulation state, virtual clock, output ON/OFF, journal hash | `role=status`; output ON uses the hazard token |
| **Operator prompt panel** | Blocks the run until answered | `role=alertdialog`, focus on primary action |
| **Failure card** | "Why did this run fail?" | code, plain-language text, where, policy, safe-state result, fix links |
| **Report preview** | Non-approvable | diagonal watermark layer + three "SIMULATED / NOT A CALIBRATION / NOT A CERTIFICATE" chips; approve/issue/remove-watermark are disabled-with-reason; **no toggle may exist** |
| **Non-operational banner + SIMULATION badge** | Always visible | banner in the document, badge in the sticky top bar; not theme-overridable |

Tokens added: none. Colours come from existing semantic tokens; `color-mix` used only for slot backgrounds. All spacing uses logical properties. Touch (`pointer: coarse`): ≥44 px step rows, always-visible `+`.

Contrast: the in-page audit computes text contrast for all rendered text (light and dark, both languages) and found no failures; non-text contrast of the envelope colours was **not** formally measured (open item).
