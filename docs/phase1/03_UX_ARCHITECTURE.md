# 03 — Enterprise UX/UI architecture

| | |
|---|---|
| Status | Proposal. Extends `UI_UX_SPEC` (does not replace it). Palette, typography and component sizing are **design proposals** pending brand decision D-13; they carry no metrological meaning. |
| Audience | Design, frontend, QA |
| Visual reference | [design/phase1-design-reference.html](design/phase1-design-reference.html) (static, non-functional) |

## 1. Design intent

CalOS should read as a mature commercial laboratory-software product: calm, dense where experts need density, spacious where technicians need confidence, and *unmistakably honest* about mode, provenance and status. The visual language is restrained (neutral surfaces, one accent, semantic colours reserved for meaning) so that the few things that must never be missed — **SIMULATION**, **TEST/PRODUCTION**, **HAZARD**, **Input required** — are the loudest elements on screen.

| Principle (from UI_UX_SPEC §1) | Concrete consequence in this package |
|---|---|
| Trust through clarity | Mode, deployment and provenance are permanent, non-themeable frame elements (§5). Nothing authoritative is conveyed by colour alone. |
| Operator calm | Run console shows *next action*, *what happened*, *what is safe* in three zones; no modal chains; prompts persist until answered. |
| Progressive disclosure | Wizard/guided paths first; expert panels (View as data, wire log, expression trace) one click away. |
| Schema-generated consistency | One inspector, one validation drawer, one diff viewer across every Builder workspace. |
| Bilingual from the first pixel | Logical CSS only; `bdi` isolation for measurement values/IDs/wire text; he/en parity in every screenshot test. |
| Accessible by default | WCAG 2.2 AA; outline views for every canvas; keyboard-first. |

### 1.1 Added design principles for Phase 1

1. **Make wrong things hard, right things obvious.** Typed pickers, unit-aware inputs, disabled-with-reason (never silently hidden) controls for permission-gated actions, no pre-selected metrological choices.
2. **Preview everything with the production renderer.** Designers embed the same `ui-runtime` / report renderer used on stations, fed by simulator data.
3. **Every state is designed.** Empty, loading, partial, error, offline, read-only (lease/permission), Production (no authoring), and withdrawn/deprecated are specified per screen (04A/04B).
4. **Density is a setting, not a redesign.** `compact` (Builder/Admin default) and `comfortable` (station default, touch ≥44 px) share one layout grid.
5. **Explainability on demand.** "Why is this required?", "What uses this?", "What changed?", "Why is this shown?" are consistent context-panel tabs.

## 2. Shells and application frame

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ☰  CalOS   [Lab ▾]   [TEST|PRODUCTION]  [SIMULATION|VALIDATION]      ⌘K Search…    ●Online  EN|עב  👤 │  top bar  (48px compact / 56px comfortable)
├────────────┬─────────────────────────────────────────────────────────────────────┬───────────────────┤
│ Side nav   │  Breadcrumb · version badge · status chip · lease/saved indicator   │ Context panel     │
│ (role-     │ ┌─────────────────────────────────────────────────────────────────┐ │ (tabs)            │
│ filtered,  │ │                                                                 │ │ Help · History ·  │
│ collapsible│ │  Workspace content                                              │ │ Where used ·      │
│ mirrored   │ │                                                                 │ │ Validation ·      │
│ in RTL)    │ │                                                                 │ │ Comments          │
│            │ └─────────────────────────────────────────────────────────────────┘ │ (collapsible)     │
├────────────┴─────────────────────────────────────────────────────────────────────┴───────────────────┤
│ Status bar: validation summary · revision · sync/connectivity · build/schema versions (Builder/Admin)  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

