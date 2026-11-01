# VISUAL_PROCEDURE_DESIGNER_SPEC.md

| | |
|---|---|
| Status | Draft 0.1 |
| Product area | The drag-and-drop workflow designer for `Procedure`, `SubProcedure` and `Calculation` items |
| Related | [PROCEDURE_SCHEMA Part B–C](PROCEDURE_SCHEMA.md) · [NO_CODE_ARCHITECTURE §7, §9](NO_CODE_ARCHITECTURE.md) · [VISUAL_APPLICATION_BUILDER_SPEC](VISUAL_APPLICATION_BUILDER_SPEC.md) · [ADR-0006](adr/0006-structured-bounded-procedure-ir.md) |

## 1. Purpose and user
Let a calibration engineer build, understand, test, debug, compare and roll back calibration workflows visually, while the tool guarantees what code review would otherwise have to: termination, definite assignment, dimensional correctness, hazard visibility, correct resume behavior.

## 2. Canvas model: a structured flow view

The canvas draws the stored **block tree** (ADR-0006) as a flow diagram. Users cannot create arbitrary back-edges; loops and branches are **containers** or **diverging lanes**, so every diagram maps to the bounded IR.

```
 ┌─ SETUP ───────────────────────────────────────────────────────────┐
 │ (1) Confirm connections      [operator.confirm]                    │
 │ (2) Preflight: warm-up       [flow.delay  ⏱ ]                      │
 ├─ PHASE: As Found ─────────────────────────────────────────────────┤
 │ ┌ for each test point (max 200) ───────────────────────────────┐   │
 │ │ (3) Apply source          [source.apply   H2 🔒 resumable]   │   │
 │ │ (4) Configure UUT         [driver.call    H1 idempotent]     │   │
 │ │ (5) Acquire readings      [measure.acquire  ×N]              │   │
 │ │ (6) Check limits          [evaluate.limits]                  │   │
 │ │   ◇ outside limits? ─yes→ (7) Record OOT flag  ─┐            │   │
 │ │                     └no─────────────────────────┴→ (8) Record│  │
 │ └──────────────────────────────────────────────────────────────┘   │
 ├─ PHASE: Adjustment (optional, when OOT) ──────────────────────────┤
 │   … [adjust.apply  H3 🔒🔒 non_repeatable]                          │
 ├─ PHASE: As Left (optional) ───────────────────────────────────────┤
 ├─ TEARDOWN (always) ───────────────────────────────────────────────┤
 │ (9) Source off  (10) Restore instrument local                      │
 └─ SAFE-STATE (on abort/fault) ─────────────────────────────────────┘
```

Features: pan/zoom/minimap; collapse/expand containers; swimlanes by role (UUT, Reference source, Operator) as an optional **lane view**; node badges show hazard class, resume policy, retry, timeout, evidence; error/warning markers; "execution path highlighting" in simulation; **outline view** (tree) synchronized with the canvas (and the keyboard-accessible alternative).

## 3. Palette
Groups (from the catalog; plugin-provided blocks show an origin badge):
- **Flow**: if, switch, foreach, while, repeat-until, delay, wait-until, try/handle, call sub-procedure, checkpoint, fail/abort
- **Instrument**: driver call, source apply/off, measure acquire
- **Operator**: instruct, confirm, input, choice, capture
- **Compute**: set variable, calculation
- **Metrology**: evaluate limits, evaluate decision, record condition, record result
- **Phases**: phase container, adjust, repair record
- **Library**: shared sub-procedures and snippets (versioned; "insert as reference" vs "insert as copy")
Search by name/intent ("wait for stable reading"), drag or `Enter` to insert at the selected position, recently used and favorites.

Constraints surfaced at drop time: *"This node needs a role bound to an instrument with capability X"*, *"Loops must be inside a phase"*, *"Hazardous op: requires permission driver.author.hazardous"*.

