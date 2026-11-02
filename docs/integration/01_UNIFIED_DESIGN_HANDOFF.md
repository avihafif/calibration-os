# 01 — Unified design handoff: two prototypes → one React/TypeScript product

| | |
|---|---|
| Status | Integration guide aligned to accepted ADR-0001 A1–A4 and ADR-0015 B1–B6 for scoped WP-1A-1. Prototype UX and the H-2/GA0-16 hint vocabulary remain proposals; full Gate A0 is closed. |
| Scope | Maps `design/phase1a-prototype/` (No-Code Builder) and `design/procedure-designer-prototype/` (Procedure Designer + Simulation Lab) to the approved target architecture (`AGENTS.md §3`, `docs/ARCHITECTURE.md §6`). It points to the detailed specs instead of repeating them. |
| Precedence | `AGENTS.md` → `NO_CODE_ARCHITECTURE` → `ARCHITECTURE` → approved ADRs → this guide. If they conflict, stop and ask. |
| Hard rule | **Prototype code is reference only. Never import or bundle `design/` into production packages, or copy prototype code.** Prototype checks run in the separate design workflow, not product CI (ADR-0001 A4). |

## 1. One product, two prototypes
Both prototypes are views of the same product shell. Today they differ only where they were built for different missions; this guide fixes the target.

| Aspect | Phase 1A prototype | Procedure Designer prototype | Target (product) |
|---|---|---|---|
| Shell/nav | left nav, route per area | top workspace tabs | **One `AppFrame`**: left nav (Dashboard, Instruments, Equipment, Applications, Review, Settings); Procedure Designer, Command Builder, Metrology, Safety and Simulation Lab are **workspaces inside an Application/Procedure item editor**, not separate apps |
| Personas | engineer, approver, manager, admin, quality, technician | + hazardous-author, LSMA, safety officer, viewer | One role fixture set derived from the permission bundles (MI-34 pending); persona switcher exists in Test/design builds only |
| Items | any registered kind | procedure, driver, metrology table, safety profile (hand-built) | **All are config kinds** in the kind registry; the Designer binds to kinds, no bespoke endpoints |
| Banner/badges | shared | shared (now identical keys) | `FrameBadges` in `ui-kit`, not removable |
| Persistence | memory | memory | per D-27 |

## 2. Shared design system (owner: `packages/ts/ui-kit`)
Source: [`docs/phase1a/01_DESIGN_SYSTEM.md`](../phase1a/01_DESIGN_SYSTEM.md) + [procedure-designer/05](../procedure-designer/05_DESIGN_SYSTEM_EXTENSIONS.md). Tokens, chips, buttons, forms, dialogs, governed confirmation, data grid, disabled-with-reason, toasts are **one** library. Designer-only patterns (workflow lane, step card, drop zone, outline tree, envelope diagram, run status strip, failure card, watermarked report) go to `ui-kit` only when a second consumer needs them, else stay in `designers/*`. Protected tokens (safety, hazard, simulation, deployment, focus) are never themeable.

## 3. Component ownership
| Package | Owns | Consumers |
|---|---|---|
| `packages/ts/ui-kit` | tokens, primitives, `FrameBadges`, `AppFrame`, chips, banners, `QuantityInput`, `IntervalInput`, `InputRequiredBadge`, `LocalizedTextField`, `DataGrid`, `TreeView`, `DiffViewer`, `ValidationDrawer`, dialogs, `CommandPalette` | everything |
| `packages/ts/i18n` | ICU, compiled system bundles, locale/direction, bidi helpers, pseudo-locales, bundle-provider port for later approved config items | `ui-kit`, `designers`, `ui-runtime`, `apps/web` |
| `packages/ts/editor-core` | framework-neutral document model, command stack (undo/redo), JSON Patch, selection, autosave queue, lease client, `InspectorModel` (hint interpretation, field tree, validation binding) | Builder, Procedure Designer |
| `packages/ts/designers/inspector` | React rendering of the `InspectorModel` and widget registry; primitives come from `ui-kit` | Builder, Procedure Designer, Command Builder |
| `packages/ts/designers/procedure` | canvas, outline, palette, dock, review panel | Procedure Designer |
| `packages/ts/designers/driver` · `…/metrology` · `…/safety` | Command Builder, Metrology, Safety workspaces | — |
| `packages/ts/designers/sim-lab` | Simulation Lab UI | Procedure Designer |
| `packages/ts/expr-presentation` | presentation subset of the expression language (shared vectors) | inspector, Designer |
| `apps/web` | composition root: routing, shells, host-port wiring | — |