| Shell | Users | Density | Frame specifics |
|---|---|---|---|
| **Operator** (station) | Technicians (P1) | comfortable, touch | No context panel; large top status zone; kiosk-friendly; connectivity + journal-verified indicators in footer |
| **Admin / Operations** (central) | Lab/Quality managers, approvers, auditors, admins (P2–P4, P7, P8, P10, P11) | compact | Full frame; nav by role |
| **Builder** (central, **Test deployment only**) | Calibration engineers (P5), LSMA (P11), release managers | compact | Full frame + lease banner + validation drawer; **absent entirely in Production** |

**Frame rules (non-negotiable, test-enforced: AC-UX-05, AC-UX-09):** the deployment badge and mode badge are rendered by `ui-kit` `<FrameBadges/>`, read from the authenticated deployment identity and run state — not from themes, UI configuration or URL — and cannot be hidden, restyled or removed by `UiTheme`, `UiPage` or CSS overrides. Production uses a different *shape and text* (solid fill + "PRODUCTION") in addition to colour.

## 3. Information architecture

### 3.1 Builder (Test only)

```
Home
Applications ─ <Application> (Overview · Contents · Requirements · Tests · Publish · Versions · Deployments)
Instruments    (Manufacturers · Families · Models)
Drivers        (Driver definitions · Command libraries · Simulation profiles)
Equipment & Stations   (Standard roles · Station requirements)                    ← added (F-22)
Procedures     (Procedures · Sub-procedures · Calculations)
Metrology      (Spec tables · Limits policies · Corrections† · Budgets† · TUR† · Decision rules† · CMC† · Units† · Rounding†)
Screens        (Operator screens · Forms · Navigation)  [Dashboards/Pages → P2]
Reports        (Templates · Dataset contracts)
Localization   (Bundles · Glossary†)
Safety         (Safety Console)           — visible only with safety.* permissions
Simulation Lab (Scenarios · Runs · Application tests)
Review & Releases   (Review queue · Release candidates · Packages)
Deployments    (Assignments · Canary · Rollback · Station status)
Library        (Applications · Shared components · Imported releases)            ← deployment-local (D-03)
```
† read-only viewer in Phase 1 (editors P2).

### 3.2 Admin

```
Dashboard* · Stations (min) · Runs* · Review queue* · Reports* · Audit (min) · Release management · Deployments
Users & Roles (matrix · grant requests · dual control) · Policies (viewer; Production via Change Requests) · Trusted Issuers · Change Requests · Settings (deployment identity, locale defaults, telemetry) 
```
\* shell + empty-state in Phase 1; functionality Phase 2.

### 3.3 Operator
`Home · Instruments · Start calibration · Active/Interrupted runs · Results · Sync/Status` (UI_UX_SPEC §2) — unchanged.

### 3.4 Navigation behaviours
* Role-filtered: an item the user cannot use is **absent** unless it is a *governed action in a screen they can view*, in which case it is shown **disabled with a reason** (e.g., "Requires Safety Officer"). Navigation never reveals existence of cross-tenant resources.
* Breadcrumbs always include the **version badge** (`draft r23`, `v1.1.0 sha256:ab12…`) and a **status chip**.
* Deep links are stable and carry no state beyond identifiers (no personal data in URLs; Privacy).
* **Command palette** (`Ctrl/Cmd+K`): navigate, create, search by key/title/label/MI-id, run validation, open recent, switch locale. Backed by `GET /search` (08 §3).

## 4. Design tokens (proposal)

All colours are CSS custom properties generated from `UiTheme`; the system theme ships light and dark pairs. Ratios below are **computed** WCAG 2.x contrast ratios (relative luminance) for the proposed values; the CI contrast validator (P1-S0) recomputes them and fails below AA.

### 4.1 Colour roles