## 4. Node anatomy and the property inspector
The inspector is generated from the node's catalog schema, with tabs:
| Tab | Content |
|---|---|
| **Main** | Type-specific fields (typed pickers; expression fields with the shared expression editor) |
| **Bindings** | Inputs/outputs: choose variables/params/outputs of earlier nodes (only definitely assigned ones listed); dimension displayed |
| **Flow control** | `when` guard, timeout, `max_iterations`, delays |
| **Errors & retries** | ErrorPolicy builder (match codes → actions); disallowed combos disabled with explanation |
| **Resume** | `resume_policy` (idempotent/resumable/non_repeatable) with derived minimum shown; "what happens after interruption here" description generated from policy; checkpoint toggle |
| **Evidence** | Evidence required/produced (links to `evidence_requirements`) |
| **Operator text** | Localized title and instructions (he/en) with preview |
| **Permissions** (read-only) | Derived: hazard class, required permissions, safety profile coverage |
| **Notes** | Author notes; review comments thread |

## 5. Variables, parameters and bindings
- **Variables panel**: declared variables (typed: quantity with dimension, decimal, int, bool, string, enum, list, record). Scope: procedure, phase, loop (`item`), sub-procedure.
- **Parameters**: inputs to the procedure (author-editable, operator-editable, or fixed); each has type, bounds, default (or **Input required**).
- **Binding pickers** list only valid, type-compatible, definitely assigned sources; dimension mismatches are rejected at binding time with a message ("expected V, got A").
- **Expression editor** (shared) with block mode and text mode; "Evaluate with sample values"; live type display.
- **Data flow lens**: select a variable to highlight where it is written and read.

## 6. Authoring control flow

### 6.1 Conditional branches
`if`/`switch` nodes show two or more lanes. Condition is an expression of bool type; unreachable lanes (constant conditions) flagged (PR-005). Join is implicit at the end of the container.

### 6.2 Loops
`foreach` over: a spec table's rows (filterable), a list parameter, or a numeric range with step. `while`/`repeat_until` require **both** `max_iterations` and `timeout` fields — the UI cannot create them without values. Loop variable `item` typed from the source. "On limit reached": fail / escalate / continue (explicit).

### 6.3 Delays and waits
`flow.delay` fixed duration (quantity time). `flow.wait_until` condition + poll interval + timeout + on-timeout policy. In simulation, optional time compression.

### 6.4 Retries
Configured on a node's **Errors & retries** tab: `retry n times, backoff` allowed only for `idempotent`/`resumable` nodes with hazard < H2. Each retry is a new attempt number; previous attempts retained as superseded evidence.

### 6.5 Controlled error handling
`try` container with **handlers**: match error codes (catalog: `E_TIMEOUT`, `E_INSTRUMENT_ERROR`, `E_PARSE`, `E_SAFETY_VIOLATION` (non-catchable: always fails closed), `E_EVAL`, …) → handler lane (e.g., escalate to operator with choices, record and continue, abort). `finally` lane runs always (cannot contain H2+ except safe-state-eligible ops).

### 6.6 Sub-procedures
- **Extract to sub-procedure**: select nodes → wizard infers inputs/outputs (from variables crossing the boundary), names them, creates a `SubProcedure` draft, replaces the selection with a `flow.call`.
- Signature (typed params and returns) is part of its contract; changing it is a **breaking** change (major).
- Versions: calls pin an exact version at publish; the canvas shows "newer version available" with diff and impact preview.
- Expand-in-place view for reading; edit opens the sub-procedure draft.

## 7. Manual technician instructions
`operator.instruct` (restricted Markdown, localized, images/video from assets with alt text), `operator.confirm` (checkbox + optional required role, optional evidence), `operator.input` (typed value with bounds), `operator.choice`, `operator.capture` (file/photo; MIME allow-list). Each has a preview as the operator would see it (using the actual UI runtime), including RTL.

