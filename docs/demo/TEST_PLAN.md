# TEST_PLAN.md — Demo V1 (S1 "Thin Thread") acceptance tests

| | |
|---|---|
| Status | **Proposal, documentation only (WP-DV1-0). No test described here exists yet, and none has been run.** Nothing below is evidence. It authorises no code, workflow, dependency, schema, gate or governance change. |
| Parent | [`DEMO_V1_PLAN.md`](DEMO_V1_PLAN.md) sections 2, 8, 9, 15, 16 and 17.2 (criteria DV-FN, DV-SAFE, DV-ISO, DV-A11Y, DV-L10N-T). Owner decisions DV-DEC-01 to DV-DEC-09 accepted 2026-11-07 ([section 18.1](DEMO_V1_PLAN.md)). |
| Companions | [`CONTENT_DECK.md`](CONTENT_DECK.md) (strings under test) · [`FIXTURES_SPEC.md`](FIXTURES_SPEC.md) (data and guards FX-G-nn under test) · [`OWNER_CHECKLIST.md`](OWNER_CHECKLIST.md) (open decisions) |
| Scope | Slice **S1** only. S2 items (registry, customers, procedure route, extra scenarios, bar chart, print, auto-play, exact-decimal helper) have no tests here (section 13). |
| Written by | The same agent family (Claude) that wrote the plan. The plan and this file are a design for independent reviewers; they are not a verification of anything. |

## 1. Principles

1. **A test that does not run is not evidence.** For every code PR, the number of test files Vitest *discovers* must equal the number that *executed*. Vitest here includes `packages/ts/i18n/src/**/*.test.ts`, `packages/ts/ui-kit/src/**/*.test.tsx`, `apps/web/src/**/*.test.ts` and `apps/web/src/**/*.test.tsx` (`vitest.config.mjs`); a `ui-kit` test named `*.test.ts` would silently not run.
2. **Safety tests are first-class.** Lexicon, metrology guard, protected markings, watermark, no-approve and Rehearsal isolation fail the build; they are not "nice to have".
3. **Every guard has a negative test.** For each guard (FX-G-nn, lexicon, watermark, isolation) one case injects a violation and shows the guard fails (mutation check). A guard never shown to fail is not accepted.
4. **Determinism.** The demo has no clock, no randomness and no timers in S1, so no test may sleep, poll or retry. `retries: 0` stays. A flaky test is a defect in the test or the code, never retried away.
5. **Report what was not verified.** Manual and cross-browser items that nobody ran are listed as *not verified* in the evidence file, not omitted.
6. **No weakening.** No existing test, lint rule, gate, workflow or protected marking is edited to make a demo test pass; unavoidable edits are listed with their reason (DV-ISO-05).

## 2. Test levels and where the tests will live (proposed)

| Level | What | Proposed location (new files) | Runner |
|---|---|---|---|
| L1 Model and fixtures | Fixture guards, store reducer, scenario runner, selectors, golden vectors, property tests | `apps/web/src/demo/model/*.test.ts` (PR-1) | `pnpm test:frontend` |
| L2 Widgets | `MetricTile`, `StatusMeterList`, `SegmentedControl`, `StepList`, `EventLog`, `OutlineView` | `packages/ts/ui-kit/src/*.test.tsx` (PR-2) | `pnpm test:frontend` |
| L3 Messages | Key parity en/he, ICU plurals, lexicon over bundles, protected-phrase equality | `packages/ts/i18n/src/messages-demo.test.ts` (PR-2) | `pnpm test:frontend` |
| L4 Screens (jsdom) | Rendering, disabled-with-reason, empty states, no hard-coded text, DOM tags for isolation | `apps/web/src/demo/*.test.tsx` (PR-3) | `pnpm test:frontend` |
| L5 Browser | Journeys, keyboard, RTL, axe, forced colors, viewports, network and storage isolation | `tests/frontend/demo.e2e.spec.ts` (PR-3; one entry in `check:browser-types`) | `pnpm test:e2e` |
| L6 Builds and gates | Test vs Rehearsal bundles, sentinels, boundary lint, logical CSS, tokens | existing tools plus a documented grep until DV-DEC-05's diff is approved | commands in section 14 |
| L7 Manual | Screen readers, High Contrast, zoom, display scaling, Hebrew review, other browsers | this document, section 12 | a person |

axe cannot run in jsdom; accessibility rules are asserted in L5 and the structure is asserted in L2 and L4.

## 3. Environments and matrix