| Role | Light | Dark | Notes |
|---|---|---|---|
| `--bg` | `#F5F7FA` | `#0E131A` | Page background |
| `--surface` | `#FFFFFF` | `#161C25` | Cards, tables |
| `--surface-2` | `#EDF1F6` | `#1E2632` | Headers, inset panels |
| `--text` | `#121821` (16.6:1 on bg) | `#E8ECF2` (15.7:1) | |
| `--text-muted` | `#475467` (7.2:1) | `#A3AFC2` (8.4:1) | Secondary text still ≥ 4.5:1 |
| `--border` (UI components) | `#7A899E` (3.3:1 on bg, 3.6:1 on surface) | `#6B7A90` (4.3:1 on bg) | ≥ 3:1 for control boundaries |
| `--primary` | `#1B4FD1` (6.8:1 on surface; white text 6.8:1) | `#8AB0FF` (7.9:1) | Single accent |
| `--focus` | `#0B57D0` (6.4:1) | `#9DBDFF` (9.1:1) | 2 px ring + 2 px offset, never removed |
| `--ok` | `#14693F` (6.7:1) | `#5FD39A` | Within limits / success |
| `--warn` | `#8F4A00` (6.7:1) | `#F2B35C` | Warnings, `pending_review` |
| `--error` | `#B42318` (6.6:1) | `#FF8A7A` | Errors, outside limits (with icon+text) |
| `--info` | `#0A5F8C` (6.9:1) | `#6CC4EE` | Info; TEST deployment badge |
| `--hazard` | `#B93815` (5.8:1) | `#FF9A6B` | Hazard ribbons H2+ (non-themeable) |
| `--sim` | `#6D28D9` (7.1:1; white text 7.1:1) | `#C4A8FF` | SIMULATION/VALIDATION (non-themeable) |
| `--deployment-test` | = `--info` (white text 6.9:1) | = dark `--info` | (non-themeable) |
| `--deployment-prod` | `#8A1C1C` (white text 9.3:1) | `#FF8F8F` (dark text 8.5:1) | Solid fill + text "PRODUCTION" (non-themeable) |

**Semantic rule:** `--ok/--error` express *limit-check state* and *validation state*, never "calibrated/failed". Words follow UI_UX_SPEC §11 ("within limits", "outside limits", "not evaluated").

**Non-themeable tokens** (F-24): `--sim`, `--deployment-test`, `--deployment-prod`, `--hazard`, `--focus`. `UiTheme` schema excludes them and the renderer ignores/rejects attempts (negative test P1-AC-FRM-04).

### 4.2 Typography

| Use | Proposal | Notes |
|---|---|---|
| UI (Latin) | Inter | Variable font; tabular figures enabled for tables and readings (`font-variant-numeric: tabular-nums`) |
| UI (Hebrew) | Heebo | Matches Inter's proportions; same weights |
| Monospace | JetBrains Mono (Latin only) | Wire text, SCPI templates, hashes, IDs, expressions — always `dir="ltr"` |
| Reports (PDF) | Embedded from the same families (Hebrew coverage verified by the PDF spike) | MI-31 glossary applies to terms |

All fonts are open-licence (SIL OFL) **and must be self-hosted/bundled** (air-gapped stations; no CDN). Licences to be confirmed by the owner (AGENTS §8, D-13). `µ` and `Ω` glyph coverage is a font acceptance test.

Scale (rem, 16 px root): `xs 0.75 · sm 0.8125 · base 0.875 (compact) / 1 (comfortable) · md 1 · lg 1.125 · xl 1.25 · 2xl 1.5 · 3xl 1.875`. Line-height 1.45 body, 1.25 headings. Hebrew line-height +0.05 to prevent clipped niqqud/ascenders.

### 4.3 Space, shape, elevation, density

| Token | Value |
|---|---|
| Grid | 4 px base; spacing steps 4/8/12/16/24/32/48 |
| Radius | 4 (inputs, chips), 8 (cards, dialogs), 0 (table cells) |
| Elevation | 0 flat (default), 1 (cards: 1 px border + subtle shadow), 2 (popovers), 3 (dialogs) — borders carry structure so dark mode stays crisp |
| Row height | compact 32 px · comfortable 44 px (touch) |
| Hit target | ≥ 24 px minimum anywhere; ≥ 44 px in `comfortable` |
| Breakpoints | `sm` 360–767, `md` 768–1199, `lg` 1200–1599, `xl` ≥ 1600 (UI_UX_SPEC §4); designers ≥ 1024 px |

