# 06 — Component architecture (frontend and shared contracts)

| | |
|---|---|
| Status | Phase 1 component proposal, aligned with accepted ADR-0001 A1–A4 and ADR-0015 B1–B6 for the scoped WP-1A-1 foundation. Interface sketches are **documentation**, not source files. H-2/GA0-16 remains undecided. |
| Constraint | AGENTS §3: `ui-runtime`, `editor-core`, `designers` use injected host ports, never `api-client` directly; no `any` in `ui-runtime`/`editor-core`; logical CSS only; all text via i18n. Weakening a boundary contract requires an ADR. |

## 1. Package map and responsibilities

```
packages/ts/
  domain-types/      generated from schemas/ (never hand-edited)                    S0→
  api-client/        generated from apps/api/openapi.json                            S0
  i18n/              ICU messages, locale/RTL utils, bidi isolates, pseudo-locales   S0
  ui-kit/            tokens, primitives, chips/banners, data grid, QuantityInput…   S0
  expr-presentation/ TS presentation-subset evaluator + conformance runner          S2
  editor-core/       document model, command stack, patch ops, inspector model       S1
  designers/        ONE workspace package; folders below are internal boundaries
    inspector/       React property inspector (shared by every designer)            S1
    instrument/      model + identification editors                                  S1/S3
    driver/          Driver Designer + command builder + parser tester               S3
    metrology/       spec-table grid, limits policy, calculation, expression editor  S2
    procedure-canvas/ canvas + outline + palette + analysis dock + debug dock        S4
    ui-layout/       screen designer (grid, binding picker)                          S6
    report-page/     report designer (blocks, dataset explorer)                      S6
    i18n-workspace/  key table, completeness, RTL preview                            S1/S6
    safety/          Safety Console (profile editor, AHL band, effective limit)      S3
    release/         release stage tracker, findings, digest compare                  S7
  ui-runtime/        renderer: component registry, binding, actions, layer resolver  S5/S6
apps/web/            composition root: routes, shells, host-port implementations     S0→
```

**Dependency direction (ADR-0001 A1; enforced by eslint-plugin-boundaries):**
`i18n` and `domain-types` have no repository-package imports;
`expr-presentation` → `domain-types`; `ui-kit` → `i18n`;
`editor-core` → `domain-types`, `expr-presentation` (no React or `ui-kit`);
`designers` → `editor-core`, `ui-kit`, `i18n`, `domain-types`,
`expr-presentation`; `ui-runtime` → `ui-kit`, `i18n`, `domain-types`,
`expr-presentation`. `apps/web` is the composition root and the sole product
importer of `api-client`; generated-client tests are the only exception.
No package imports `apps/web`. Internal `designers` folder edges use path
patterns rather than separate workspace packages. Each new package element
and forbidden edge must gain a CI negative probe. Production packages never import or
bundle `design/` (ADR-0001 A4); prototype checks run in separate design CI.

## 2. Host ports (dependency injection)

Designers and the runtime receive ports; `apps/web` implements them over `api-client`, and tests implement them in memory. This is what makes designers testable offline and keeps the central/station split clean.

| Port | Purpose | Key methods (sketch) |
|---|---|---|
| `DraftPort` | Load/save draft, lease, validation | `load(id)`, `applyPatch(id, baseRevision, ops, label)`, `acquireLease(id)`, `heartbeat(id)`, `release(id)`, `takeover(id, reason)`, `validate(id)` |
| `CatalogPort` | Kinds, schemas, building blocks | `kinds()`, `schema(kind, v)`, `catalog()`, `search(q)` |
| `ReferencePort` | Pick/resolve references | `listItems(kind, q)`, `versions(itemId)`, `resolve(ref)` |
| `ExprPort` | Check/evaluate expressions | `check(expr, scope)`, `evaluate(expr, scope, sample)` (preview only) |
| `SimulationPort` | Simulation Lab | `start(target, scenario, faults, breakpoints)`, `events(id)` (async iterable), `control(id, cmd)` |
| `PreviewPort` | Report/UI preview | `reportPreview(draft, dataset, locale)`, `uiPreviewContext(draft)` |
| `MediaPort` | Media upload with scan | `upload(file, purpose)`, `status(id)` |
| `AuthPort` | Principal, permissions, step-up | `me()`, `can(permission, scope?)`, `stepUp(reason)` |
| `AuditPort` | History/blame/diff | `history(id)`, `diff(a, b)`, `impact(versionId)` |
| `NotifyPort` | Toasts, inbox | `toast()`, `inbox()` |
| `TelemetryPort` | UX events (no content) | `event(name, props)` — no-op unless enabled (D-17) |
| Station: `RunPort` | Operator runtime | `createRun`, `start`, `pause`, `abort`, `resume`, `events`, `respondPrompt`, `uiModel` |