| Dimension | Values | Where |
|---|---|---|
| Locales | `en`, `he`, pseudo `en-XA`, `he-XB` | L4, L5 |
| Themes | light, dark | L5 |
| Contrast mode | normal, forced colors (`forced-colors: active`) | L5 |
| Viewport width | 320, 768, 1440 px | L5 |
| Short viewports (focus not obscured) | 1280×560, 768×600, 800×400 | L5 |
| Motion | `prefers-reduced-motion: reduce` | L5 |
| Browsers automated | Chromium family as configured in `playwright.config.ts` (Desktop Chrome; the Chrome channel locally, bundled browser in CI) | L5 |
| Browsers manual or by another work package | Microsoft Edge, Firefox, Safari/WebKit. Edge is planned under WP-1A-1e-B; Firefox and WebKit are not configured today. | L7; listed as **not verified** until run |
| Build kinds | Test (`VITE_ENVIRONMENT_KIND` default) and `production_rehearsal` | L6 |
| Runtime | Windows, Node 22.22.2 or newer, pnpm 11.25.0, as in `README.md` | all |

Each stateful e2e test starts from a fresh page load and a Reset, never from the previous test's state.

## 4. Entry and exit criteria

**Entry (per code PR):** the plan decisions DV-DEC-01 to -09 recorded; this file reviewed (TP-RC-01); CONTENT_DECK and FIXTURES_SPEC checkpoints closed as their sections require; the owner's assignment of that work package; for PR-3, N1 (merged, PR #36, `e47b961`) and A2 (not yet merged) merged (P0).

**Exit (per code PR):** every applicable case in sections 6 to 10 passes with `retries: 0`; discovered equals executed; guard negatives shown; the CI checklist of plan section 16 is met on the exact final SHA for both the `push` and `pull_request` events, first attempt; the evidence file lists commands with counts and an honest *not verified* list; manual cases are either done by a named person or listed as not verified.

## 5. Traceability: criteria to cases

| Plan criterion | Cases |
|---|---|
| DV-FN-01 | TC-FN-01, TC-FN-02, TC-ISO-01 |
| DV-FN-02 | TC-STORE-01 to 05, TC-FN-03 |
| DV-FN-03 | TC-FN-04 to 08 |
| DV-FN-04 | TC-FN-09 to 15 |
| DV-FN-05 | TC-FN-16, TC-FN-17, TC-SAFE-06 |
| DV-FN-06 | TC-MODEL-01 to 14, TC-FN-18 to 24 |
| DV-FN-07 | TC-FN-25, TC-FN-26, TC-FN-27 |
| DV-FN-08 | TC-FN-28 to 31, TC-SAFE-03 |
| DV-FN-09 | TC-FN-32, TC-FN-33, TC-ISO-04 |
| DV-FN-10 | TC-FN-34, TC-FN-35 |
| DV-SAFE-01 | TC-SAFE-01 |
| DV-SAFE-02 | TC-SAFE-02 |
| DV-SAFE-03 | TC-SAFE-03, TC-NEG-03 |
| DV-SAFE-04 | TC-MSG-04 to 06, TC-SAFE-04, TC-NEG-02 |
| DV-SAFE-05 | TC-SAFE-05 |
| DV-SAFE-06 | TC-FX-01 to 15, TC-NEG-01 |
| DV-SAFE-07 | TC-SAFE-07 |
| DV-SAFE-08 | TC-SAFE-08 |
| DV-ISO-01 | TC-ISO-01 to 03, TC-NEG-04 |
| DV-ISO-02 | TC-ISO-04, TC-ISO-05 |
| DV-ISO-03 | TC-ISO-06, TC-ISO-07 |
| DV-ISO-04 | TC-ISO-08 |
| DV-ISO-05 | TC-ISO-09 |
| DV-A11Y-01 | TC-A11Y-01 |
| DV-A11Y-02 | TC-A11Y-02, TC-A11Y-03 |
| DV-A11Y-03 | TC-WID-01 to 14, TC-A11Y-04 |
| DV-A11Y-04 | TC-A11Y-05 |
| DV-A11Y-05 | TC-A11Y-06, TC-RTL-07 |
| DV-A11Y-06 | TC-A11Y-07 |
| DV-A11Y-07 | TC-MAN-01 to 08 (not verified until a person runs them) |
| DV-L10N-T1 | TC-MSG-01, TC-MSG-02, TC-FX-03 |
| DV-L10N-T2 | TC-MSG-03 |
| DV-L10N-T3 | TC-RTL-01 to 03 |
| DV-L10N-T4 | TC-RTL-05, TC-RTL-06, TC-MSG-02, TC-MSG-07 |

## 6. L1 to L3: fixtures, model, store, widgets, messages

### 6.1 Fixtures (TC-FX), one case per guard in `FIXTURES_SPEC` section 9

