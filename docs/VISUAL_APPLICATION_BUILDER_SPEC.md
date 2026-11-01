# VISUAL_APPLICATION_BUILDER_SPEC.md

| | |
|---|---|
| Status | Draft 0.1 |
| Product area | The "Builder" shell of the web app: the graphical environment in which calibration applications are created, tested, published and maintained |
| Related | [NO_CODE_ARCHITECTURE](NO_CODE_ARCHITECTURE.md) · [VISUAL_PROCEDURE_DESIGNER_SPEC](VISUAL_PROCEDURE_DESIGNER_SPEC.md) · [PROCEDURE_SCHEMA](PROCEDURE_SCHEMA.md) · [CONFIGURATION_GOVERNANCE](CONFIGURATION_GOVERNANCE.md) · [UI_UX_SPEC](UI_UX_SPEC.md) |

> **Deployment scope (ADR-0024):** the Builder exists only in **Test** deployments. Production has no authoring; configuration arrives via the Release workflow (§11).

**Primary user:** the Calibration Engineer (P5) — a trained metrologist who does not write code. **Design bar:** every operation in AC-NC-01…10 is completable from the GUI alone, with guidance, validation and undo, without ever seeing JSON (though JSON can be inspected read-only via "View as data" for audit).

> No numeric metrology is shipped. Every metrological field the UI renders shows its **provenance chip** (`synthetic_demo | draft | verified | approved`) and, if missing, an **Input required (MI-nn)** badge that blocks production publish.

---

## 1. Principles

1. **Guided, not blank.** Wizards for first-time creation; expert mode afterwards. Templates and clone-from-existing everywhere.
2. **Make wrong things hard.** Typed pickers instead of free text; dimension-aware inputs; live validation with fix suggestions; hazardous items visibly marked.
3. **Preview constantly.** Every designer has a live preview using the production renderer/engine against a simulator.
4. **Everything is a draft until published**; every edit is undoable; leases prevent collisions.
5. **Explain.** "Why is this required?", "What uses this?", "What changed?" are one click away.
6. **Same workspace, many kinds.** Property inspectors are generated from schemas (consistent UX); only the central canvases are specialized.

## 2. Information architecture

```
Builder
├─ Home                      (my drafts, items awaiting review, recent, validation failures, alerts)
├─ Applications              (list; create; clone; import)           ── §3
│   └─ <Application>         (overview · contents · requirements · tests · publish · versions · deployments)
├─ Instruments               (manufacturers · families · models)     ── §4
├─ Drivers                   (driver definitions · command libraries · simulation profiles)  ── §5
├─ Procedures                (procedures · sub-procedures · calculations)   ── Procedure Designer spec
├─ Metrology                 (spec tables · limits policies · corrections · budgets · TUR · decision rules · CMC · units · rounding)  ── §6
├─ Screens                   (forms · pages · dashboards · navigation · themes)   ── §7
├─ Reports                   (templates · dataset contracts)         ── §8
├─ Localization              (bundles · glossary)                    ── §9
├─ Safety                    (Safety Console: LSMA authors · Safety Officer / Quality Manager approve) ── §5.8
├─ Simulation Lab            (scenarios · runs · app tests)          ── §10
├─ Review & Releases         (review queue · approvals · publish · packages · release candidates → Production)   ── §11
├─ Deployments               (assignments · canary · rollback · station status)
└─ Library                   (shared components; usage and impact)
```

Global affordances: **command palette** (`Ctrl/Cmd+K`), universal search by key/title/label/MI-id, **breadcrumbs with version badges**, **lease banner** ("You are editing · saved r15" / "Read-only: edited by X"), **validation drawer** (findings by severity with click-to-locate), **Where used** panel, **History** panel.

## 3. Application workspace