Ports return typed results with **stable error codes** (`code`, `title`, `detail`, `errors[]` per API problem+json) so UI error handling is uniform and localisable.

## 3. `ui-kit` component inventory

Every component ships with: states (default, hover, focus, active, disabled-with-reason, read-only, loading, error), LTR/RTL, light/dark, `comfortable`/`compact`, keyboard map, a11y notes, and a story/test page. Components consume tokens only (no raw colours).

| Group | Components |
|---|---|
| **Frame** | `AppFrame`, `TopBar`, `SideNav`, `ContextPanel`, `StatusBar`, **`FrameBadges`** (deployment + mode; non-themeable), `LeaseBanner`, `OfflineBanner`, `ProductionControlBanner`, `Breadcrumb` (with `VersionBadge`, `StatusChip`) |
| **Chips** | `LifecycleChip`, `ProvenanceChip`, `InputRequiredBadge`, `HazardBadge`/`HazardRibbon`, `VerificationChip`, `ModeChip`, `ValidationChip`, `RunStateChip`, `LimitCheckChip`, `IdentityChip`, `TrustTierChip` |
| **Inputs** | `TextField`, `LocalizedTextField`, `NumberField` (integer only), **`QuantityInput`** (decimal string + dimension-restricted unit), **`IntervalInput`** (explicit inclusivity), `EnumSelect`, `ReferencePicker` (version-range), `ExpressionField` (wraps the expression editor), `ProvenanceEditor`, `ToggleGroup`, `DateTimeField` (display-only formatting), `FileDrop` (allow-listed types) |
| **Data** | `DataGrid` (virtualised, sortable, filter chips, column chooser, saved views, keyboard nav, sticky key column), `TreeView` (ARIA tree), `KeyValueGrid`, `DiffViewer` (property list / table / canvas hooks), `JsonViewer` (canonical, read-only, digest header), `Timeline`, `Sparkline` |
| **Feedback** | `ValidationDrawer`, `InlineFinding`, `Toast`, `EmptyState`, `Skeleton`, `ErrorState`, `ForbiddenState`, `ProgressStepper` (wizard) |
| **Overlays** | `Dialog`, `Drawer`, `Popover`, `Tooltip`, `ConfirmGoverned` (digest + reason + step-up), `StepUpDialog`, `CommandPalette`, `ShortcutSheet` |
| **Layout** | `Stack`, `Grid` (breakpoint placement), `SplitPane` (resizable, keyboard), `Tabs`, `Card`, `Toolbar` |
| **Domain-neutral display** | `ValueText` (bdi LTR, tabular numerals, unit), `DigestText` (short + copy), `MonoText` (LTR), `Timestamp` (locale + ISO on hover) |

`FrameBadges`, `ModeChip` (simulation/validation), `HazardRibbon`, and `LimitCheckChip` are in a **protected set**: their colour tokens come from non-themeable variables and a unit test fails if any prop or CSS variable can override them.

## 4. Schema-driven property inspector

**Idea.** One engine renders the inspector for every kind from `{JSON Schema, x-calos-editor hints, permissions, document}`. The framework-neutral `InspectorModel` builder (hint interpretation, field tree, validation binding) lives in `editor-core`; React rendering and the widget registry live in `designers/inspector`, with primitives in `ui-kit` (ADR-0001 A2). Rich designers are *specialised views over the same document model*; they embed the inspector for the selected node/item. The authoritative hint vocabulary remains blocked on H-2/GA0-16.