| ID | Guard | Check |
|---|---|---|
| TC-FX-01 | FX-G-01 | Ids match the pattern, are unique, and every reference resolves |
| TC-FX-02 | FX-G-02 | Every record has `provenance: "synthetic_demo"` |
| TC-FX-03 | FX-G-03 | Every `Localized` has `en`, `he` and `heStatus === "needs_review"` |
| TC-FX-04 | FX-G-04 | The set of unit strings is exactly `{"su"}` |
| TC-FX-05 | FX-G-05 | Readings are strings matching `^[0-9]+\.[0-9]{4}$`; no numeric property outside the allow-list |
| TC-FX-06 | FX-G-06 | No forbidden property name appears in the object graph (walks every key) |
| TC-FX-07 | FX-G-07 | Slot markers are in the five-marker set and in `METROLOGY_REQUIREMENTS` section 12 |
| TC-FX-08 | FX-G-08 | No email, phone, URL, address or person-name pattern; contacts are `null` |
| TC-FX-09 | FX-G-09 | No digit-plus-real-unit pattern or percentage text in either language |
| TC-FX-10 | FX-G-10 | The lexicon guard passes over every fixture string, en and he |
| TC-FX-11 | FX-G-11 | Counts: 6 customers, 8 assets, 10 work orders, 3 procedures, 1 scenario of 11 counted steps (3 points × 3 readings plus note and operator-confirm) |
| TC-FX-12 | FX-G-12 | The owner's denylist (read from a reviewed file) matches nothing |
| TC-FX-13 | FX-G-13 | Compatibility table covers every procedure × class; preflight covers every asset; every referenced message key exists in the demo bundle |
| TC-FX-14 | FX-G-14 | The graph is deeply frozen and has no function, `Date`, `RegExp` or class instance |
| TC-FX-15 | FX-G-15 | Golden vector: the actions of `FIXTURES_SPEC` 6.2 produce exactly the 15-event list of 6.4 |

### 6.2 Run model (TC-MODEL), pure reducer, no UI

| ID | Case | Expected |
|---|---|---|
| TC-MODEL-01 | Start from Ready; **Step** | Event `note`; next is the operator step; state Waiting; event `operatorWaiting` |
| TC-MODEL-02 | **Run to end** from Ready | Executes step 1 and stops at step 2 (Waiting); no timer used |
| TC-MODEL-03 | While Waiting, **Step** is pressed | No state change; the reducer rejects it with a typed result, never throws |
| TC-MODEL-04 | **Confirm** while Waiting | Event `operatorConfirmed`; state Running; elapsed counter 2 |
| TC-MODEL-05 | After Confirm, **Run to end** | Executes steps 3 to 11 and the end marker in order; state Completed; 15 events in total |
| TC-MODEL-06 | Nine consecutive **Step** presses after Confirm | Readings A1 to C3 recorded in order; the ninth also emits `runCompleted` |
| TC-MODEL-07 | **Abort** from Running and from Waiting | State Aborted; event `runAborted`; results marked incomplete; work order returns to `ready` |
| TC-MODEL-08 | Any action after Completed or Aborted other than Reset or Reset demo | No state change (typed rejection) |
| TC-MODEL-09 | **Reset** (run) | Returns to Ready for the same job; events cleared for that run; counter unchanged |
| TC-MODEL-10 | **Reset demo** | The whole store equals the seed; run counter 0 |
| TC-MODEL-11 | Determinism: the same action list applied twice | Deep-equal states and event lists |
| TC-MODEL-12 | Property: any random action sequence (seeded **only inside the test**) | No illegal state is reachable; the reducer is total; event count equals accepted actions |
| TC-MODEL-13 | Elapsed counter | `t+00:NN` equals the number of completed counted steps for every state in the golden run; never reads a clock |
| TC-MODEL-14 | Abort then start again on the same work order | New run id `SIM-RUN-0002`; report id would be `DEMO-RPT-0002` |

### 6.3 Store and derived values (TC-STORE)

| ID | Case | Expected |
|---|---|---|
| TC-STORE-01 | Seed selectors | open 10, received 4, ready 3, in simulation 0, report ready 0, on hold 3, instruments 6 of 8, needs attention 1, runs 0 |
| TC-STORE-02 | After a completed run | The work order is `report-ready`, the asset `available`, completed 1; open work orders 9 |
| TC-STORE-03 | During a run | Work order `in-simulation`, asset `in-job` (so available 5 of 8) |
| TC-STORE-04 | After an abort | Work order `ready`, asset prior status, aborted 1 |
| TC-STORE-05 | Selection survives route changes | The selected work order id persists in the store until Reset demo |
| TC-STORE-06 | Filter helper | Case-insensitive substring over ids and localized names; returns a new array; never mutates fixtures |
| TC-STORE-07 | Sort | Locale-aware sort by id, customer, priority and status in en and he; stable order for equal keys |

