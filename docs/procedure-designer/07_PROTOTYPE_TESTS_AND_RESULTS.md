# 07 — Prototype checks and their actual results

These are **prototype QA checks**, not product tests. They encode rules the product tests must also enforce. Results below are from runs on 2026-11-02 (Windows, Node v26.10.0; browser pane of the Claude desktop app).

| Check | How to run | Result |
|---|---|---|
| Logic, safety, broker, simulation, boundary lint | `node design/procedure-designer-prototype/tests/pd.test.js` | **69 passed, 0 failed** |
| Translation completeness (static keys + dynamic families, en/he, placeholders, untranslated Hebrew) | `node …/tests/i18n-audit.js` | **920 keys checked, 915 `pd` entries: 0 missing, 0 empty, 0 untranslated, 0 placeholder mismatches** |
| DOM flows (clicks, input events, synthetic drag-and-drop, keyboard events) | inject `tests/flows-in-page.js`, read `window.__flows` | **38 / 38 passed** (after fixing 2 prototype defects found by the first run: prompt answering needed two clicks; hardware-limit source key casing) |
| Accessibility/readability audit (names, duplicate ids, heading order, tab/tree ARIA, SVG labels, overflow, text contrast) | inject `tests/audit-in-page.js`, read `window.__audit` | **28 states, 0 findings**: {light,dark} × {en,he} × {Procedure canvas, Procedure outline, Command Builder, Metrology, Safety, Simulation finished, Simulation waiting for operator}; run at 746 px and at an emulated phone width (reported 475 px wide) |
| Real keyboard Tab traversal | manual, browser pane | skip link first; header, workspace tabs, form controls, test panel and back to the skip link in a sensible order (one workspace sampled) |

## What `pd.test.js` covers
Exact decimal arithmetic; closed expression language (rejects `eval`, member escapes, statements, unknown functions); dimension checks; unresolved inputs never evaluated; AST bound; determinism; seeded PRNG; tree ops and placement invariants; canvas/outline shared view-model; **a failing fixture for every lint code PR-001…024, I18N-001**; effective limit = AHL ∩ profile ∩ bound; no profile ⇒ uncovered; profile beyond AHL refused (PR-023); AHL deep-frozen and never assigned anywhere; no override/bypass identifiers; typed-only wire text, injection rejected; no free-form command API; closed schemas; broker refuses out-of-envelope **before any send**; safety violation not catchable nor retried; unsafe-level fault fail-closed; missing/withdrawn profile refused; report flags (`simulated`, not issued, not approvable) and no code path that sets them otherwise; hash-chained gapless journal; seed determinism; fault codes and recovery; teardown + safe state after failure; step/run parity; **resume parity**; non-repeatable resume decision; prompt handling; loop bound; no clock/randomness outside the simulator; diff (added/changed/moved, move not triggered by neighbour insertion) and raise-only classification; hazard path; digest stability; no model/manufacturer-specific logic; no `eval`/`innerHTML`/network API; CSP; no duplicate globals across scripts.

## Defects found and fixed during testing (examples)
Conditional DOM children printed the word "null"; duplicate global function name between two modules; diff reported an index shift as a "move"; event `seq` overwritten by a wire record field (journal not gapless); prompt answering required two clicks; hardware-limit source label key missing; run-to-end did nothing when no run existed.

## Honest limits — what was NOT done
- **No real-user usability testing.** No participants, tasks or timings exist. Persona review is a design walkthrough only.
- **No screen-reader testing** (NVDA/JAWS/VoiceOver). ARIA structure and keyboard operation were checked programmatically and by sampling.
- **Drag-and-drop** was exercised with synthetic `DragEvent`s, not with a real pointer or a touch device; touch layout was not tested on hardware.
- The emulated 390 px viewport reported 475 CSS px; true 390 px layout was only checked visually/with the audit at that emulated width. The pane's screenshots lagged in emulation, so some layouts were verified through DOM checks rather than pixels.
- Contrast was computed for text only; non-text contrast of the envelope diagram was not measured.
- Browsers: one engine (Chromium-based pane). No Firefox/Safari.
- The automated checks cover the prototype; they do not prove the product.