```
Schema (kind@schema_version) ──► InspectorModel (sections, fields, widgets, visibility rules)
Document (JSON) ──────────────► values, errors (from validator findings keyed by JSON pointer)
Permissions ──────────────────► field-level readOnly / disabled-with-reason
                          │
                          ▼
            <Inspector> renders widgets via a registry:
              string | localized | number(int) | quantity | interval | enum | bool | reference
              expression | provenance | list | record | table | union(oneOf) | hazard | media
```
* **Widget registry.** Maps `(type, format, x-calos-editor.widget)` → React component; unknown mapping ⇒ visible error placeholder (never silent), consistent with the renderer rule in NO_CODE_ARCHITECTURE §10.
* **Commands.** Field edits dispatch `set_property`/`add_item`/`remove_item`/`move_item` to editor-core (not React state), so undo/redo, autosave and audit-quality diffs are uniform.
* **`oneOf` / discriminated unions** (node types, parser types) render a type picker then the variant's fields.
* **Validation binding.** Findings carry `pointer`; the inspector decorates matching fields and exposes "Show in drawer". Server and local findings merge by `(code, pointer)`.
* **Hint vocabulary** is closed and versioned ([07 §2](07_METADATA_SCHEMAS.md#2-editor-hint-vocabulary-x-calos-editor)); new hints are a reviewed change (R-19).
* **View as data** uses `JsonViewer` on the canonical JSON; it is the only place raw JSON appears and it is read-only.

## 5. editor-core: document model, commands, leases

### 5.1 Document model
```
EditorDocument {
  itemId, kind, schemaVersion, baseVersion?, revision (server), localRevision,
  content (immutable JSON tree, structural sharing), pointerIndex (for findings → nodes),
  selection, clipboard, undoStack[], redoStack[], pending[] (unsent command batches),
  lease { holder, expiresAt, mine }, validation { state, findings[] }
}
```
* Content is persistent/immutable (structural sharing) so canvases and inspectors re-render by identity.
* Stable IDs: node IDs never reused after publish within a lineage (PROCEDURE_SCHEMA Part A).

### 5.2 Commands
Every user intent is a **Command**: `{ id, label (i18n key), apply(doc) → PatchOps, inverse(doc) → PatchOps, scope }` where `PatchOps` is JSON Patch (RFC 6902). Core commands: `set_property`, `add_node`, `remove_node`, `move_node`, `copy_paste`, `extract_subprocedure`, `rename_identifier` (cross-reference rewrite as a *change set*), `bulk_edit_rows`. Commands never perform I/O; the **sync engine** batches them, sends `PATCH /config/drafts/{id}` with `base_revision`, and reconciles.

### 5.3 Save / conflict protocol (ADR-0019)
1. Batch commands (debounce) → `applyPatch(baseRevision, ops, label)`.
2. `200` → advance `revision`, merge returned validation.
3. `409 DRAFT_REVISION_CONFLICT` → fetch server revision, **rebase non-overlapping ops** automatically; otherwise open the conflict dialog (keep mine / keep theirs / merge by node, using the kind-aware structural diff).
4. `DRAFT_LEASE_HELD` → switch to read-only live view with presence and takeover.
5. Network loss → `OfflineBanner`; commands buffer locally; save blocked after the buffer limit; on reconnect, step 1.

### 5.4 Lease and presence (proposed defaults — configuration, not metrology)
| Parameter | Proposed default | Notes |
|---|---|---|
| Heartbeat | every 30 s while the tab is visible | Stops when hidden > 2 min |
| Lease expiry | 2 min without heartbeat; renewable | Configurable per deployment policy |
| Offline buffer limit | 5 min of local edits | Beyond this, editing is blocked with an explanation |
| Takeover | requires `config.lease.takeover` + reason; notifies holder via inbox and banner | Holder's unsaved batches are offered for export as a patch file |
| Presence | user display name + role only; no cursors (CRDT deferred) | |
Owners confirm values (F-25).

### 5.5 Undo/redo
Per lease session; stack is cleared on publish/submit/discard; undo of a remote-rebased batch is allowed only if its inverse still applies cleanly, else disabled with reason.

### 5.6 Change sets
Cross-item edits (e.g., rename an identifier in procedure + UI + report) are composed client-side and posted to `POST /config/drafts/{id}/changesets` for atomic apply; the UI shows a preview of every affected item first.

## 6. Designers

### 6.1 Procedure canvas (`designers/procedure-canvas`)
* **View-model, not model.** The canvas derives a `FlowViewModel` (nodes, ports, containers, lanes) from the block tree; editing dispatches tree commands. Positions are not authoritative: layout is deterministic (tree order, container nesting) and `presentation` stores only collapse state and user-chosen lane arrangement.
* **Rendering.** SVG/DOM with virtualisation by container; connectors derived from tree adjacency and branch lanes; minimap; zoom/pan with keyboard equivalents. Library choice follows the canvas spike (G0-6, D-19). Candidates to evaluate (not adopted): a node-graph library vs custom SVG. Evaluation criteria: RTL mirroring, keyboard/ARIA support, virtualisation, licence, bundle size, control over layout.
* **Outline.** A `TreeView` over the same tree, always mounted (hidden visually only on `sm`); selection shared with the canvas via editor-core.
* **Palette.** Built from `GET /config/catalog` filtered by station/catalog availability; drag-and-drop uses pointer + keyboard (`Enter` insert) with identical command output.
* **Static analysis.** Local checks in a **Web Worker** cover structural rules only (schema, declared bounds, definite assignment, reachability, resume-policy minimums). Type and **dimension** checking of metrological expressions is always done by the authoritative evaluator through `ExprPort` (the TS presentation subset has no quantities or metrological functions, NO_CODE_ARCHITECTURE §7.6). Local and server findings merge by pointer.
* **Debug dock** attaches to `SimulationPort` events; breakpoints are stored in the Lab session, never in the procedure.

### 6.2 Driver Designer (`designers/driver`)
* Command list + inspector + **TemplateTokenEditor** (token model: mnemonic | separator | placeholder; serialises to the template string; validates the allowed grammar) + `ParameterTable` + `WirePreview` (calls `SimulationPort`/`ExprPort`-style preview endpoint that uses the production formatter) + `ParserTester` (stores vectors).
* Hazard/verification fields are read-only to users without the relevant permission; changes in hazard class re-derive retry/idempotency options immediately.

### 6.3 Metrology (`designers/metrology`)
* `SpecGrid` built on `DataGrid` with typed cell editors (`QuantityInput`, `IntervalInput`, `ExpressionField`), row provenance, paste/CSV import wizard with mapping + error report, per-row test-vector runner.
* **Expression editor** (shared): text mode with highlighting/autocomplete + block mode (typed pickers); inline `type: quantity<…>`; errors with fix hints; "Evaluate with sample values"; "Explain" tree. Debounced `ExprPort.check`. Local presentation subset for instant feedback only; the server is authoritative and the UI labels results from the preview evaluator as such.

### 6.4 UI layout (`designers/ui-layout`) and report page (`designers/report-page`)
* Grid designer with per-breakpoint placement, binding picker (typed tree), validation rules, visibility expressions (presentation subset only — metrological functions rejected), action picker (catalog), "Generate from procedure" overlay model, preview via `ui-runtime` in a sandboxed iframe.
* Report designer with block tree, dataset explorer, locked system overlays, PDF preview via `PreviewPort`.

### 6.5 Safety Console (`designers/safety`)
* `EnvelopeEditor` showing `AhlBand` (read-only, `aria-readonly`, no input element) behind the editable range; effective-limit viewer; coverage table; approval-path indicator. The component takes the AHL entry as a prop from `SafetyPort`, has no setter, and a lint rule forbids importing any AHL write API (none exists).

## 7. `ui-runtime` (operator screens and previews)

* **Component registry** of approved widgets (field.*, reading_display, table, instruction panel, prompt dialog, stat tile, chart in P2) with typed prop schemas; unknown widget ⇒ error placeholder.
* **Layer resolver** (system → tenant → lab → application) with a "Why is this shown?" inspector.
* **Binding** via the presentation evaluator for visibility/validation only; authoritative values and metrological computations come from the host (`RunPort.uiModel`).
* **Actions** only from the fixed catalog (`navigate`, `start_run`, `submit`, `respond_prompt`, `open_report`), each permission-checked on the host.
* **Preview sandbox.** Designers render `ui-runtime` in a sandboxed iframe (no `allow-same-origin` to the host app, CSP without `unsafe-eval`, message channel typed) with simulator data.
* **Rich text** restricted-Markdown → sanitized React elements (no `dangerouslySetInnerHTML`).

## 8. State, data fetching, errors

| Concern | Approach |
|---|---|
| Server state | A future API host may use a query cache keyed by resource + params. The scoped in-memory WP-1A-1 foundation has no server state, network or query-cache dependency; `@tanstack/react-query` is deferred by ADR-0026. |
| Editor state | `editor-core` store (not React component state); selectors per designer |
| UI state | Local component state or a small context; no global mutable singletons in runtime packages |
| Errors | Port layer maps problem+json → `AppError{code,title,detail,errors[]}`; UI shows localized `title/detail` from `Accept-Language` plus the stable `code`; no raw stack traces |
| Idempotency | Mutating governed calls (`publish`, `approve`, `assign`, `release`) generate and reuse `Idempotency-Key` per user intent (retry-safe) |
| Streaming | SSE for simulation/run events with backoff, resume by event id; polling fallback for job status |
| Permissions | `AuthPort.can()` drives enabled/disabled/absent per §03 navigation rules; the server remains authoritative |
| Time | Always UTC from the server; formatting only in `Timestamp` |

## 9. Dependencies requiring approval

ADR-0026 approves an exact, bounded WP-1A-1 dependency set and requires the
licence, vulnerability, CSP and SBOM evidence to be re-run at installation.
The broader candidates below are **not** approvals; do not install a package
outside ADR-0026 without a new decision. WP-1A-1 uses system fonts only.

| Need | Candidate class (examples — not decisions) | Evaluation criteria | Needed by |
|---|---|---|---|
| Server-state cache | `@tanstack/react-query` **deferred** by ADR-0026 | Reassess for the later API host; none in WP-1A-1 | Later |
| Routing | `react-router@8.5.0` approved, library mode only | Forbidden storage/network router APIs in ADR-0026 | WP-1A-1 later slice |
| ICU messages | `react-intl@12.1.5` approved | Hebrew CLDR plurals; compiled system bundles only in Phase 1A | WP-1A-1a |
| Build/test | Existing Vite; exact Vitest, jsdom, Testing Library, Playwright and axe versions in ADR-0026 | Re-run dependency evidence and enforce dev-only tools | WP-1A-1 |
| Component docs | In-repo catalogue; Storybook-class tool **not approved** | No added dependency | WP-1A-1 |
| Virtualised grid/tree | Headless table/virtualisation library or in-house | Keyboard grid semantics, RTL, bundle | S0/S2 |
| Canvas | Node-graph library vs custom SVG | See §6.1 criteria | S4 (after spike) |
| Resizable panes | Small headless utility or in-house | Keyboard resize, RTL | S0 |
| PDF viewer | Browser-native vs library | Offline station, a11y, licence | S5 |
| Fonts | System stack in WP-1A-1; no font files | Bundling Inter/Heebo/JetBrains Mono awaits GA0-06b legal sign-off | Later |
| Schema → forms | **None** — in-house inspector engine (§4) | No generic form library that executes arbitrary logic | S1 |
| Syntax highlighting | In-house tokenizer for the expression grammar | Grammar is small and closed | S2 |

Selection rules: permissive licence; no runtime `eval`/`new Function`; CSP-compatible; no network calls at runtime; tree-shakeable; maintained; pinned with lockfile and SBOM entry.

## 10. Testing strategy per layer

| Layer | Tests |
|---|---|
| `ui-kit` | Component tests (Vitest + Testing Library) in LTR/RTL × light/dark × density; axe per story; visual-regression snapshots; protected-set override tests |
| `editor-core` | Property tests: command ∘ inverse = identity; patch round-trip; rebase of non-overlapping ops; lease state machine; in-house schema generators until a property-test dependency is approved; `InspectorModel` golden tests after GA0-16 |
| `designers/inspector` | React rendering tests against the `editor-core` model; every approved hint has a fixture; unknown widget → visible error placeholder |
| `procedure-canvas` | Round-trip: tree → view-model → tree identity (AC-PD-03, property-based); keyboard-only script (AC-PD-08); axe on canvas+outline; large-procedure performance test (budget from baseline) |
| `driver` | Token editor ↔ template string round-trip; injection examples rejected; wire-preview parity with Python formatter via shared vectors |
| `metrology` | Expression editor against shared conformance vectors (`expr-presentation` vs server); decimal-string integrity (no float coercion) |
| `ui-runtime` | Registry tests; unknown widget placeholder; sandbox/CSP tests; action permission tests |
| App E2E | Playwright GUI-only AC-NC scripts (10 §4); he/en; RTL |
| Architecture | `eslint-plugin-boundaries` contracts; no-hardcoded-strings lint; no-`any` in protected packages; no-`dangerouslySetInnerHTML`; no-float for metrology (lint on `Number(`/`parseFloat` in quantity paths) |

## 11. Performance and observability design

* Virtualise lists/trees/canvas by container; incremental validation by dirty pointer; memoise by structural identity; Web Worker for local validation/diff on large drafts.
* Budgets (initial render, interaction latency, validation latency, max node counts) are measured in S1–S4 and written into [10](10_ACCEPTANCE_TESTS.md) as numeric gates **after** baseline; none are invented here (NFR-09, BUILDER §15).
* Front-end logs include correlation IDs (`traceparent`) and no content values; errors surfaced with `X-Request-Id`.