### 6.4 Widgets (TC-WID), `*.test.tsx` in `ui-kit`

| ID | Widget | Case |
|---|---|---|
| TC-WID-01 | `MetricTile` | Label, value and caption share one description group; value isolated LTR; no text is colour-only |
| TC-WID-02 | `StatusMeterList` | `role="list"`; each item exposes label and number as text; bar is `aria-hidden`; zero counts render |
| TC-WID-03 | `StatusMeterList` | "Show as table" toggles to a table with the same numbers; focus stays on the toggle |
| TC-WID-04 | `StatusMeterList` | Bars fill from the inline-start side in `dir="rtl"` (computed style assertion) |
| TC-WID-05 | `SegmentedControl` | `tablist` pattern, roving tabindex, Arrow keys move and activate; direction-aware in RTL; `aria-controls` links to the panel |
| TC-WID-06 | `SegmentedControl` | A disabled segment stays focusable with a visible reason |
| TC-WID-07 | `StepList` | Ordered list; current item has `aria-current="step"`; state is text plus icon |
| TC-WID-08 | `StepList` | Groups collapse and expand with `aria-expanded`; collapsed content leaves the tab order |
| TC-WID-09 | `EventLog` | `role="log"`, polite; appending several events produces one batched announcement string |
| TC-WID-10 | `EventLog` | Keyboard-focusable region with an accessible name; oldest first |
| TC-WID-11 | `OutlineView` | Tree semantics; every node is a readable text line; no editing control exists |
| TC-WID-12 | `OutlineView` | Disclosure buttons carry `aria-expanded`; keyboard operation |
| TC-WID-13 | All widgets | Render with `en-XA` and `he-XB` strings without clipping classes; logical CSS only (lint) |
| TC-WID-14 | All widgets | No import outside `@calos/ui-kit` internals and React; no I/O, timer, clock or randomness |

### 6.5 Messages (TC-MSG)

| ID | Case | Expected |
|---|---|---|
| TC-MSG-01 | Key parity | Every `demo.*` key has non-empty `en` and `he` values; no extra key in one language only |
| TC-MSG-02 | Hebrew status | No `demo.*` key is marked reviewed; the review status of every Hebrew value is `needs_review` |
| TC-MSG-03 | ICU plurals | `demo.dashboard.kpi.instruments.caption`, `demo.run.announce.batch` render the right category for 0, 1, 2, 3, 11 in en and he (`one`, `two`, `other`) |
| TC-MSG-04 | Lexicon, English | Banned claim words (CONTENT_DECK 12.3) appear in no rendered message except the exact protected phrases |
| TC-MSG-05 | Lexicon, Hebrew | Banned stems (CONTENT_DECK 13), matched on word boundaries after optional prefixes, appear only in the protected Hebrew counterparts; the report states the Hebrew list is a proposal under review |
| TC-MSG-06 | Protected phrases | The strings of CONTENT_DECK section 10 equal the catalog byte for byte, in both languages |
| TC-MSG-07 | Pseudo-locales | `en-XA` and `he-XB` expand every demo key without a missing-key fallback |
| TC-MSG-08 | Placeholders | Every `{argument}` in `en` appears in `he` and vice versa; id-like arguments are formatted through the isolating helper |
| TC-MSG-09 | No unit symbols | No demo message contains a real unit symbol; `su` appears only as the technical constant |
| TC-MSG-10 | No hard-coded UI text | The existing `calos/no-hardcoded-ui-text` rule passes on every demo `.tsx` file (no rule changed) |

## 7. L4 and L5: functional journeys (TC-FN)

All journeys run on the Test build. Selectors use stable `data-testid` or role and name; no CSS-class selectors.

### 7.1 Navigation and shell

| ID | Case | Expected |
|---|---|---|
| TC-FN-01 | Test build: open `#/overview` | Default route unchanged; the five demo items are in navigation and the command palette; the overview card links to `#/demo-dashboard` |
| TC-FN-02 | Existing route tests | `routes.test.ts` and the existing e2e suites pass **unedited** |
| TC-FN-03 | Dashboard KPIs | Seed values of TC-STORE-01 shown; after a completed run (via the UI) the tiles and meters change without reload |

### 7.2 Dashboard and work orders

| ID | Case | Expected |
|---|---|---|
| TC-FN-04 | Work-order table | Ten rows; default order as in `FIXTURES_SPEC` 5.3; "10 of 10 shown" |
| TC-FN-05 | Sort | Sorting by id, customer, priority and status toggles direction and announces the sort; locale-aware in he |
| TC-FN-06 | Text filter | "SYN-WO-00" narrows to the matching rows; the count updates; a no-match query shows the no-results `StatePanel` with a **Clear filters** action |
| TC-FN-07 | Status filter | Choosing Ready shows exactly SYN-WO-001, -002, -003 |
| TC-FN-08 | Select a row | The customer and instrument cards fill; focus moves to the detail card heading; **Set up job** becomes enabled; the selected row is marked with text, not colour only |

