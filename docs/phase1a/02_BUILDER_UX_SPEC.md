# 02 — No-Code Builder UX specification and screen-by-screen implementation guide (Phase 1A)

| | |
|---|---|
| Status | Final proposal for approval. Refines [phase1/04A](../phase1/04_SCREEN_SPECS_A.md) (SCR-01, SCR-02, SCR-03, SCR-05a) and [phase1/05](../phase1/05_USER_JOURNEYS.md) with decisions made while building and reviewing the interactive prototype. Anything not restated here is unchanged. |
| Prototype | [`design/phase1a-prototype/`](../../design/phase1a-prototype/index.html) — each screen below names its route so reviewers can open it. Screenshots: [`screenshots/`](screenshots/). |
| Rule | No ordinary operation requires JSON, Python, TypeScript or SQL. The only raw-data surface is the **read-only** *Data & metadata* tab for auditors/engineers (§5.7). |

## 1. No-Code coverage map (assignment §3)

| Capability required by the mission | Phase 1A (this spec) | Later slice | Ordinary operation graphical? |
|---|---|---|---|
| Instrument manufacturers, families, models | **Designed + prototyped** (SCR-05a) | — | Yes |
| Instrument capabilities | **Designed + prototyped** (catalog-vocabulary chip picker) | Catalog additions are reviewed catalog changes (matrix: DEV for new vocabulary) | Yes |
| Configure model properties (functions, ranges, options, identification pattern) | **Designed + prototyped**; ranges stay *Input required* until supplied | Option detection UI (S3) | Yes |
| SCPI driver operations | Specified (phase1/04A SCR-05b) — **not in 1A** | S3 | Yes (typed template builder, no free text from procedures) |
| Calibration procedures | Specified (phase1/04A SCR-04) — not in 1A | S4 | Yes |
| Measurement parameters, specifications and limits | Specified (phase1/04A, 07) — not in 1A; `IntervalInput`/`QuantityInput` components **prototyped** | S2/S4 | Yes |
| Uncertainty configuration | Viewer only in Phase 1; editor Phase 2 | S2 viewer / P2 editor | Yes |
| Reference standards | `StandardRole` **prototyped** (what a procedure needs); register of real standards is Phase 2 | S5 / P2 | Yes |
| Test stations | `StationRequirement` **prototyped** | S5 | Yes |
| Application screens | Specified (phase1/04B SCR-07/09) — not in 1A | S6 | Yes |
| Reports and certificates | Specified (phase1/04B SCR-09) — not in 1A | S6 | Yes |
| Approval workflows | **Designed + prototyped** (draft → review → approve → publish, SoD) — **UX simulation only** in 1A | Enforcement S0/S1 backend | Yes |
| Application versions | **Designed + prototyped** (versions, compare, history, where-used) | — | Yes |
| Publishing and distribution | Synthetic publish **prototyped**; real packaging/release S7 | S7 | Yes |

## 2. Navigation architecture (final)

```
Dashboard
Instruments ─ Manufacturers · Instrument families · Instrument models
Applications ─ list · New application (wizard) · [Application editor]
Equipment & stations ─ Reference standard roles · Station requirements
Review queue
Settings          (Quality Manager, Platform Administrator only)
Design system     (reference gallery; not a product screen for operators)
```
Routes (hash-routed in the prototype; product routes are an implementation choice): `#/dashboard[/drafts|review|issues]` · `#/instruments/{manufacturers|families|models}` · `#/equipment/{roles|stations}` · `#/apps` · `#/apps/new` · `#/item/{Kind}/{key}[/versions|compare|history|used|data]` · `#/review` · `#/settings` · `#/design`.

Rules: one primary action per page header; role-filtered navigation (items a role can never use are absent; governed *actions* inside visible screens are disabled-with-reason); the command palette reaches every route and item; page `h1` receives focus on route change and the title is announced; deep links carry identifiers only.

## 3. Flow A — Dashboard (`#/dashboard`)

**Purpose.** What needs my attention, and is the environment trustworthy?