An **Application** (`ApplicationManifest`) is the unit of publishing and deployment.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ‹ Applications / DMM Verification · draft r23    ● Saved   [Validate] [Submit]│
├──────────────┬───────────────────────────────────────────────────────────────┤
│ Overview     │  Contents                          Requirements (auto)         │
│ Contents  ◄  │  ▸ Instrument model  34401A  v1.0  ✓   Catalog: step.* 1.0     │
│ Requirements │  ▸ Driver            …       v1.2  ✓   Transports: visa        │
│ Tests        │  ▸ Safety profile    (sim)   v1.0  ⚠   Runtime ≥ 1.0.0         │
│ Publish      │  ▸ Procedures (2)                  ✓   Plugins: none           │
│ Versions     │  ▸ Metrology (spec table, rule)    ⚠ synthetic_demo            │
│ Deployments  │  ▸ Screens (1)  ▸ Report (1)       ✓                           │
│              │  [+ Add component ▾]  [Clone from…]  [Import component]        │
│              │  Intended modes: ☑ Simulation  ☐ Production (blocked: 3 issues)│
└──────────────┴───────────────────────────────────────────────────────────────┘
```

Capabilities:
- **Create** via wizard: *Choose instrument → define/choose driver → pick a procedure template or build → metrology → screens → report → test → publish*. Each step can be skipped and revisited; progress checklist always visible.
- **Compose**: add components from library (shared sub-procedures, command libraries, calculations, themes) with version-range pickers; shows "upgrade available".
- **Clone application**: deep-clone into new keys (copies as drafts; provenance retained as `derived_from`).
- **Requirements** tab: computed building-block/runtime/plugin requirements; **Compatible stations** list with reasons for incompatibility.
- **Tests** tab: application tests (scenarios), last run status per scenario.
- **Intended modes**: simulation-only vs production; production readiness checklist lists every blocking `$input`, `synthetic_demo`, missing safety profile, pending-review function.

## 4. Instrument editor (AC-NC-01)

Entities: Manufacturer (name, aliases for `*IDN?` matching) → InstrumentFamily (shared capabilities/library) → InstrumentModel.

Model editor tabs:
| Tab | Content | Notes |
|---|---|---|
| General | Manufacturer, family, model name, aliases, description, image (allow-listed types) | Clone from existing model |
| Functions & ranges | Table: function, measured/sourced quantity (dimension picker), ranges (Quantity list or **Input required**), resolution info | Each row has provenance chip and source reference field (documentation reference, MI-01) |
| Options | Installed options and how to detect them (driver op + parse rule) or manual declaration | |
| Capabilities | Checklist from capability catalog (`measure.dc_voltage`, `scpi.error_queue`, `adjust.supported`…) | Capabilities gate which step types/ops are usable |
| Identification | Visual rule builder: query op, parse (split/regex), field mapping, match rule (manufacturer list, model regex), mismatch behavior; **live test against SimulationProfile** | See §5.3 |
| Connections | Allowed connection profiles (references into the driver) | |
| Safety & Simulation | Bind Safety Profile and SimulationProfile (create-from-here shortcuts) | Real transports require an approved profile |

## 5. Driver Designer (AC-NC-02)

### 5.1 Layout
```
┌ Driver: <key>  ·  draft r7 ───────────────────────────────────────────────────────────┐
│ [Connections] [Identification] [Commands] [Parsers] [Error handling] [Lifecycle]       │
│ [Libraries] [Simulation] [Test]                                                        │
├───────────────────────────────┬──────────────────────────────────────────────────────┤
│ Commands (12)  [+ New] [Import│  configure_dc_voltage            Hazard: H1  ▾          │
│ from library]                 │  Kind ◉ Write ○ Query     Idempotent ☑                 │
│  ● identify        H0         │  Template  CONFigure:VOLTage:DC {range},{res}          │
│  ● configure_dc_v  H1 ⚠unver. │            └─ placeholders detected: range, res        │
│  ● read            H0         │  Parameters                                            │
│  ● output_on       H2 🔒       │   range  quantity [V] bounds [Input required MI-02]    │
│  ● store_cal       H3 🔒🔒      │          format [engineering ▾] digits [auto]          │
│                               │   res    quantity [V] optional                         │
│                               │  Response parser  (writes: none)                       │
│                               │  Timeout [2 s]  Retry [0]  (retry off: not idempotent) │
│                               │  Verification: ◉ unverified_against_manual  ○ verified │
│                               │     source ref [Programming reference §… ]              │
│                               │  ▶ Preview wire text: CONFigure:VOLTage:DC 1,0.001 …   │
└───────────────────────────────┴──────────────────────────────────────────────────────┘
```

### 5.2 Connections (LAN/USB/GPIB/serial through supported adapters)
Per connection profile: transport kind (`visa`; others if Class B installed), **resource pattern builder** (select interface type → guided fields: host/port/instance, USB VID/PID/serial, GPIB board/address, COM port), serial settings (baud, data/stop bits, parity, flow control), termination (read/write chars, EOI), timeouts, open retries. **Capability notice:** "Station requires VISA backend / adapter X" is added to requirements. Validation: patterns compile, values within standard sets, no secret fields (credentials go through station secret store references).

### 5.3 Identification
Rule builder: choose identify op → choose parser (delimited / regex) → map groups to `manufacturer/model/serial/firmware/options` → define match levels (`exact`, `partial`) → define **simulation marker** field. A table of **test strings** (sample responses) shows parse + match outcomes live (authoring-time unit tests, stored as test vectors).

### 5.4 Commands (SCPI templates)
- **Template editor** with tokenized placeholders `{name}`; syntax check (no `;`/CR/LF unless "compound" toggled — needs permission), parameter auto-detect.
- **Parameter editor**: type (quantity with dimension picker, integer, enum with token map, boolean format, constrained string pattern), bounds (must be provided for `quantity` params of H1+ — or flagged), default, optional, format style (fixed/scientific/engineering; digits; SI prefix handling; unit suffix), **wire-text preview** with sample values and rejected-value examples.
- **Hazard class** selector with definitions; H2+ locks behind permissions and shows the red "Hazardous" ribbon; selection changes the retry/idempotency options and approval path (see GOVERNANCE §4).
- **State effects** (e.g., sets `function=dcv`, `output=on`) and **preconditions** (e.g., `output == off`) built with the expression picker.
- **Verification field**: `standard` (IEEE 488.2/SCPI mandated), `verified` (with source reference), `unverified_against_manual` (default for new commands; surfaced in readiness checklist; cannot be `verified` by the author alone for H2+ — needs second person).
- **Import from command library** (e.g., IEEE 488.2 common set) with version pinning; "override" creates a local copy with lineage.

### 5.5 Parsers
Visual builder with **sample-response tester**: choose type (`number_with_unit`, `enum_map`, `delimited_numbers`, `regex_groups`, `ieee_block`, `register_bits`, `scpi_bool`, `string_trim`), configure fields, paste or pick a sample response, see parsed typed result (value, unit, errors). Samples saved as test vectors.

### 5.6 Error handling & lifecycle
- Error-queue query op, loop-until-clear, mapping table (code/regex → severity none/warning/error/fatal → action).
- `init`, `teardown`, `safe_state` sequences are ordered lists of command invocations with argument bindings; safe-state eligibility flagged per command (only commands marked `safe_state_eligible` are selectable).

### 5.7 Simulation tab (declarative simulator)
- Identity (clearly synthetic with marker).
- State variables and **rules table**: match (command pattern picker bound to command templates — no regex needed for common cases), updates, response template using the expression editor; **models** (offset, gain error, noise distribution with seed, drift over time) bound to named **scenarios** (`nominal`, `marginal`, `failing`, custom) — values authored by the user with provenance `synthetic_demo`.
- **Fault injection**: timeouts after N commands, corrupt response, error-queue entries, disconnect; selectable in Simulation Lab.
- "Run a conversation": interactive terminal against the simulator (always available; it never touches hardware).

### 5.8 Safety Profile editor (Safety Console — separate area)
Owned by the **Lab Safety / Metrology Administrator** (`safety.manage`); other roles see read-only views. Form-based editor: applies-to models/roles; **envelopes** per command-parameter or role output (dimension-aware min/max with **Input required MI-35**); forbidden combinations; required states; interlock confirmations (localized); safe-state sequence.
- **Absolute Hardware Limit band:** the signed Hardware Limits Pack entry is displayed read-only behind each envelope control; the editor cannot exceed it (PR-023). If no AHL entry exists for the target, H2+ envelopes are disabled with an explanation ("controlled release required — Capability Matrix 1.18") while simulator-scope profiles remain editable and marked `simulated`.
- **Effective-limit viewer:** AHL ∩ Safety Profile ∩ procedure bounds for any selected command parameter.
- **Coverage:** for each H2+ command in the bound driver, **covered** (green) or **uncovered** (red; blocks real-transport publish and Production release).
- **Approval path indicator:** shows required approvers computed from the change classification — Safety Officer always (≠ author); Quality Manager additionally if metrological/compliance-affecting (MI-35); policy-added approvers. Approvals bind to the frozen snapshot digest.
- **Impact analysis** before submit: dependent drivers/procedures/applications, assignments, stations, in-flight runs (a withdrawal halts them at the next node boundary).
- **Hardware Limits candidate** (Test only, `hardware_limits.candidate`): author an unsigned pack candidate and export it for the offline threshold-signing ceremony; import of the signed pack happens through the Safety channel. Neither can be edited after signing.

### 5.9 Test tab (communication testing and diagnostics)
Two modes:
1. **Simulator mode** (everywhere): run any command against the SimulationProfile; view wire text, parsed result, state changes.
2. **Station mode** (real instrument; AC-NC-02 for physical devices): requires a **test bundle** delivered to a designated station and executed from the **station's local UI** (central never sends commands). Constraints: H0 only by default; `driver.test.hazardous` + bound approved Safety Profile + on-screen physical-presence confirmation for H2+; blocked if a production run holds the resource; every exchange logged and uploaded as diagnostics evidence. Results (reachability, identification parse, latency stats, error-queue state, timeouts) are attached to the driver's `verification` record.

## 6. Metrology workspace (AC-NC-04)

| Editor | Design |
|---|---|
| **Spec table editor** | Spreadsheet-like grid with typed columns (quantity with unit picker, enum, accuracy expression editor, bool). Row provenance, bulk paste/CSV/XLSX import (CFG) with mapping wizard and error report. Per-row **test vector** (inputs→expected within/outside) runner. Missing values show **Input required**. |
| **Accuracy expression editor** | Term builder: add term (`reading fraction / range fraction / absolute / counts × resolution`), coefficient (Quantity), combination method; live evaluation on a sample reading. |
| **Limits policy** | Select source (manufacturer/lab/customer) using a selector expression over job attributes; inclusivity toggle (required); shows resulting limit band for a sample. |
| **Corrections** | Table of correction values with uncertainty, applicability, source certificate reference. |
| **Uncertainty budget editor** | Component table (name, symbol, type A/B, distribution, value/half-width, DoF, sensitivity expression, evidence ref) → computed u_c, k, U display from the **evaluator** (read-only); test vectors required. |
| **TUR policy** | Pick formula template (expression editor), thresholds (Input required MI-27), action on violation. |
| **Decision rule editor** | Choose kind, set parameters, localized rule text, preview on sample (measured, U, limits) with zone diagram. |
| **CMC table** | Range/function → minimum uncertainty (MI-18) and enforcement action. |
| **Unit editor** | Add derived units (dimension vector + exact factor), conversion tester. SI base locked. |
| **Rounding rules** | Rule list with preview on sample values (presentation only). |
| **Expression editor (shared)** | Text with syntax highlighting + **block mode** (typed pickers for non-text users), autocomplete of scope names/functions/units, inline type & dimension display (`: quantity<V>`), error squiggles with fix hints, **evaluate with sample values**, "Explain" tree of intermediate results. Cannot save invalid expressions into a published item; drafts may hold invalid with warning. |

## 7. UI and Form Builder

### 7.1 Scope (FR-UIB-01..04)
Forms & fields, tables & columns, instrument-specific operator screens, custom pages, menus/navigation, dashboards/widgets, validation rules, conditional visibility, themes/branding, localization.

### 7.2 Editor
```
┌ Screen: Operator – DMM verification · draft r4        Preview: [lg ▾] [LTR|RTL] [he|en] [sim data ▾]┐
├──────────────┬──────────────────────────────────────────────────────────┬───────────────────────┤
│ Widget       │  ┌ Reading display ─────────────┬ Progress ───────┐       │ Properties            │
│ palette      │  │ var.reading                  │ tp 3 / 8        │       │ Widget: reading_display│
│ ▸ Display    │  └──────────────────────────────┴─────────────────┘       │ Bind: var.reading  ⓘ  │
│ ▸ Inputs     │  ┌ Table: readings ──────────────────────────────┐        │ Format: auto          │
│ ▸ Tables     │  │ nominal │ reading │ deviation │ limit check     │        │ Visible when: [expr]  │
│ ▸ Charts     │  └───────────────────────────────────────────────┘        │ Span: sm 1  md 2  lg 2│
│ ▸ Prompts    │  ┌ Instruction panel ───────────────────────────┐         │ Validation: [+ rule]  │
│ ▸ Layout     │  └──────────────────────────────────────────────┘         │ A11y label: ⚠ missing │
└──────────────┴──────────────────────────────────────────────────────────┴───────────────────────┘
```
- **Layout**: responsive grid with per-breakpoint placement; drag to place; no free pixel positioning.
- **Binding picker**: tree of data context (params, variables, readings, config tables, ctx), type-filtered by widget slot.
- **Validation rules**: typed expression with localized message; live test.
- **Conditional visibility/enablement**: expression (presentation subset only; metrological functions rejected here).
- **Actions**: choose from catalog (`start_run`, `respond_prompt`, `navigate`, `submit_form`, `open_report`) with permission display.
- **Auto-generate**: "Generate from procedure" produces default screen; customizations stored as overlay to survive regenerate.
- **Navigation/menus**: tree editor (items → targets; role visibility; localized labels; icons from allow-list).
- **Dashboards**: widget gallery (stat tile, table, chart, list, status board) bound to saved queries (catalog-defined data sources only).
- **Themes**: token editor (colors, typography scale, radius, density), logo upload, **live contrast checker (WCAG AA)**, light/dark pair, RTL preview. Publish blocked if contrast fails.
- **Custom pages**: compose from widgets; route and permission settings.
- **Layering view**: "Why is this shown?" shows the resolution chain (system → tenant → lab → application).

## 8. Report and Certificate Designer (AC-NC-06)

```
┌ Report: Results report · draft r9   Dataset: calibration-result@1   Preview: [A4] [he|en] [Sample: nominal|failing|partial] ┐
├──────────────┬──────────────────────────────────────────────────────────┬──────────────────────────────┤
│ Blocks       │  ┌─ Header (logo, lab, title) ─────────────────────┐      │ Block: Table                 │
│ ▸ Text       │  ├─ Instrument details (kv grid) ──────────────────┤      │ Rows: data.as_found.points   │
│ ▸ Data       │  ├─ As Found results (table) ──────────────────────┤      │ Columns [+]                  │
│ ▸ Table      │  ├─ ⟨if As Left present⟩ As Left results ──────────┤      │ Conditional: [expr]          │
│ ▸ Chart      │  ├─ Evaluation statement (decision/uncertainty) ───┤      │ Page break: avoid inside     │
│ ▸ Image      │  ├─ Signatures ────────────────────────────────────┤      │ Locale text keys: ✓          │
│ ▸ Signature  │  └─ Footer (system-injected: config, integrity) ───┘      │                              │
└──────────────┴──────────────────────────────────────────────────────────┴──────────────────────────────┘
        ▒▒ SYSTEM-INJECTED (cannot be edited/removed): simulation watermark/banner · draft legend · config footer ▒▒