`designers/inspector`, `procedure`, `driver`, `metrology`, `safety` and
`sim-lab` are folders in **one** `packages/ts/designers` workspace package,
with internal path-pattern boundaries (ADR-0001 A3). The framework-neutral
`editor-core` imports neither React nor `ui-kit`. The closed import table in
[ARCHITECTURE §6.1](../ARCHITECTURE.md#61-dependency-rules-enforced-in-ci)
governs all TypeScript packages; `ui-runtime`/`editor-core`/`designers` use
**injected host ports**, never `api-client` directly. Production packages
cannot import `design/` or `apps/web`; boundary probes are part of product CI.

## 4. Metadata → UI bindings
One mechanism for all screens: **JSON Schema + a closed, versioned
`x-calos-editor` hint vocabulary**. The R-4 subset is provisional; the broader
Builder and Procedure Designer hint lists in [phase1a/03](../phase1a/03_METADATA_UI_BINDING.md)
and [procedure-designer/04](../procedure-designer/04_METADATA_AND_STEP_CATALOG.md)
remain proposals until H-2/GA0-16 selects one authoritative vocabulary.
Additions require a reviewed change (R-19) with schema, implementation,
editor binding and tests. Unknown hints fail registration; unknown widgets
render a visible error placeholder. Hints are inert data, never executed.

## 5. No-Code Builder architecture (reference)
Kind registry → generated forms/lists/compare → draft/review/approve/publish through host ports → `.calapp` closure. Detail: phase1 `03`, `06`, `07`; phase1a `02`, `03`.

## 6. Procedure Designer architecture (reference)
Structured block tree (ADR-0006 *Proposed* → PD-DEC-003), one `ProcedureViewModel` feeding canvas **and** outline, one guarded insert/move command path, authoritative validation server-side with client preview. Detail: [procedure-designer/01, 03](../procedure-designer/03_COMPONENT_ARCHITECTURE.md).

## 7. Simulation Lab integration interfaces
Ports (all injected): `SimulationPort` (start, step into/over, continue, pause, interrupt, resume, inject fault, answer prompt, stream events), `ValidationPort`, `CatalogPort`, `DriverLibraryPort`, `SafetyPort` (read-only AHL, profile lifecycle), `ReviewPort`, `MetrologyPort`, `PermissionPort`.
Event stream = the run journal: gapless `seq`, hash-chained `h`, `kind`, `node`, `lane`, `depth`, payload; every record `simulated: true`. Report object: `simulated=true, issued=false, approvable=false`, non-optional watermark list, uncertainty/conformity `not_evaluated`. Error codes are stable (`E_*`); the UI maps codes to plain-language text and fix links. Where it runs (central vs station) is PD-DEC-004; **central never contacts instruments**.

## 8. Localization and accessibility (both)
- Platform text in Phase 1A uses compiled en/he ICU system bundles; the
  `i18n` package exposes a bundle-provider port for later approved
  `TranslationBundle` items but has no runtime config loader now (ADR-0015 B1).
  Keys use `<area>.<id>`; the finding-key detail remains subject to GA0-16.
- `en-XA` and `he-XB` pseudo-locales, Hebrew ICU plurals, hard-coded-string
  lint, `lang`/`dir` on localized fields, logical CSS, and `<bdi>`/LTR islands
  for values, units, identifiers, hashes and expressions are required
  (ADR-0015 B2–B6). System fonts only until GA0-06b legal sign-off.
- Hebrew terms follow the **proposed glossary** (`UI_UX_SPEC §5.1`, still
  unreviewed MI-31); all Hebrew text is marked `needs_review`. Prototype
  wording is guarded by `design/tools/check_prototype_consistency.js` but is
  not qualified terminology review.
- Keyboard parity for every pointer action (canvas **and** outline), roving tabindex, focus return from dialogs, live-region announcements, no colour-only meaning, disabled-with-reason, skip link (localized), `Ctrl+K` palette and `?` sheet in both shells.
- axe-core + Playwright keyboard tests in product CI; manual screen-reader pass (NVDA/JAWS/VoiceOver) is **required** before any claim of conformance (not done on prototypes).

## 9. Acceptance tests (how prototype checks map to product tests)
| Prototype check | Product test |
|---|---|
| `pd.test.js` lint fixtures (every PR-/DRV- code) | `calos_procedure` golden fixtures + API contract tests |
| closed-schema / no-raw-command / no-bypass tests | static + runtime tests in schema registry and Broker |
| effective-limit, AHL immutability, withdrawal fail-closed | Broker and loader tests (mutation-tested) |
| simulation determinism, resume parity, kill-at-boundary | engine fault-injection suite (`just test-fault`) |
| `flows-in-page.js` (38 flows) | Playwright (he/en, RTL, light/dark) |
| `audit-in-page.js` | axe-core in CI + manual AT |
| `i18n-audit.js` | hard-coded-string lint + pseudo-locale tests |
| `check_prototype_consistency.js` | visual-regression/contract tests on `ui-kit` |
Phase 1 acceptance IDs (`P1A-AC-*`, `AC-NC-*`) stay authoritative ([phase1/10](../phase1/10_ACCEPTANCE_TESTS.md), [phase1a/06](../phase1a/06_TEST_AND_USABILITY_CHECKLIST.md)). **Prototype tests are not product tests** and are run by a separate workflow (`design-prototype.yml`).

## 10. Unresolved decisions
See [Gate A0 scoped readiness](../gate-a0/10_WP-1A-1_SCOPED_READINESS_AND_APPROVALS.md).
ADR-0001 A1–A4 and ADR-0015 B1–B6 are accepted, and ADR-0026 lists the
exact approved dependencies. H-2/GA0-16, font bundling GA0-06b, qualified
Hebrew review (MI-31), PD-DEC-003/004/012 and full Gate A0 remain open.