| Region | Content | Final decisions |
|---|---|---|
| Header strip | `h1`, primary action *New application* (disabled-with-reason for roles without draft permission) | Inline count strip (Drafts · Awaiting review · Errors · Warnings) replaces a wall of tiles |
| Work queue (main) | Tabs **My drafts · Awaiting review · Validation issues** over one `DataGrid` | Validation issues row opens the item **and focuses the offending field** (`?focus=<pointer>`); review rows show the *next step for me* ("Your review is needed", "Waiting for an independent reviewer") |
| Environment panel | Deployment `TEST` (fixed) + "synthetic sandbox", mode SIMULATION ONLY, instruments "none connected", Production publication "unavailable", policy required locales | Never hides; reflects policy changes live |
| Findings by stage | One SVG bar chart (errors/warnings per pipeline stage) + legend with text | Text alternative lists all values |
| Recent activity | Last 7 audit events (time, actor, action, item, detail) | Actor/action localized, ids LTR |

**States.** Loading (skeleton in grid), empty (guided first-run text + *Create application*), filtered-empty, offline (status bar chip + banner on editor), read-only role banner ("Your role can view but not change content") for Lab Manager, technician redirect message.

**Acceptance (prototype ↔ product):** P1A-AC-34 (Home from synthetic data), plus A-01 *first-time user can reach "create application" in one click from an empty dashboard* and A-02 *every validation issue row navigates to and focuses its field*.

## 4. Flow B — Instrument Manager (`#/instruments/*`)

### 4.1 Lists (manufacturers, families, models)
Generic `DataGrid` (name with fallback chip, key, status + "has draft", latest version, provenance, findings count). Header: tab strip + section title + **New …** (disabled-with-reason when the role cannot draft). *New* opens a small dialog: **name (EN) + key** (auto-slugged, editable, validated: pattern, uniqueness) → creates a **valid-but-incomplete draft** and opens the editor. Nothing else is asked up front.

### 4.2 Creating a manufacturer → family → model (journey J-01)
1. *Manufacturers → New* → name → editor opens with **Name** (EN required, HE optional unless policy), **Aliases**, **Description**.
2. In a model, the **Manufacturer** reference offers **+ New** *inline*: the dialog returns to the same field with the new item selected (saves a navigation round trip).
3. **Family** (optional) is filtered to the selected manufacturer.
4. **Model name** (pattern help text), **Aliases**, **Description**.
5. **Functions** (record list): identifier (pattern + unique), title (localized), **quantity** (dimension picker; units then restricted), **ranges** (starts as *Input required · MI-nn*; *Enter values* switches to value rows; *Mark as input required* reverts).
6. **Options** (record list), **Capabilities** (chips from the catalog vocabulary — note explains new entries are reviewed catalog changes), **Identification** (model pattern; richer rule builder arrives with S3).
7. Validation is visible but calm: counts and drawer are live; red field errors for *required* fields appear after the user visits the field or presses Validate/Submit.

### 4.3 Editor workspace (`#/item/{Kind}/{key}`) — applies to every kind
| Area | Behaviour |
|---|---|
| Header | Breadcrumb (kind list › item), title (+ fallback chip), **status chip**, **revision** (`r3`), **latest version**, **provenance chip**; action buttons right (left in RTL) |
| Tabs | **Edit · Versions · Compare · History · Where used · Data & metadata** |
| Edit — form column | Undo/Redo (Ctrl Z / Ctrl Shift Z), saved indicator ("Saving… / Saved · r4 / Offline — n changes buffered"), form sections by metadata group |
| Edit — right column | **Readiness** (error/warning counts + inputs needed), **Suggested change class** (+ minimum next version, raise-only note), **Approval path** (Author → Approve (not the author) → Publish), **Sections** jump list |
| Validation drawer | Bottom, sticky, 150 px max height, collapsible (Ctrl J); grouped by stage; *Go to field* |
| Frozen/approved notes | In review: banner with digest; for an eligible approver an extra **Review summary** line (n changes · class · *Review changes* → Compare preselected) |
| Read-only causes | frozen (in review/approved) · no permission · second editing session · offline — each states the reason in a banner and on any disabled action |

**Action matrix (prototype personas; product enforces server-side):**

