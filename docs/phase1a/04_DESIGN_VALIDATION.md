# 04 — Design validation of the Phase 1A prototype

| | |
|---|---|
| Status | Record of an **expert walkthrough and automated checks**, performed by the design lane on 2026-11-02 against [`design/phase1a-prototype/`](../../design/phase1a-prototype/index.html). |
| What this is **not** | **Not user research.** No calibration engineer, technician, manager, quality manager or administrator used the prototype. Click counts are *estimates from the walkthrough*; no usability threshold is claimed (D-10 open). Screen-reader (NVDA/JAWS) and real-device testing were **not** performed. Treat everything here as hypotheses to confirm in the moderated sessions ([06](06_TEST_AND_USABILITY_CHECKLIST.md)). |
| Method | (1) Scripted walkthrough of each persona's primary tasks through the live prototype (browser automation in a real browser engine, light/dark, en/he, 1360 / 800 / 390 px); (2) in-page accessibility audit script over 9 routes × 2 themes × 2 locales; (3) keyboard-only scenarios; (4) node-based design-rule suite (12 checks); (5) heuristic review (visibility of status, error prevention, recognition vs recall, consistency, minimal clicks). |

## 1. Automated results (reproducible)

| Check | Result |
|---|---|
| `node design/phase1a-prototype/tests/prototype.test.js` | **12/12 pass**: SHA-256 vectors, canonical JSON, decimal rule, id-aware diff + change-class, seed validity (exactly one intended error), widget exhaustiveness, **no kind names in renderer**, i18n completeness (en+he, placeholders match), **token contrast AA in both themes**, no network/storage/eval/`innerHTML`, protected indicators |
| In-page a11y audit (9 routes × light/dark × en/he = 36 page states) | **0** inputs/selects/textareas without an accessible name; **0** buttons/links without a name; **0** duplicate ids; **0** computed-contrast failures (text < 4.5:1, large < 3:1; disabled controls and table-header labels excluded); one heading-order defect (h1→h3 in form sections) **found and fixed** (section headings are now `h2`) |
| Keyboard scenarios | Ctrl K palette (open, filter, ↓, Enter navigates, focus lands on page `h1`); `?` shortcut sheet and Esc; grid ↑/↓/Enter opens rows; Ctrl Z undoes a structural change; Ctrl J toggles the validation drawer; skip link; dialogs trap focus and return it |
| Responsive | No element extends beyond the viewport at 390 px; nav becomes a drawer < 900 px; tables become labelled cards < 700 px; editor collapses to one column < 1100 px |
| RTL | Shell, nav, tabs, side panels, form rows, diff bars, steppers mirror; identifiers/values stay LTR; per-input `lang`/`dir` verified in Hebrew |
| Console | 0 runtime errors across all routes and the full draft → review → approve → publish → compare scenario |

## 2. Persona walkthroughs and findings

Severity: **S1** blocks a task · **S2** causes errors/rework · **S3** friction · **S4** polish. "Fixed" = changed in the prototype and re-tested; "Spec" = requirement added to the handoff; "Open" = needs a decision or user evidence.

### 2.1 Calibration Technician
*Task: find where to work; understand why the Builder is not for me.*
| # | Finding | Sev | Resolution |
|---|---|---|---|
| T-1 | A technician who reaches the Builder sees only a message; fine as scope control, but gives no onward path | S3 | Message names the Operator shell as a separate app and links the design system (the only shared screen). **Spec:** product shows no Builder navigation at all for this role and the login lands in the Operator shell |
| T-2 | The prototype contains **no Operator shell** (runner, results), so technician workflows cannot be validated here | — | **Open (by design):** Operator shell prototype belongs to slice S5; do not infer technician usability from this prototype |