### 7.3 Job set-up and preview

| ID | Case | Expected |
|---|---|---|
| TC-FN-09 | Direct entry to `#/demo-job` with no selection | Empty state with the reason and a link to work orders |
| TC-FN-10 | SYN-WO-001 | Procedure options: PROC-001 selectable; PROC-002 disabled with the class-mismatch reason; PROC-003 disabled with the retired reason; reasons are visible text |
| TC-FN-11 | Start disabled reasons | In order: before any choice the reason is "Choose a compatible procedure first"; after the choice with no confirmation, "Confirm that this is a simulation first"; once confirmed, **Start simulation** is enabled |
| TC-FN-12 | SYN-WO-002 (asset needs attention) | An error finding groups under "Blocking findings"; **Start simulation** stays disabled with "Resolve the blocking findings first" even after confirmation |
| TC-FN-13 | SYN-WO-007 (out of service), SYN-WO-004 (Received) | Blocking finding shown; Start disabled with the status reason first (precedence: run exists, status, procedure, findings, confirmation) |
| TC-FN-14 | SYN-WO-008 (class C) | No compatible procedure; error finding; all three procedures disabled with reasons |
| TC-FN-15 | Findings grouping | Errors, warnings and information are separate groups, each with text and icon; the standing warning shows `MI-07` |
| TC-FN-16 | Preview | After choosing PROC-001 the outline shows Setup, Points and Teardown with the illustrative chip and note; every metrology slot reads `Input required` with `MI-03` or `MI-04`; no edit control exists |
| TC-FN-17 | "Edit in Builder" | Present, disabled, with the visible reason; the production-gates line is greyed text with no values |

### 7.4 Run console

| ID | Case | Expected |
|---|---|---|
| TC-FN-18 | Direct entry to `#/demo-run` with no run | Empty state with the reason and a link to job set-up |
| TC-FN-19 | Start from SYN-WO-001 | Navigates to `demo-run`; run id `SIM-RUN-0001`; state Ready; steps list shows 11 steps plus the end row; events show job created and run started |
| TC-FN-20 | **Step** repeatedly | One scripted step per press; readings table fills in order; "Step k of 11" and `t+00:NN` follow the model; no step advances without a user action (asserted as an unchanged state snapshot after two animation frames with no input; the absence of timers is asserted separately in TC-ISO-08) |
| TC-FN-21 | Operator step | The prompt blocks; **Step** and **Run to end** are `aria-disabled` with `demo.run.operator.waiting` as the visible reason; **Confirm** continues; the prompt never times out |
| TC-FN-22 | **Run to end** | From Ready it stops at the operator step; after Confirm it runs to the end |
| TC-FN-23 | **Abort…** | Dialog states the consequence, focus starts on **Keep running**; Escape cancels; **Abort run** sets Aborted and the results are incomplete; focus returns to the invoking control when cancelled |
| TC-FN-24 | **Reset** | Returns the console to Ready; the footer still reads "Journal: simulated, not persisted" |

### 7.5 Results and report

| ID | Case | Expected |
|---|---|---|
| TC-FN-25 | Completed run | Results segment: 3 points, 9 scripted readings, values exactly as the approved fixture (string equality), unit `su`, limit check "not evaluated" per row |
| TC-FN-26 | Aborted run | "Incomplete (aborted)"; the report segment is disabled with the visible reason; no report content exists in the DOM |
| TC-FN-27 | No run | Direct entry to `#/demo-report` shows the empty state and a link to the console |
| TC-FN-28 | Report segment | Title in the active locale and the English constant; the watermark present as repeated text; header block with `DEMO-RPT-0001`, synthetic customer and instrument, procedure, data provenance |
| TC-FN-29 | Negations | The three negation lines are present, in the locale and (decision CD-Q6) with English under Hebrew |
| TC-FN-30 | Absent elements | No logo, signature block, QR code, barcode, certificate-like number, official issue date or "approved by" in the DOM |
| TC-FN-31 | Actions | **Back to results** and **Start another run** work; there is no download, Blob URL, print or PDF control |
| TC-FN-32 | Reset demo from any page | A confirmation dialog states the consequence; confirming returns every page to the seed; the dashboard shows the seed values |
| TC-FN-33 | Reload | Everything returns to the seed; `localStorage`, `sessionStorage`, IndexedDB and cookies are empty after the full journey |
| TC-FN-34 | Back and Forward | On every demo route the browser history works, focus lands on the page heading, and the selected work order and run state survive |
| TC-FN-35 | Direct hash entry to every demo route | Each renders (empty or populated) without console errors |