## 8. Measurement, calculation and pass/fail authoring
Guided flow for a typical measurement block:
1. **Source/apply** (optional) → bind reference role and nominal from table row.
2. **Configure UUT** → pick driver op; args filled from table columns (typed).
3. **Acquire** → count, settle, aggregate functions (from library; `pending_review` badge when applicable), outlier policy (MI-24: must be declared; default is *none*; all attempts retained).
4. **Evaluate limits** → choose measured/nominal expressions and the limit row selector; the inspector shows the resulting **limit band** for the sample row and the inclusivity convention (declared, no default).
5. **Record result** → map to dataset path (autocompleted from report contract).
Result labelling reminder in the UI: "This is a **limit check**. A conformity decision requires an approved uncertainty budget and decision rule." (`evaluate.decision` is available only when prerequisites exist in the application.)

## 9. As Found / As Left, adjustment and repair
- The **phase** container enforces ordering: `as_found` first; `adjustment` optional and `when`-guarded (e.g., any out-of-tolerance); `as_left` after adjustment (or lab policy: skip with "as left = as found").
- `adjust.apply` appears only if the instrument model has `adjust.supported`, the driver defines H3 ops, and the user has `driver.author.hazardous`; the node requires before/after evidence, forces `non_repeatable`, and shows the **Safety / hazardous** approval path banner. For real transports it is **disabled** until validated (MR-AFL-07).
- `repair.record`: structured manual record (description, parts, evidence, optional approval) — no instrument I/O.
- Data from phases is kept separate in the dataset; the designer shows the dataset tree being built (`as_found.points[]`, `adjustment`, `as_left.points[]`).

## 10. Pause, resume and recovery configuration
- **Resume simulator panel**: choose any node → "Simulate interruption here" → shows the exact recovery plan the engine would execute (reconcile steps, operator decisions required, nodes re-run).
- Defaults derived from hazard class; authors can only tighten. `flow.checkpoint` inserts a durable resume point (journaled).
- **Pause points**: operator-initiated pause allowed at node boundaries; nodes may declare `pausable_mid_node` (e.g., long acquisitions) with cooperative cancel.
- Safe-state lane editor: only safe-state-eligible driver ops listed.
- Report: "Recovery matrix" table (node → policy → behavior) generated for review/approval.

## 11. Static analysis panel
All PR-xxx findings (PROCEDURE_SCHEMA C.6) with severity, location (click to select node), explanation, and **quick fixes** (e.g., "Add max_iterations", "Insert teardown source off", "Make resume_policy non_repeatable", "Convert units"). Findings recomputed incrementally on every command (local checks in a worker; server checks debounced). Publish-blocking items marked.

## 12. Hazard visibility
Hazard overlay toggle colors nodes by derived hazard class and shows a **hazard path summary** (all H2+ operations in execution order with Safety Profile coverage status). Reviewers see this in the review screen.

## 13. Simulation and debugging

| Feature | Behavior |
|---|---|
| Scenario run | Pick `SimulationProfile` scenario (nominal/marginal/failing/custom) and operator-response mode (interactive/scripted) |
| **Breakpoints** | Click node gutter; conditional breakpoints (expression over variables); break on error/safety violation |
| **Stepping** | Step over / into (sub-procedure) / out / continue / pause |
| **Variable inspector** | Live values with units, types, history sparkline; edit-in-debug (what-if override, flagged `debug`, non-approvable) |
| **Expression trace** | Click any evaluated expression to see operand tree with intermediate Quantities |
| **Wire log** | Commands/responses per `driver.call` (simulated) |
| **Fault injection** | Timeout at command N, disconnect, garbled response, error-queue entry, safety violation attempt; verify handlers |
| **Time compression** | Delays/waits run faster in simulation |
| **Journal view** | Event stream with filter by node; export |
| **Kill & resume test** | "Kill agent at node X" then Resume; compares final dataset to uninterrupted run |
| **Coverage** | Highlights nodes/branches executed across all scenario runs; uncovered branches listed |
| Safety | Debug runs use the production engine but only `SimulatorTransport`; results flagged `debug` + `simulated`; never approvable |