### 2.2 Calibration Engineer
*Tasks: create manufacturer/family/model, define functions and capabilities, fix validation issues, submit, create an application with the wizard.*
| # | Finding | Sev | Resolution |
|---|---|---|---|
| E-1 | A freshly created draft showed red "required" errors on every empty field before the user did anything — noisy and discouraging | S2 | **Fixed:** required-field errors appear after the field is visited or Validate/Submit is attempted; counts and drawer still show everything (no hidden problems) |
| E-2 | Creating a model needed a manufacturer that did not exist yet → leave the form, create it, come back, select it | S2 | **Fixed:** reference picker has **+ New** (inline create, returns to the same field). Estimated clicks to "model with new manufacturer": **≈ 11 → ≈ 7** |
| E-3 | The Instruments tabs had **no "New" button** (it was cut off with the page header) — a blocking bug | S1 | **Fixed**; regression item in the checklist |
| E-4 | Entering a range value on an *Input required* field: the unit selector started empty, so the first valid-looking entry still failed | S2 | **Fixed:** unit pre-filled with the first unit of the chosen quantity; value invalid text shows the decimal rule instead of a generic "choose a value" message (oneOf branch selected by structure) |
| E-5 | "Pattern" findings said only "does not match the format" | S3 | **Fixed:** appends the field's plain-language `pattern_help` (e.g., identifier rule) |
| E-6 | Undo shortcut also hijacked native text undo inside inputs | S3 | **Fixed:** form-level Ctrl Z applies outside text fields; native undo inside |
| E-7 | Drawer covered ~40 % of a laptop-height form | S3 | **Fixed:** max 150 px, collapsible, remembered per session (Ctrl J) |
| E-8 | Wizard "Save & exit" only toasts; progress lives in memory, contradicting "leaving leaves a valid draft" | S2 | **Spec (R-1):** product creates the draft when step 1 completes; the wizard edits that draft. Prototype deviation recorded |
| E-9 | Capability vocabulary is a fixed chip list; a missing capability needs a reviewed catalog change — correct for governance but may frustrate | S3 | **Open:** add an in-context "Request a capability" action (writes a catalog-gap request); confirm with metrology owner (D-31) |
| E-10 | Locale rows: Hebrew rows are optional unless policy requires; engineers may not realise why a "required" chip appears | S4 | Chip tooltip "Required by lab policy" (present); **Spec:** link chip to the policy page |

### 2.3 Lab Manager (read-only role)
*Tasks: see status of work, readiness, what is waiting.*
| # | Finding | Sev | Resolution |
|---|---|---|---|
| M-1 | *New application* simply disappeared — contradicts "disabled with a reason, not hidden" | S3 | **Fixed:** disabled with reason on Dashboard and lists |
| M-2 | Banner "Your role can view but not change content" is clear; but no fleet/throughput view exists (Admin Dashboard is Phase 2) | — | **Open (scope):** documented in [phase1/04A SCR-01 C](../phase1/04_SCREEN_SPECS_A.md); not a Phase 1A defect |
| M-3 | Work queue answers "what is waiting on whom" only through the *Next step* column | S3 | **Spec:** add *waiting since* (age) column and an "aging" highlight (MI-34 deputies relevance) |

### 2.4 Quality Manager / approvers
*Tasks: review a change, approve, publish, withdraw, set locale policy.*
| # | Finding | Sev | Resolution |
|---|---|---|---|
| Q-1 | To review a change the approver had to open the item, find *Compare*, and choose versions (≈ 4 clicks) | S2 | **Fixed:** **Review summary** on the item (n changes · class · *Review changes*) deep-links to Compare with the right versions preselected (**≈ 4 → 1** click) |
| Q-2 | Publish wizard had 4 steps; "Dependencies" was a pure confirmation | S3 | **Fixed:** 3 steps (Readiness → Version & notes → Confirm with pinned dependencies); one fewer click per publish |
| Q-3 | First publication was labelled *Metrological* because everything is "new" against an empty base | S2 | **Fixed:** class **Initial version** (min 1.0.0) |
| Q-4 | Approval *reason* is mandatory in the dialog but nothing shows the reviewer which change class/approvals are expected | S3 | Mitigated by the approval-path panel; **Spec:** show required approver roles per class (MI-30/35 open) |
| Q-5 | Approval "digest" is shown short + copy only in the confirmation | S3 | **Spec:** `DigestText` component (short, tooltip full, copy) used in versions, history, review queue |
| Q-6 | Policy page lets only the Quality Manager change required locales; the effect is immediate and visible on the Dashboard | — | Good; **Spec:** policy changes are audited and, in Production, only through Change Requests |

### 2.5 Platform Administrator
*Tasks: users/roles, deployment identity, confirm no approval authority.*
| # | Finding | Sev | Resolution |
|---|---|---|---|
| A-1 | Role matrix correctly shows no approval rights, grant approval absent for everyone (requires a distinct Safety Officer/Quality Manager, not modelled) | S4 | Shown as a row with no grants + note; real dual-control flow is S0 (1B) |
| A-2 | The administrator can *view* authored drafts; spec does not say whether admins should see configuration content | S2 | **Open (security):** least-privilege question for the Gate A0 package (D-30) |
| A-3 | No user/role management screens in the prototype | — | **Open (scope):** specified in phase1/04B SCR-10; S0 backend dependency |