## 8. Bilingual and RTL (TC-RTL)

| ID | Case | Expected |
|---|---|---|
| TC-RTL-01 | In `he`, every id, version, `su` value and `MI-nn` marker on every demo route | Rendered inside an LTR isolate (tagged elements checked by DOM) |
| TC-RTL-02 | Mixed text lines (for example `Run SIM-RUN-0001 …`) | The identifier does not reorder the sentence; punctuation does not jump |
| TC-RTL-03 | Numerals | Western digits in both locales |
| TC-RTL-04 | Layout mirroring in `he` | Navigation on the inline-start side; step list, tabs and meters follow reading direction; table column order mirrors; numeric cells stay LTR |
| TC-RTL-05 | Pseudo-locales at 320 px, every route | No clipping, no overlap, no horizontal page scroll, controls reachable |
| TC-RTL-06 | Hebrew review note | Visible on every demo route in `he`; no string is shown as reviewed |
| TC-RTL-07 | Tables at 320 px | Scroll regions with a labelled, focusable container; the key column stays visible (sticky) |
| TC-RTL-08 | Report sheet in `he` | The English constants and the Hebrew text are both present; the sheet is readable and the watermark is intact |
| TC-RTL-09 | Locale switch mid-journey | State (selection, run) is kept; strings change; focus is not lost |
| TC-RTL-10 | Visual spot-check | Screenshots of the five routes in en and he, light and dark, at 320, 768 and 1440 are captured for human review (not an automated pass/fail) |

## 9. Accessibility (TC-A11Y)

| ID | Case | Expected |
|---|---|---|
| TC-A11Y-01 | axe on every demo route | Zero violations in en and he, light and dark, and in forced colors |
| TC-A11Y-02 | Keyboard-only journey | The whole path (dashboard to report, including dialogs) is completed with the keyboard; focus is always visible |
| TC-A11Y-03 | Focus not obscured | At 1280×560, 768×600 and 800×400 the focused control is not hidden behind the protected marking or status bar |
| TC-A11Y-04 | Names, roles, states | Tablist, log, step list, meter list, outline, dialogs and disabled-with-reason controls expose the names and states of CONTENT_DECK section 15 |
| TC-A11Y-05 | Not colour alone | Status chips, meters, current step, selected row and findings each carry text and an icon; checked in forced colors and with colour removed |
| TC-A11Y-06 | 320 px reflow | No horizontal page scroll in any locale; tables scroll inside their own region |
| TC-A11Y-07 | Reduced motion | With `prefers-reduced-motion: reduce` nothing animates; nothing advances by itself in any setting |
| TC-A11Y-08 | Live regions | One polite announcement per user action on the run console; no announcement on pending counts; no assertive region in S1 |
| TC-A11Y-09 | Focus management | Route change focuses the page heading; row selection focuses the detail card; dialogs trap focus and return it |
| TC-A11Y-10 | Target size | Interactive controls meet the existing control-size token |

## 10. Safety, labelling and simulation isolation

### 10.1 Safety and labelling (TC-SAFE)

| ID | Case | Expected |
|---|---|---|
| TC-SAFE-01 | Protected markings | Both markings present on every demo route in en, he, en-XA, he-XB, light, dark and forced colors; unchanged after every demo control is used |
| TC-SAFE-02 | Provenance chip | Every data block (KPI group, tables, detail cards, readings, outline, report) has a `synthetic_demo` chip in its heading or caption (DOM check) |
| TC-SAFE-03 | Watermark | Present as real text in the DOM and in the print stylesheet (if any is added later); computed visibility, display and opacity above a stated threshold; not removable by locale, theme or forced colors |
| TC-SAFE-04 | Lexicon over rendered pages | The visible text of every demo route, in en and he, passes the lexicon guard |
| TC-SAFE-05 | No record actions | No control, link or menu item is named or labelled approve, sign, issue, release, publish, export or certify; the "Not approvable" notice and the disabled "Record actions: unavailable" control are present with their reason |
| TC-SAFE-06 | Metrology slots | Every metrology slot on screen reads `Input required` or "not evaluated" with its marker; no limit, tolerance, test-point value, range, interval, standard or uncertainty text exists |
| TC-SAFE-07 | No identity surface | No login, user menu, persona control, role or "signed in as" text; the run says "scripted operator step", never a person |
| TC-SAFE-08 | No wire or safety text | No SCPI or command text, resource name, transport, hazard class or safety value is rendered |
| TC-SAFE-09 | Wording of results | The words "pass", "fail", "within limits as a conclusion", "compliant" never appear; limit-check cells read "Not evaluated" |
| TC-SAFE-10 | Reports | The report sheet is the only place with report-like content; it carries the title, watermark, band and negations in every state it can be shown |