### 4.4 Iconography
Single outline icon set from an approved list (no free upload). Directional icons (chevrons, arrows, back/forward, progress) mirror in RTL; non-directional (check, warning, hazard, lock, play/pause/stop, clock, magnifier) do not. Every icon has a text equivalent (label or `aria-label`). Hazard uses icon + label + ribbon, never colour alone.

## 5. Status vocabulary (chips and banners)

All chips = **icon + text + colour**, with a tooltip explaining the term and linking to help.

| Family | Values | Source | Placement |
|---|---|---|---|
| **Lifecycle** | Draft · In review · Approved · Published · Deprecated · Withdrawn | `ConfigVersion.status`/draft state | Breadcrumb, lists |
| **Provenance** | `synthetic_demo` · `draft` · `verified` · `approved` | Item/field `provenance.status` | Next to every metrological field; table column |
| **Input required** | `Input required · MI-nn` | `{"$input":"MI-nn"}` marker | Replaces the value cell; links to MI entry (F-19) |
| **Hazard** | H0 · H1 · H2 🔒 · H3 🔒🔒 · H4 | Derived | Node/command badge; ribbon at H2+ |
| **Verification** | `standard` · `verified` · `unverified_against_manual` | Driver commands | Command list/inspector |
| **Mode** | SIMULATION · VALIDATION · (production = absence of mode badge but deployment badge PRODUCTION) | Run/session | Frame (non-themeable) |
| **Deployment** | TEST · PRODUCTION | Deployment identity | Frame (non-themeable) |
| **Validation** | Error · Warning · Info (+ code `PR-nnn`) | Validator | Drawer, inline markers |
| **Run state** | Created · Preflight · Running · Paused · Interrupted · Completed · Aborted · Failed | Journal projection | Runner, lists |
| **Limit check** | Within limits · Outside limits · Not evaluated | Evaluation | Results (never "PASS/FAIL"/"Calibrated") |
| **Identity** | Exact ✔ · Partial ⚠ · Mismatch ✖ · Unreachable ✖ | Discovery | Instruments |

**Persistent banners** (frame level, cannot be dismissed while the condition holds): `SIMULATED DATA — NOT A CALIBRATION` (localized), lease banner ("You are editing · saved r15" / "Read-only: edited by X · Take over…"), offline/staleness banner, `PRODUCTION CHANGE CONTROL: authoring is disabled — use a Release` (Production).

## 6. Core interaction patterns

### 6.1 Tables and data density
* Virtualised rows; sticky header and key column; column chooser, saved views, density toggle, multi-sort, filter chips, keyboard grid navigation (arrows, Home/End, `Space` select), CSV export (permissioned).
* Measurement columns use tabular numerals, right-aligned in LTR and **right-aligned in RTL too** (numeric values stay LTR; the column alignment does not mirror for numbers/units). Text columns mirror.
* Every table defines empty / loading (skeleton, no layout shift) / error (retry + code) / forbidden states.
* Row actions in a trailing (logical end) overflow menu; primary action is a link on the key cell.