### 2.6 All personas — cross-cutting
| # | Finding | Sev | Resolution |
|---|---|---|---|
| X-1 | Persona switching is essential for the demo but is a **prototype artefact** and could be mistaken for a feature | S2 | Persistent "SYNTHETIC PERSONA" chip + banner text; **Spec:** persona switcher exists only in the dev entry point and is excluded from production bundles (P1A-AC-30) |
| X-2 | Mobile navigation toggle showed on desktop (CSS order bug) | S3 | **Fixed** |
| X-3 | Diff cells forced Hebrew prose into monospace LTR | S3 | **Fixed:** `bdi dir=auto` for prose, mono LTR only for identifiers/values |
| X-4 | Form section headings skipped a heading level | S3 | **Fixed** (`h2`) |
| X-5 | Wizard key field did not visibly update from the title | S3 | **Fixed** |
| X-6 | Browser-reserved shortcuts (Ctrl K in Firefox, Ctrl J in Chrome/Firefox) can be intercepted by pages but may conflict with user expectation | S3 | **Spec:** shortcuts remappable in settings (Phase 2); ensure every shortcut has a visible control and the palette is reachable from a button (it is) |
| X-7 | Digest strings are truncated (`sha256:ab12cd34…`) with copy only in dialogs | S3 | **Spec:** `DigestText` everywhere |
| X-8 | Performance on large lists/forms not evaluated (prototype data is tiny) | — | **Open:** budgets set from baseline (P1-AC-PERF-01) |

## 3. Unnecessary clicks, confusing controls, missing validation, complexity — summary
| Concern | Where found | Outcome |
|---|---|---|
| Unnecessary clicks | Inline reference creation (E-2), review compare (Q-1), publish steps (Q-2) | Reduced (estimates: −4, −3, −1) |
| Confusing controls | Silent "New" button loss (E-3), hidden create button for read-only role (M-1), "Initial" mislabel (Q-3), generic oneOf message (E-4) | Fixed |
| Missing validation | Decimal text vs unit coupling (E-4), pattern help (E-5), duplicate function ids (present), required locale policy (present) | Fixed/present |
| Excessive complexity | Draft-time red errors (E-1), drawer height (E-7) | Reduced |
| Inefficient workflows | Persona switching during demos | Mitigated by the **Guided demo** (7 steps, each switches persona and route) |

## 4. Accessibility, keyboard, responsive, RTL, technical-data readability — review conclusions
| Area | Conclusion | Residual |
|---|---|---|
| Accessibility | Names, structure and contrast pass automated checks; focus ring and focus return verified; live regions for toasts/findings | **No screen-reader test**; no automated test of the ARIA grid pattern; need axe in CI (P1A-AC-10) |
| Keyboard | All primary flows reachable and operable; no pointer-only action found; dialogs trap focus | Canvas/outline keyboard model is out of 1A (S4); drag-and-drop does not exist in 1A (reordering uses buttons) |
| Responsive | Usable 360–1600 px for the screens built; tables degrade to cards | Editors on phones are read-oriented (as specified); no tablet device tests |
| RTL | Mirroring and LTR isolation correct for all built screens; per-input direction | Hebrew copy unreviewed (Q-15/MI-31); no bidi stress tests with mixed SCPI text (S3) |
| Technical data readability | Monospace + `dir=ltr` for ids/keys/hashes/versions; decimal strings with unit selects; tabular numerals; semantic chips with text | Long digests truncated (X-7); no unit-aware number formatting yet (display of decimals uses raw strings by design until MI-13 rounding rules) |

## 5. Residual items carried into the handoff
**R-1** wizard draft creation (E-8) · **R-2** `DigestText` everywhere (Q-5, X-7) · **R-3** request-a-capability action (E-9) · **R-4** waiting-since column (M-3) · **R-5** admin visibility of content (A-2) · **R-6** shortcut remapping (X-6) · **R-7** performance budgets (X-8) · **R-8** screen-reader and device testing · **R-9** Operator shell validation with technicians (S5). Each is listed with an owner and slice in [07 §9](07_CODEX_HANDOFF.md#9-residual-risks-and-assumptions).