### 10.2 Simulation isolation (TC-ISO)

| ID | Case | Expected |
|---|---|---|
| TC-ISO-01 | Rehearsal build: demo routes | `#/demo-dashboard`, `-work`, `-job`, `-run` and `-report` show the existing Not Found page; navigation and palette list none |
| TC-ISO-02 | Rehearsal bundle contents | No demo sentinel, route id, component name (`ReportSheet`, `Watermark`), message prefix `demo.`, fixture id prefix (`SYN-`, `SIM-RUN`, `DEMO-RPT`) or fixture string in any emitted file |
| TC-ISO-03 | Test bundle contents | The same markers are present (proves the check can fire) |
| TC-ISO-04 | Network | Zero non-loopback requests during the full journey; no fetch, XHR, WebSocket or beacon from demo code |
| TC-ISO-05 | Storage and cookies | `localStorage`, `sessionStorage`, IndexedDB and cookies are never written; empty at the end of the journey |
| TC-ISO-06 | Boundary lint | `pnpm test:ts-boundary` passes with no contract weakened; demo code imports only `@calos/ui-kit`, `@calos/i18n`, `@calos/domain-types` and React |
| TC-ISO-07 | Dependencies | The lockfile and `package.json` dependencies are unchanged; `approvedExternal` is not edited |
| TC-ISO-08 | Determinism grep | `apps/web/src/demo/**` and the new widgets contain none of `Date.now`, zero-argument `new Date()`, `Math.random`, `setTimeout`, `setInterval`, `requestAnimationFrame` (lint plus a grep test) |
| TC-ISO-09 | Existing assertions | No existing test assertion, gate, workflow, ADR, protected marking or schema is edited; the evidence file lists each unavoidable edit to an existing test with its reason |
| TC-ISO-10 | No instrument path | The demo has no import of or route to any transport, driver, broker or Station Agent code |

## 11. Negative and mutation checks (TC-NEG)

Each guard is shown to fail on a deliberately broken input, in the PR's test run or in a recorded local mutation run.

| ID | Mutation | Guard that must fail |
|---|---|---|
| TC-NEG-01 | Add a real unit symbol to a fixture; add a `tolerance` property; change a reading to a number; add an email-like string | FX-G-04, -06, -05, -08 |
| TC-NEG-02 | Insert "calibrated", "approved" and a Hebrew banned stem into a message; add an unlisted `pass` | Lexicon guard (en and he) |
| TC-NEG-03 | Hide the watermark by CSS (`display:none`, `opacity:0`) and by a prop; remove it in forced colors | TC-SAFE-03 |
| TC-NEG-04 | Leave the sentinel or a fixture id in the Rehearsal bundle (tree-shaking removed from the build) | TC-ISO-02 |
| TC-NEG-05 | Remove `heStatus` or set it to a reviewed value | TC-FX-03, TC-MSG-02 |
| TC-NEG-06 | Add an `approve` button to the report | TC-SAFE-05 |
| TC-NEG-07 | Add a `setTimeout` that advances the run | TC-ISO-08, TC-FN-20 |
| TC-NEG-08 | Write to `localStorage` | TC-ISO-05 and the existing lint |
| TC-NEG-09 | Rename a test file to `*.test.ts` inside `ui-kit` | The discovered-versus-executed check |
| TC-NEG-10 | Change one scripted event key | TC-FX-15 (golden vector) |

## 12. Manual acceptance (TC-MAN), not verified until a named person runs them

| ID | Case | Result to record |
|---|---|---|
| TC-MAN-01 | NVDA (Windows) reads the whole journey in en and he: headings, tables, the log, dialogs, disabled reasons | Pass/fail per route, notes |
| TC-MAN-02 | JAWS (Windows) on the same journey | Same |
| TC-MAN-03 | VoiceOver (macOS or iOS) on at least the dashboard and report | Same |
| TC-MAN-04 | Windows High Contrast themes (at least one light and one dark): text, borders, focus ring, protected markings, watermark | Screenshots, notes |
| TC-MAN-05 | Zoom 200 and 400 percent in en and he: no loss of content or function | Notes |
| TC-MAN-06 | Windows display scaling 125, 150, 200 percent | Notes |
| TC-MAN-07 | Other browsers: Edge, Firefox, Safari. Edge is also planned in WP-1A-1e-B | Which were run; anything not run is listed as not verified |
| TC-MAN-08 | Hebrew read-through by a native reader and the linguist | Corrections feed CONTENT_DECK; the status stays `needs_review` until a human changes it |
| TC-MAN-09 | Stakeholder walk-through of the five-minute story with a person who did not build it | Where did they hesitate? Did anyone read it as a real calibration? Any wording to change? |
| TC-MAN-10 | Print preview and browser "save as PDF" of the report page (not a supported feature) | Record what appears; nothing is promised, and a missing watermark is a defect to report |