## 14. Version comparison and rollback
- **Visual diff** between two versions (or draft vs published): added/removed/changed/moved nodes colored; property-level changes in side panel; expression diffs normalized by canonical source; metrology what-if on test vectors; localization and UI changes summarized.
- **Rename-aware**: node IDs are stable, so moves are not shown as delete+add.
- **Rollback**: from the version list choose an earlier approved version → "Make assignment" flow (Deployments) — the procedure itself is never mutated; "Restore as new draft" creates a new draft from an old version for forward fixes.
- Change class suggestion appears in the diff header with reasoning (e.g., "Test-point table reference changed → metrological").

## 15. Reusable components
Library of sub-procedures, calculation snippets, driver op snippets, evidence templates. Each shows usage count, version history, owners, and impact view. Cloning preserves lineage (`derived_from`).

## 16. Accessibility and ergonomics
- Full keyboard operation: arrow-key navigation across nodes in outline order, `Enter` open inspector, `Insert` add node after, `Delete` remove (confirm if referenced), `Ctrl+Z/Y`.
- Screen-reader semantics via outline view; canvas has ARIA roles with live announcements for validation changes.
- Color is never the sole carrier of hazard/state (icons + text).
- RTL: canvas flow direction mirrors (top-to-bottom stays; horizontal lanes mirror); node text direction follows content language; numeric/unit fragments LTR.

## 17. Performance and limits
Virtualized rendering for large procedures; incremental validation; hard schema limits (max nodes, nesting depth, loop bounds) enforced and shown. Targets set from Phase-1 benchmarks (e.g., smooth interaction at the documented node count).

## 18. MVP cut (Phase 1)
In: sequence, if, foreach (table/list), bounded repeat_until, delay, wait_until, try/handle (basic handlers), call sub-procedure (+ extract), driver call, source apply/off, measure acquire, compute set/calc, evaluate limits, record result/condition, operator instruct/confirm/input, phases (as_found, as_left), teardown/safe_state, outline + canvas, inspector, expression editor (text + basic block), static analysis with quick fixes, breakpoints/stepping/inspector/fault injection/kill-and-resume in Simulation Lab, structural diff, rollback via deployments.
Deferred: switch, while (non-bounded variant already disallowed), operator.capture media pipeline, adjustment/repair (model supported; authoring UI disabled for real instruments), lane view, coverage analysis, time compression, scripted operator responses, library marketplace.

## 19. Acceptance criteria

| ID | Criterion |
|---|---|
| AC-PD-01 | The designer cannot produce a procedure that violates structural rules (unbounded loop, retry on non-repeatable, H2+ outside lifecycle rules); attempts are blocked at edit time with explanation. |
| AC-PD-02 | Every PR-xxx lint rule has a fixture that triggers it and a test asserting the designer shows it with the correct location and quick-fix where defined. |
| AC-PD-03 | Round-trip: any procedure edited via canvas serializes to schema-valid JSON; loading it back renders an identical canvas (property-based test over generated procedures). |
| AC-PD-04 | Extract-to-sub-procedure preserves behavior: simulation journal (modulo node IDs/call frames) of before/after is equivalent on a corpus. |
| AC-PD-05 | Kill-and-resume at *every node boundary* of the demo procedure yields a final dataset identical to the uninterrupted run (excluding attempt metadata). |
| AC-PD-06 | Breakpoint, step, inspector and fault injection work against the production engine and cannot reach a non-simulator transport (NFR-20 test). |
| AC-PD-07 | Visual diff of two versions lists exactly the changed nodes/properties found by an independent structural diff oracle on generated mutations. |
| AC-PD-08 | Keyboard-only user completes AC-NC-03 using the outline view; axe checks pass. |
| AC-PD-09 | A moderated usability study with ≥ N calibration engineers (N set in Phase 1) shows task success for building a measurement loop with limits without assistance (target defined by UX research). |