### 6.2 Forms and inputs
* Schema-generated (06 §4). Labels above inputs; required marker is text ("required"), not just an asterisk. Inline validation on blur; summary on submit; field-level messages tied with `aria-describedby`.
* **`QuantityInput`**: decimal text + unit selector limited to the field's dimension; paste parses `1.5 mV`; stores `{value: "<decimal string>", unit}`; **never** uses `Number`/float parsing for the stored value; shows canonical SI alongside when unit differs; dimension mismatch rejected inline ("expected V, got A").
* **`IntervalInput`**: lower/upper + **inclusivity toggles with no pre-selection** (F-30); validation `PR-015` blocks save-to-publish until chosen.
* **`InputRequiredField`**: renders the `$input` marker as a badge with MI id, owner, status and an "Enter value" action (opens the field editor, sets provenance `draft`).
* **`ProvenanceEditor`**: status + source + entered_by/verified_by, per rules in 07 §5.
* **`LocalizedTextField`**: tabs/columns per locale, completeness meter, "needs review" flag, ICU placeholder helper, live bidi preview.

### 6.3 Validation drawer and inline markers
Bottom drawer (collapsible), grouped by pipeline stage (schema → refs → semantic → type/dimension → hazard/safety → metrology → compatibility → l10n/a11y → app tests → report render → impact). Each finding: severity icon, stable code, message with **what / why / fix**, location breadcrumb, **click to locate**, quick-fix button when defined. Counts mirrored in the status bar. Local checks are immediate; server checks debounce and show "checking…" with `aria-busy`.

### 6.4 Lease, autosave, undo
* Autosave per command batch (revision counter visible, "Saved r15 · 3 s ago"). Offline: banner + local buffer; blocked beyond the configured limit; on reconnect, rebase non-overlapping ops else the keep-mine/theirs/merge-by-node dialog.
* Undo/redo is the editor-core command stack across the lease session (`Ctrl+Z / Ctrl+Shift+Z`); undo never crosses a publish or submit boundary.
* Lease takeover requires permission, asks for a reason, notifies the holder.

### 6.5 Governed actions (approve, publish, rollback, safety, release)
Always a **confirmation panel** (not a toast): states the digest (short + copy full), the effect, who else must act, and requires a **reason**; step-up re-authentication where policy says. After success: audit link and "what happens next". Disabled states explain the missing permission or the SoD rule that blocks ("You authored this change").

### 6.6 Diff viewer (shared)
Kind-aware: node-level canvas diff (procedures), cell-level (tables), key-level (translations), side-by-side (UI), property list for everything else; rename-aware by stable IDs; header shows **suggested change class with reasoning** and the approvals it implies; metrology what-if comparison on test vectors labelled *what-if*.

### 6.7 Notifications
Non-blocking toasts for completion; an **inbox** for assignments (review requests, conflicts, expiring leases); safety/hazard alerts at the station are never toast-only (persistent banner + assertive live region). Email/webhook out of scope.

### 6.8 Keyboard model
Global: `Ctrl/Cmd+K` palette · `?` shortcut sheet · `G` then letter navigation chords (documented in-app) · `Esc` closes transient UI. Designers: arrow keys move through the outline order, `Enter` opens inspector, `Insert` adds after, `Delete` removes (confirm if referenced), `Ctrl+Z/Y`, `Ctrl+C/V`, `F6` cycles regions (palette → canvas → inspector → drawer). Shortcut sheet is localized; shortcuts avoid collisions with screen-reader and browser keys and are remappable in Settings (P2).

## 7. Localization and RTL specification (he / en)

Extends UI_UX_SPEC §5 with component-level rules.

| Component / content | RTL behaviour |
|---|---|
| Page layout, nav, panels, breadcrumbs, tabs, toolbars | Mirror (logical properties: `margin-inline`, `inset-inline`, `text-align: start`) |
| Context panel | Opens on the logical end side (right in LTR, left in RTL) |
| Canvas (Procedure Designer) | Top→bottom flow unchanged; horizontal lanes and swimlanes mirror; connectors mirror; minimap on logical end |
| Charts | Time axis stays left→right (temporal); legend and chrome mirror; each chart type documents its choice |
| Tables | Column order mirrors; **numeric/unit/ID columns keep LTR content** and tabular alignment |
| Measurement values, units, instrument IDs/serials, SCPI/wire text, hashes, versions, file names, expressions | `<bdi dir="ltr">`; selection and copy preserve logical order |
| Mixed strings | Composed with ICU placeholders and bidi isolates, never concatenated |
| Icons | Directional icons mirror; others do not (§4.4) |
| Wizards/steppers | Step order follows reading direction; "next" points toward the logical end |
| Progress bars | Fill from the logical start |
| Drag-and-drop | Drop indicators follow logical order; keyboard alternative always present |
| Report preview | Page direction follows template locale; side-by-side LTR/RTL compare mode |
| Pseudo-locale | `en-XA` (+40 % expansion, accented) and `he-XB` (RTL pseudo) in CI; no clipping from `sm` to `xl` |