## 13. Not covered (S2 and beyond)

Registry, customers segment and new-work-order form, standalone procedure route, interrupted-run and fault scenarios, `BarChart`, navigation grouping, print stylesheet, auto-play, exact-decimal helper, synthetic limits (DV-DEC-02 option B). Each needs its own cases before it is built.

## 14. Commands (verified in `AGENTS.md` section 6 and `README.md`; the `just` targets, Docker Compose and database migration are not claimed)

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm check:ts
pnpm check:browser-types
pnpm lint:ts
pnpm lint:logical-css
pnpm test:ts-boundary
pnpm test:design-tokens
pnpm test:schema-vectors
pnpm test:frontend
pnpm build:web
node tools/check_frontend_bundle.mjs
pnpm test:e2e
python tools/check.py
```

For the Rehearsal bundle, build with `VITE_ENVIRONMENT_KIND=production_rehearsal` and run the bundle check again. Pre-existing totals (for example the boundary-probe count) are reported as measured by that PR, never copied from this document.

## 15. Defects and stop-ship rules

| Severity | Definition | Rule |
|---|---|---|
| S0 | A claim-word, missing or hidden protected marking or watermark, an approve/sign/issue/export action, a real unit, limit, tolerance or standard on screen, a Rehearsal-bundle leak, a network or storage write, personal-looking data | **Stop.** Fix before anything else; the PR is not reviewed further |
| S1 | A broken journey step, an axe violation, a keyboard trap, a missing Hebrew key, a wrong event order | Fix before merge |
| S2 | Layout defect at a listed viewport, unclear wording, an unreported manual item | Fix or record with the owner's acceptance |
| S3 | Cosmetic | Record |

## 16. Evidence format (for each code PR)

`docs/demo/EVIDENCE*.md` contains: a criterion-to-case table with the file and test name that covers each case; every command with its output counts and versions; discovered-versus-executed test counts; the guard negatives (TC-NEG) with outputs; both Test and Rehearsal bundle check outputs; screenshots (en and he, light and dark, 320, 768 and 1440); the list of edits to existing tests with reasons; both CI events for the exact final SHA, first attempt; and an honest list of what was **not verified** (at least TC-MAN-01 to -10 unless run).

## 17. Owner review checkpoints (nothing below is checked)

| ID | Checkpoint | Who | Evidence | Status |
|---|---|---|---|---|
| TP-RC-01 | This test plan reviewed and accepted as the basis for PR-1 to PR-3 | Owner | Owner record | Open |
| TP-RC-02 | The lexicon lists (en and he) and the allow-list accepted (links to CD-RC-04) | Owner, linguist | Owner record | Open |
| TP-RC-03 | Manual cases TC-MAN-01 to -10 assigned to named people, or explicitly deferred and recorded as not verified | Owner | Owner record | Open |
| TP-RC-04 | Browser scope for acceptance decided (Chromium only automated; which others, when) | Owner | Owner record | Open |
| TP-RC-05 | Stop-ship rules (section 15) accepted | Owner | Owner record | Open |
| TP-RC-06 | An independent reviewer named for the test code of PR-1 (R1) and PR-3 (R3) | Owner (DV-DEC-09) | Owner record | Open |

## 18. Open questions

| ID | Question | Default if unanswered |
|---|---|---|
| TP-Q1 | Is a Firefox or WebKit Playwright project wanted for the demo suite (a `playwright.config.ts` change owned elsewhere), or is Chromium plus manual checks enough for S1? | Chromium plus manual |
| TP-Q2 | Who authors the Hebrew banned-stem list and maintains it? | The linguist, with the owner's approval |
| TP-Q3 | Repeat count for stateful e2e flows under load, to be reported in the evidence? | At least 10 consecutive runs of the full journey |
| TP-Q4 | Is a visual-regression screenshot baseline wanted? | No; screenshots are for human review only |

## 19. Sign-off record (intentionally empty)

| Checkpoint | Reviewer | Date | Decision | Comments |
|---|---|---|---|---|
| TP-RC-01 | | | | |
| TP-RC-02 | | | | |
| TP-RC-03 | | | | |
| TP-RC-04 | | | | |
| TP-RC-05 | | | | |
| TP-RC-06 | | | | |

No row above is filled in by an agent.