| State | Engineer | Metrology Approver | Quality Manager | Lab Manager | Platform Admin | Technician |
|---|---|---|---|---|---|---|
| Published, no draft | New draft | view | view, Withdraw… (blocked while referenced) | view | view | — |
| Draft | edit, Validate, Submit… (disabled with count of errors), Discard… | view | view | view | view | — |
| In review | Withdraw submission (author) · *Approve* disabled: "you authored" | **Approve…**, **Request changes…** | view | view | view | — |
| Approved | view | view | **Publish…** | view | view | — |

### 4.4 Versions, Compare, History, Where used
* **Versions:** table (version, digest, change class, published by, when, notes, approvals, 🔒 immutable) + note "synthetic versions exist only in this tab". *New draft from this version* for authorised roles.
* **Compare:** *From* / *To* selectors (versions and current draft), **Swap**, summary (n changes · suggested class · minimum next version), table (field path › LTR, change chip, before, after). Natural-language values use `bdi dir=auto`, identifiers LTR/mono. Identical selection → "Identical content." Two-version minimum else empty state.
* **History:** audit events for the item (time UTC, actor, action, detail, short chain hash), **Verify audit chain** button (recomputes the hash chain; shows ✔ n events).
* **Where used:** *Used by (n)* and *Depends on (n)* tables with links and statuses; when referenced, banner "Items that depend on this one block withdrawal".

## 5. Flow C — Visual Application Builder

### 5.1 Create-application wizard (`#/apps/new`) — four steps
| Step | Content (all generated from the **ApplicationManifest** kind metadata, restricted by `only:`) | Validation |
|---|---|---|
| 1 Basics | Title (EN/HE), Description, **Intended modes** (Simulation selected; *Validation* and *Production* disabled with reasons), Key | Title required; key pattern/uniqueness on Create |
| 2 Instrument models | Instrument models (≥ 1), Reference standard roles, Station requirement — reference pickers with inline **+ New** | "Add at least one item"; unpublished models allowed with warning (blocks publish later) |
| 3 Contents | Table of future components (driver, procedures, metrology, screens, reports) each marked **Not in Phase 1A — arrives in slice Sx**; shows what is selected | none |
| 4 Review & create | Summary (title, key, modes, models), **blocking errors listed**, warnings listed, *Create draft application* | Blocks on errors; creates draft and opens editor |

Behaviour: *Back*, *Next*, *Save & exit* (progress kept for the session); *Next* on a step with errors toasts "Fix n item(s)", paints the errors and focuses the first. The draft that results is an ordinary item editable in the editor workspace. **Product requirement:** the wizard has no private state — the draft is created when step 1 completes and steps 2–4 edit that draft (so leaving at any point leaves a valid draft and a checklist). *Prototype deviation:* the prototype keeps wizard state in memory until *Create draft application* (documented in [04](04_DESIGN_VALIDATION.md) as residual item R-1).

### 5.2 Application editor
Same workspace as §4.3 with the application's fields (modes with disabled options + reasons, model/standard-role reference lists, station requirement, **Computed requirements** derived panel: capabilities aggregated from referenced items, transports, selected modes, note on later-slice requirements).

### 5.3 Schema-driven forms and the generic properties inspector
Every form is generated by one renderer from `JSON Schema + x-calos-editor` hints — see [03](03_METADATA_UI_BINDING.md). There is **no kind-specific screen code**; the prototype's test suite fails if the renderer file names a kind.