Numerals: Western digits in both locales; decimal separator display via `Intl.NumberFormat`; storage uses `.` decimal strings. Dates via `Intl.DateTimeFormat` with time zone shown for record timestamps and ISO on hover/copy. Collation locale-aware. Hebrew UI strings are `needs_review` until Q-15/MI-31 close; the proposed glossary in UI_UX_SPEC §5.1 remains **unreviewed**.

## 8. Accessibility architecture (WCAG 2.2 AA)

| Concern | Rule |
|---|---|
| Canvas | Every canvas has a synchronised **outline/tree view** with ARIA tree semantics; canvas nodes expose role, name, state; validation changes announced via polite live region |
| Live regions | Run events rate-limited and politeness-tiered; hazard/safety alerts `assertive`; no timing traps (operator prompts never auto-dismiss) |
| Focus | Visible always; logical order follows reading direction; focus returns to the trigger after dialogs; skip links per region |
| Targets | ≥ 24 px; ≥ 44 px comfortable |
| Colour | Non-colour cues for every status (§5) |
| Motion | `prefers-reduced-motion` respected; no essential information in animation |
| Zoom | 200 % without loss; reflow at 320 CSS px for review/dashboard screens |
| Forms | Programmatic labels required — validation rejects UI configuration without accessible names; errors identified with suggestions |
| Testing | `axe-core` in CI on every route in both locales/themes; manual keyboard walkthroughs (VS-1 operator flow, AC-NC-03); NVDA/JAWS passes for operator and review paths per slice |

## 9. Content design

* Plain, specific, localisable. Error pattern: **what happened · why · what to do**, code in details (`PR-006`, `E_TIMEOUT`).
* Hazardous actions use explicit verbs and consequences ("Enable source output on channel 1" not "Apply").
* Never "PASS/FAIL/Calibrated" for limit checks (UI_UX_SPEC §11). Conformity words only when an approved decision rule produced them.
* Empty states say what the thing is, why it is empty and the one next action; they never invent sample metrology.
* Microcopy for governed actions names the rule: "Approval requires a user who is not the author (separation of duties)."

## 10. Motion, feedback and performance principles

* Motion: ≤ 200 ms functional transitions; none required to understand state; disabled when reduced-motion is set.
* Perceived performance: skeletons not spinners for lists; optimistic UI only for local editor commands (they are reversible), never for approvals, publishes, safety or release actions.
* Budgets (interaction latency, node counts, table sizes) are **set from Phase 1 baseline measurements** (BUILDER §15; NFR-09); this package defines how they are measured (P1-AC-PERF-*), not their values.

## 11. UX telemetry and research hooks

Task-completion and validation-error-class events for usability improvement (BUILDER §15): **no content values, no metrology, no secrets**, tenant opt-out, schema-validated event catalogue, off by default in Production. Policy and storage location require decision D-17 before implementation.

## 12. Design-system deliverables (S0)

`ui-kit` component inventory and states are in [06 §3](06_COMPONENT_ARCHITECTURE.md#3-ui-kit-component-inventory); documentation site (component catalogue with he/en/RTL/dark knobs and a11y checks) is produced from stories, subject to the dependency decision in 06 §9.