```
- **Dataset explorer** (left): the contract tree with types; drag fields into blocks to bind; unmapped/mistyped bindings flagged.
- **Blocks**: heading, rich text (restricted), kv-grid, table (columns, formatting using RoundingRule refs), chart (line/bar/deviation-vs-limits from catalog), image (assets), signature block (role-bound), repeater, conditional section, page header/footer, page-break controls, QR/integrity code placeholder (system).
- **Dynamic text**: localized with ICU placeholders bound to dataset fields.
- **Branding**: logo, fonts (from approved set with Hebrew coverage), colors from theme tokens.
- **Approval/signature workflow**: define signatory roles and the approval steps shown on the document (links to governance workflow).
- **Preview**: server-rendered PDF with sample datasets or **a real run's draft dataset**; side-by-side LTR/RTL; accessibility tagged-PDF check where supported.
- **Template tests**: snapshot approvals (store digest of approved render per sample/locale); changes require re-approval.
- **Rule**: "NOT A CERTIFICATE / SIMULATED" legend and watermark appear automatically whenever the dataset flags say so; the designer shows them as locked overlays.

## 9. Localization workspace
- Key table (key, en, he, status, usage), filter by missing/unreviewed, bulk import/export (XLIFF/CSV — CFG), screenshot context for keys, plural/gender helpers (ICU), RTL preview, **glossary** enforcement (metrology terms; MI-31) with inline warnings when a term deviates.
- Completeness per locale feeds publish gate PR-017.

## 10. Simulation Lab (AC-NC-07)
Run any draft or version against the SimulationProfile using the **production engine** (worker-side, no instrument I/O).
- Scenario picker (`nominal`, `marginal`, `failing`, custom), operator-response automation (scripted answers) or **interactive operator panel**, fault injection, time compression for delays.
- Debug features per Procedure Designer spec §13 (breakpoints, stepping, variable inspector, expression trace).
- Results view: live journal, readings table, evaluations, **draft report preview**, resume test ("kill at node N and resume").
- **Application tests**: save a run configuration + assertions (outcomes, counts, ranges of values, absence of safety violations) as `ApplicationTest`; all must pass to publish.
- Every artefact is flagged `simulated`/`debug` and non-approvable.

## 11. Review, publish, packages, deployments, rollback

| Flow | UI |
|---|---|
| **Validate** | Validation drawer: findings grouped by stage; severity; click-to-locate; quick-fix suggestions |
| **Submit for review** | Summary: change class (auto), diff, impact analysis, test results, readiness checklist; selects reviewers by required approvals |
| **Review** | Reviewer sees structural diff, tests, impact, can comment per node/field, approve/reject on digest |
| **Publish** | Wizard: confirm version bump (min enforced), release notes (localized), dependencies pinned preview, run final pipeline, publish; result: immutable version with digest |
| **Package** | Build `.calapp` in Test; download. Packages enter **Production only** through the Release workflow (no direct import) |
| **Release** | Create Release Candidate (evidence: validation report, app tests, impact analysis, change class) → Test approvals → export signed Release Package; the Production-side import/approval/release screens are in the Admin shell (UI_UX_SPEC §8) |
| **Deploy** | Choose target (lab/group/station), channel (canary/stable), activation policy; compatibility matrix (compatible/incompatible-with-reason); progress board |
| **Version compare** | Pick two versions → kind-aware visual diff (procedure canvas diff, table cell diff, translation diff, UI side-by-side), metrology what-if comparison |
| **Rollback** | From Deployments or Versions: select earlier approved version → impact preview → confirm with reason → new assignment |

## 12. Common editor behaviors
- Autosave per command batch (to draft revision) with visible revision number; offline/connection-lost banner (edits buffered locally ≤ configurable time; blocked beyond).
- **Undo/redo** (command stack) across sessions of the same lease.
- Multi-select, copy/paste (between drafts, across applications, preserving references), keyboard shortcuts documented in-app.
- **View as data** (read-only canonical JSON with digest) for auditors/engineers; no editing.
- Inline help/tooltips linking to metrology rationale (e.g., why inclusivity is required).
- Accessibility: all designers have an **outline/tree view** equivalent to canvas interactions (WCAG 2.2 AA; keyboard-only operability).

## 13. MVP cut (Phase 1) — "minimal but working"

| Area | In MVP | Deferred |
|---|---|---|
| Application workspace | Create/clone, contents, requirements, tests, publish, versions, deployments (single lab) | Wizard polish, library marketplace |
| Instrument editor | Manufacturer/family/model, functions/ranges, identification, bindings | Option detection UI |
| Driver Designer | Connections, identification, commands (H0–H2 authoring; H3/H4 disabled), parsers (number_with_unit, string, enum_map, delimited_numbers, regex_groups), error queue, lifecycle, simulation tab, simulator-mode test | ieee_block/register_bits UI, station-mode test with H2+ |
| Metrology | Spec table editor, accuracy expressions, limits policy, expression editor; read-only budget/decision rule viewers | Budget/TUR/CMC/unit editors |
| Screens | Auto-generated operator screen + form field customization, basic table, themes (limited tokens) | Dashboards, custom pages, menus editor |
| Report | Minimal designer: heading, text, kv grid, table, conditional section, signature placeholder; he/en; preview | Charts, branding assets pipeline |
| Localization | Key table, completeness check | XLIFF, glossary enforcement |
| Simulation Lab | Scenarios, stepping, breakpoints, variable inspector, fault injection (timeout, disconnect), kill-and-resume test, app tests | Time compression, scripted operator responses |
| Governance | Draft/review/approve/publish, SoD, diff, impact (deps + stations), rollback; **Release candidate → export → Production import → independent approval → release**; Safety Console with ADR-0023 approvals and AHL band (simulator-scope pack) | Backups UI, multi-lab release policies, hardware-limits ceremony tooling for real packs |

## 14. Acceptance walkthroughs (non-programmer, GUI only)

Each is automated with Playwright using only UI actions (no API shortcuts, no seeded content beyond the platform's shipped catalog) **and** run as a moderated usability session.

| AC | Walkthrough (abridged click path) | Pass condition |
|---|---|---|
| AC-NC-01 | Instruments → Models → New → pick manufacturer (create "Demo Maker") → family → model name → add function "DC voltage" with unit picker V → ranges "Input required" → capabilities → Save | Draft model validates (warnings only for missing inputs) and appears in palette after publish |
| AC-NC-02 | Drivers → New → Connections: add `visa` profile (GPIB pattern wizard) → Identification: choose `identify` query, delimited parser, map fields, match rule, paste sample IDN, see "exact" → Commands: add `configure_dc_voltage` and `read`, parsers → Simulation tab: define identity + rule for `READ?` → Test (simulator): run identify, configure, read | Parsed identity shown; read returns typed value with unit; validation passes (except explicit unverified warnings) |
| AC-NC-03 | Procedures → New → drag setup, foreach over spec table, driver call, acquire, evaluate, record; extract a step group into sub-procedure; add teardown | Lint clean; canvas shows flow; reuse works |
| AC-NC-04 | Metrology → Spec table: add rows (synthetic_demo provenance), accuracy terms; Procedure inspector → bind standard role; add calculation node; set limits source | Evaluate-with-sample shows within/outside; test vector passes |
| AC-NC-05 | Screens → Generate from procedure → rearrange widgets, add validation and conditional field, switch preview he/RTL | Preview renders with correct mirroring; a11y checks pass |
| AC-NC-06 | Reports → New from template → bind dataset fields → add conditional As Left section → preview in he & en | PDF shows watermark; bindings valid |
| AC-NC-07 | Simulation Lab → pick scenario → run → hit breakpoint → inspect → complete → view draft report → "kill at node & resume" | Resume yields same final data; app test saved |
| AC-NC-08 | Application → Publish wizard → Deployments → select enrolled sim station → compatibility ✓ → assign → station shows active; operator starts run from it | Run completes on station using the published digest |
| AC-NC-09 | Open published app → New draft → change a step/text → validate → submit → approve (second user) → publish v1.1 → deploy | New digest; both versions exist; station runs v1.1 |
| AC-NC-10 | Deployments → Rollback → choose v1.0 → impact preview → confirm | Station activates v1.0; in-flight run (if any) unchanged; audit shows rollback |
| AC-NC-11 | (Test) Release Candidate → approvals → Export; (Production rehearsal) Import → verification findings → independent approvals → Release → Assign canary → stable | Production versions have identical digests; a `synthetic_demo` package is rejected with a specific finding; all steps GUI-only |
| AC-NC-12 | (LSMA) Safety Console → new Safety Profile (simulator-scope) → set envelopes (UI refuses values outside the AHL band) → submit → (Safety Officer) review impact/hazard coverage → approve → (Quality Manager) approve when flagged → publish → assign | Approval path matches classification; author cannot approve; platform admin cannot approve; profile deploys and is enforced in a simulated run |

## 15. Non-functional requirements
- Designers handle procedures up to a documented size (e.g., hundreds of nodes) with virtualization; validation feedback latency perceptually immediate for local checks and bounded for server checks (budgets set from Phase 1 measurements).
- All designers work at ≥1024 px width with keyboard + mouse; tablets supported for review/approval; phones read-only.
- Everything localizable (he/en), RTL-correct including canvases (flow direction mirrors; time/number/unit text remains LTR).
- No secrets in the Builder; asset uploads scanned (type allow-list, size limits).
- Telemetry: UX events (task completion, validation error classes) for usability improvement; no content values.

## 16. Open items
- Exact capability catalog vocabulary (`capabilities`) — maintained in `catalog/` (Phase 0).
- CSV/XLSX import semantics for spec tables (units in headers vs columns).
- Glossary content (MI-31).