### 5.4 Reusable visual components
Listed in [01 §3](01_DESIGN_SYSTEM.md#3-components-final-inventory-used-by-phase-1a). Reuse rule: a new kind/field must be buildable from existing widgets; if not, add a **widget + hint** (reviewed catalog change), never a one-off screen.

### 5.5 Validation drawer and inline messages
Stages: Schema · References · Semantic · Localization · Metrology inputs. Messages follow *what / why / what to do* with a stable code in LTR brackets. Severity: **error** blocks submit; **warning** allowed for simulation content (e.g., *Input required*, missing locale per policy, unpublished dependency — the latter blocks publish).

### 5.6 Draft → review → approval → synthetic publish
```
Draft ──Submit…(digest frozen)──► In review ──Approve…(≠ author, reason)──► Approved ──Publish…(Quality Manager)──► Published v1.x (immutable)
   ▲                                   │ Request changes…(reason)                                        │ New draft from version
   └───────────────────────────────────┘                                                                  ▼
```
* **Submit…** `GovernedConfirmation` states the effect and shows the digest; autosave flushes first.
* **Approve…** requires a reason; disabled-with-reason for the author/contributors ("separation of duties") and for roles without approval permission.
* **Publish…** dialog (3 steps): **Readiness** (stage table with pass/warn/error; "not in Phase 1A" rows for application tests, hazard & safety, compatibility, report render; blockers listed) → **Version & notes** (minimum version from change class, raise-only dropdown, localized release notes required) → **Confirm** (pinned dependency table with digests, content digest, unavailable controls: *Export package · Signing · Release to Production — unavailable*, simulated step-up note). Result: immutable synthetic version, toast "nothing was exported, signed or released", jump to Versions.
* **Withdraw…** only for Quality Manager, blocked while other items reference the item (links to Where used).

### 5.7 Data & metadata tab (advanced, read-only)
Canonical JSON with digest, and the **metadata that generated the form**, plus a switch **"Preview an extra optional field (metadata change only)"** that regenerates the form with one more field and no code change — the demonstration of genericity. (A real schema change is a reviewed platform change.)

## 6. Cross-cutting behaviours (final)

| Topic | Decision |
|---|---|
| Autosave | Debounced 0.7 s per command batch; revision increments; "Saving… / Saved · rN"; offline → buffered count, save/submit/approve disabled with reason |
| Undo/redo | Snapshot stack per editing session; structural changes always push a snapshot, typing coalesces within 0.9 s; Ctrl Z / Ctrl Shift Z **outside text fields** (inside a text field the browser's native text undo applies); toolbar buttons always available, disabled when empty; cleared on submit/discard |
| Lease | Second-session simulation → read-only banner + *Take over…* (reason, notifies holder in product) |
| Required-field errors | Shown inline after first visit/attempt; always counted in readiness and the drawer (no hidden problems) |
| Locale policy | Required locales are lab *policy*; missing → warning `I18N-001` per localized field; Quality Manager can change policy in Settings (simulated) |
| Disabled controls | Always with a reason (tooltip + screen-reader text); never silently hidden inside a visible screen |
| Empty states | Say what the thing is, why it is empty, the one next action |
| Destructive actions | Governed confirmation with reason; discard/withdraw use danger styling |
| Keyboard | Ctrl K palette · `?` shortcut sheet · Ctrl J drawer · Ctrl Z/Y undo · ↑ ↓ Enter in grids · Esc closes dialogs · skip link · focus to `h1` on navigation |
| Responsive | ≥ 1100 two-column editor; < 1100 single column; < 900 nav drawer; < 700 tables become labelled card lists; no horizontal page scroll; designers need ≥ 1024 px (dashboard/review/compare usable at 360 px) |
| RTL | Whole shell mirrors; LTR isolation for identifiers/values/paths/codes; per-input `lang`/`dir` |
| Persona technician | Builder not part of the role: landing message explains the Operator shell is a separate app |

## 7. Component-to-screen traceability
| Screen | Key components |
|---|---|
| Dashboard | `DataGrid`, `Tabs`, stat strip, `Chart`, `KeyValue`, activity list |
| Lists | `DataGrid`, create dialog, `ReasonButton` |
| Editor | `Field` family, `LocalizedTextField`, `ReferencePicker`, `RecordList`, `ChipMultiSelect`, `QuantityInput`, `IntervalInput`, `InputRequiredBadge`, `ValidationDrawer`, `GovernedConfirmation`, `DiffTable`, `JsonViewer` |
| Wizard | `Stepper`, same field components via `only:` |
| Design system | all of the above in isolation + theme tester |

## 8. Requirement traceability
FR-NC-01/02/03/05 (graphical creation, preview, versioning, impact/where-used), FR-META-01/02/03/05/06 (kinds, lifecycle, pinned references, graph, lease/concurrency UX), FR-GOV-01/02/03 (RBAC/SoD UX, audit history, validation blocks publish), FR-UIB-03 (localization completeness, RTL), FR-UI-02/05/06 (he/en RTL, WCAG, simulation indicator), AC-NC-01, AC-NC-09 (model path), AC-UX-01…06, 09 (frame, LTR isolation, a11y, contrast, deployment badge), AC-GOV-01/02/03/09 *(UX parts)*, P1A-AC-05…14, 19…26, 28…47.
