# UI_UX_SPEC.md

| | |
|---|---|
| Status | Draft 0.2 — covers all three shells (Operator, Admin/Operations, Builder) built on the metadata-driven UI runtime |
| Related | [VISUAL_APPLICATION_BUILDER_SPEC](VISUAL_APPLICATION_BUILDER_SPEC.md) · [VISUAL_PROCEDURE_DESIGNER_SPEC](VISUAL_PROCEDURE_DESIGNER_SPEC.md) · [ADR-0015](adr/0015-i18n-and-rtl.md) · [ADR-0020](adr/0020-dynamic-ui-and-report-rendering.md) |

## 1. Design principles
1. **Trust through clarity**: status, provenance, and mode (SIMULATION / PRODUCTION) are always visible; nothing authoritative is implied by styling alone.
2. **Operator calm**: the run console shows what to do next, what happened, and what is safe — no cognitive overload during hands-on work.
3. **Progressive disclosure**: simple default paths; expert details one click away.
4. **Consistent, schema-generated forms** across the product (Builder inspectors, admin forms).
5. **Bilingual from the first pixel**: Hebrew/English with correct RTL; metrology values stay LTR.
6. **Accessible by default**: WCAG 2.2 AA; keyboard-first; non-color cues.
7. **Metadata-rendered**: screens are configuration; this spec defines the *runtime, tokens, patterns and shipped default screens*.

## 2. Shells and navigation

| Shell | Users | Primary navigation |
|---|---|---|
| **Operator** (station, kiosk-friendly) | Technicians | Home · Instruments · Start calibration · Active/Interrupted runs · Results · Sync/Status |
| **Admin/Operations** (central) | Lab/Quality managers, approvers, auditors, admins | Dashboard · Stations · Assets · Standards · Customers/Jobs · Runs · Review queue · Reports · Audit · Deployments · Users & Roles · Policies · Settings |
| **Builder** (central, **Test deployments only**) | Calibration engineers, LSMA (Safety Console), release managers | See BUILDER_SPEC §2 |

Navigation is a `UiNavigation` item (role-filtered); shells share the app frame: top bar (tenant/lab switcher, **deployment badge**, mode badge, locale switcher, user menu, sync/connectivity indicator), side navigation (collapsible; mirrored in RTL), content region, optional right-hand context panel (help, history, where-used).

**Deployment badge** (`TEST` / `PRODUCTION`, fixed per installation — it is *not* a switcher) and **mode badge** (`SIMULATION` / `VALIDATION`) are permanent frame elements; Production uses a distinct, accessible color + text. A Production deployment shows no Builder navigation at all.

## 3. Visual language and tokens

Design tokens (CSS custom properties generated from `UiTheme`; defaults shipped as system theme). No brand colors are mandated here; values below are structure, not final palette.

| Token group | Tokens |
|---|---|
| Color roles | `--bg`, `--surface`, `--surface-2`, `--text`, `--text-muted`, `--border`, `--primary`, `--primary-contrast`, `--focus`, semantic: `--ok`, `--warn`, `--error`, `--info`, `--hazard`, **`--sim`** (simulation) — each with light/dark pairs |
| Typography | Scale (xs…3xl), UI font stack with Hebrew coverage; tabular numerals for measurements; monospace for wire text/IDs |
| Space/radius/elevation | 4-px grid; radii; elevation levels |
| Density | `comfortable` (touch ≥44 px targets, default on station) / `compact` (admin/builder) |
| Motion | Reduced-motion respected; no essential info in motion |

Contrast: text ≥ 4.5:1, large text/UI components ≥ 3:1; theme editor enforces. Status is conveyed by **icon + label + color**, never color only.

## 4. Responsive behavior

| Breakpoint | Width | Layout |
|---|---|---|
| `sm` | 360–767 | Single column; bottom sheet panels; side nav as drawer. **Supported for**: dashboards, review/approval, run monitoring (read-only), notifications. Designers show "open on larger screen" |
| `md` | 768–1199 | Two-column; collapsible nav; tablets (operator/review) |
| `lg` | 1200–1599 | Full desktop layout |
| `xl` | ≥1600 | Wider content; multi-pane designers |

16-px side gutters at `sm`; no horizontal page scroll; tables → card lists or horizontally scrollable regions with sticky key column.

## 5. Localization and RTL (he / en)

| Topic | Rule |
|---|---|
| Direction | `dir` from locale; mirrored layout via CSS logical properties; icons with direction (arrows, chevrons) mirrored; media controls and charts' time axes are *not* mirrored when semantics are temporal-left-to-right — each chart type documents its choice |
| LTR isolation | `<bdi>` / `dir="ltr"` for: measurement values + units, instrument IDs/serials, SCPI/wire text, hashes, versions, file names, expressions |
| Numerals | Western digits in both locales; stored `.` decimal; display via `Intl.NumberFormat`; units never translated; `µ` and `Ω` glyphs verified in fonts |
| Dates/times | Locale format; time zone shown for timestamps in records; ISO available on hover/copy |
| Plurals/gender | ICU MessageFormat; Hebrew plural categories per CLDR |
| Text expansion | Layouts tolerate +40% string growth; no fixed-width labels |
| Content | Authored content is localized by key with fallback (`he→en`) flagged visibly; required locales per lab policy |
| Search & sort | Locale-aware collation |
| Mixed-direction strings | Always composed via ICU placeholders with isolates, never string concatenation |
| Fonts | Approved set with Hebrew coverage, embedded in PDFs |
| QA | Pseudo-locale + RTL screenshot tests (CI), manual native-speaker review for terminology |

### 5.1 Proposed Hebrew metrology glossary (**UNREVIEWED — MI-31**)
For translators' starting point only; must be reviewed by a Hebrew-speaking metrologist before use.

| English | Proposed Hebrew |
|---|---|
| calibration | כיול |
| calibration certificate | תעודת כיול |
| instrument under test | מכשיר נבדק |
| reference standard | תקן ייחוס |
| traceability | עקיבות |
| uncertainty | אי־ודאות |
| tolerance / limits | סטייה מותרת / גבולות |
| As Found / As Left | כפי שנמצא / כפי שהושאר |
| adjustment | כוונון |
| decision rule | כלל החלטה |
| conformity | התאמה |
| simulation | הדמיה |
| draft | טיוטה |
| procedure | נוהל / הליך |
| approver | מאשר |

## 6. Interaction patterns
- **Forms**: schema-generated; inline validation on blur, summary at submit; unit-aware numeric fields (value + unit selector, dimension-checked); required/optional clearly marked; autosave for drafts in Builder; destructive actions confirm with consequence text.
- **Tables**: sort, filter, column chooser, density toggle, saved views, bulk actions, CSV export (permissioned), keyboard navigation, empty/loading/error states.
- **Status chips**: `Draft`, `In review`, `Approved`, `Published`, `Deprecated`, `Withdrawn`; run states; provenance chips (`synthetic_demo`, `verified`, `approved`).
- **Confirmations & step-up**: approvals, publish, rollback, safety actions require reason (+ re-authentication per policy).
- **Notifications**: in-app toasts (non-blocking), inbox for assignments (review requests, conflicts), email/webhook later; never the sole channel for safety alerts at the station.
- **Offline**: connectivity indicator (online / degraded / offline / sync pending N), banner when staleness gate approaches/blocks; actions that need central are disabled with explanation.
- **Undo**: Builder command-level undo; operator actions are not undoable but are correctable via auditable steps.

## 7. Operator shell — key screens (VS-1)

### 7.1 Home / station status
Cards: station + connectivity; active config manifest (versions); interrupted runs needing attention (prominent); instruments seen; sync backlog; quick action "Start calibration".

### 7.2 Instruments (discovery)
```
┌ Instruments ────────────────────────────────────────────────  [ Scan ] ┐
│ ⚠ SIMULATION AVAILABLE — simulated instruments are labelled SIM        │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ ● SIM::34401A-SIM::1       [SIM]  Model 34401A  Serial SIM-0001     │ │
│ │   Identity: ✔ exact match (Demo 34401A model v1.0)   [Select]       │ │
│ ├────────────────────────────────────────────────────────────────────┤ │
│ │ ○ GPIB0::22::INSTR         —      Unidentified (not scanned: scope) │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ Scope: [Simulator ☑] [VISA ☐ (backend missing)]   Last scan 10:15:02    │
└──────────────────────────────────────────────────────────────────────────┘
```
Identity result states with text + icon: Exact ✔, Partial ⚠ (explain difference), Mismatch ✖ (blocks), Unreachable ✖.

### 7.3 Start calibration wizard
1. Select instrument (identity verified) → 2. Select application/procedure (only compatible, active; shows version + digest short) → 3. Bind standards (role → standard; validity chips; simulated substitute shown for simulation) → 4. Preflight gates (each pass/warn/block with reason; production-only gates greyed in simulation with explanation) → 5. Confirm mode: **Simulation** banner explained → Start.

### 7.4 Run console
```
┌ SIMULATION · NOT A CALIBRATION ─────────────────── Run 0191… · DMM verification v1.0.0 (sha256:ab12…) ┐
│ Phase: As Found ▸ Test point 3 of 8        State: RUNNING        Elapsed 00:04:12      [Pause] [Abort] │
├──────────────────────────────┬───────────────────────────────────────────────────────────────────────┤
│ Steps                        │  Now                                                                   │
│ ✔ Setup                      │  Acquiring readings (7/10)…                                            │
│ ▾ As Found                   │                                                                        │
│   ✔ TP1 ✔ TP2 ▶ TP3 ○ TP4…  │  Reading   ‎<bdi>1.000023 V</bdi>         Nominal ‎<bdi>1.000000 V</bdi>   │
│ ○ Teardown                   │  Deviation ‎<bdi>+0.000023 V</bdi>        Limit check ⏳ pending         │
│                              ├────────────────────────────────────────────────────────────────────────┤
│ Evidence                     │  Readings table (live)   [attempt 1]                                   │
│ ▫ Env conditions ✔           │  # │ value │ time │ status                                             │
│ ▫ Instrument state ✔         │                                                                        │
│                              │  Operator panel: (prompts appear here)                                 │
├──────────────────────────────┴───────────────────────────────────────────────────────────────────────┤
│ Event log (collapsible) · Safety: no violations · Journal ✔ verified · Sync: offline (queued 214)     │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
(Values illustrative, not specifications.) The layout above is the **default auto-generated screen**; applications may customize.

### 7.5 Resume after interruption
On agent restart with an interrupted run: modal on Home — "Run 0191… was interrupted at *Acquire readings, TP3* (power loss at 10:15:31)". Shows: what is already saved (N readings, nodes completed), reconcile plan (identity re-check, safe-state, re-run node), **decisions required** for non-repeatable nodes (with consequences), buttons **Resume** (primary) / **Abort run** / **View details**. Resume progress is stepwise with each reconcile check visible.

### 7.6 Results and draft report
Summary per phase: table of points with limit check labels (**"Within limits (limit check)"**, never "PASS/Calibrated"), conformity statement area reading *"Conformity: not evaluated — no approved uncertainty budget"* when applicable; "Generate draft report" → preview (PDF viewer) with watermark; export/print permitted for drafts with watermark intact.

### 7.7 Sync/Status
Connectivity, last sync, queue depth, conflicts (if any), config activation states, diagnostics bundle button.

## 8. Admin shell — key screens (Phase 2)
Dashboard (fleet health, sync lag, runs by state, awaiting review, deployments in progress, alerts); Stations (capabilities, versions, compatibility, last seen); Assets; Standards (validity timeline, certificates); Runs (filters incl. simulated toggle; run detail with timeline, readings, evidence, evaluations, chain verification); **Review workspace** (evidence viewer, evaluation breakdown, diff vs previous revision, approve/reject with reason, SoD hint); Reports; Audit explorer (filters, chain verify, export); Deployments (assignments, canary, rollback); Users & Roles (matrix view, authorizations, **privileged grant requests with dual-control approval**); Policies (Production: via **Change Requests**).

**Release management console** (both deployments, different capabilities): Test — candidates, evidence, approvals, export; Production — import, verification findings, production validation, independent approvals, release, canary → stable, trusted issuers (dual control), Test-vs-Production drift view.

**Safety Console** (Test; read-only views in Production): Safety Profile editor with the immutable **Absolute Hardware Limit band** shown read-only behind the editable envelope, effective-limit viewer, hazard-path coverage, approval path indicator (Safety Officer; + Quality Manager when classified compliance-affecting), impact analysis, hardware-limits candidate export.

## 9. Builder shell
Defined in BUILDER_SPEC and PROCEDURE_DESIGNER_SPEC; this spec adds shared patterns: lease banner, validation drawer, where-used and history panels, inspector layout, provenance chips, input-required badges, hazard ribbons.

## 10. Accessibility requirements (WCAG 2.2 AA)
Keyboard operability including designers (outline views), visible focus, target size ≥ 24 px minimum (≥44 px on station touch density), accessible names for all widgets (validation requires labels), live regions for run events (rate-limited, politeness levels; safety/hazard alerts assertive), no timing traps (operator prompts do not auto-dismiss), error identification with suggestions, consistent help, reduced-motion, zoom to 200% without loss, screen-reader tested flows (NVDA/JAWS on Windows) for operator and review paths, accessible PDF tagging for reports where the renderer supports it.

## 11. Content design rules
- Say **"limit check"**, **"within limits / outside limits"**, **"not evaluated"**; reserve **"pass/fail"** for conformity outcomes from an approved rule.
- Error messages: what happened, why, what to do; stable error code in details; no raw stack traces.
- Hazardous actions use explicit verbs and consequences.
- Simulation text: *"SIMULATED DATA — NOT A CALIBRATION"* (localized), consistent everywhere.

## 12. Usability research plan
- Personas P1, P2, P5, P10 prototypes tested (moderated, 5–8 participants per persona, he and en).
- Tasks: AC-NC-01…10 for P5; start/resume/finish run for P1; review/approve for P2; safety profile approval for P10.
- Metrics: task success, time on task, errors, SUS; thresholds set after first round (not invented here).
- Findings feed catalog/designer changes (tracked in the matrix when they imply new blocks).

## 13. Acceptance criteria

| ID | Criterion |
|---|---|
| AC-UX-01 | All operator-shell VS-1 screens render in `en` and `he` with correct mirroring; RTL visual regression suite passes. |
| AC-UX-02 | Measurement values/units/IDs remain LTR inside RTL text in all shells (automated DOM check for `dir="ltr"`/`bdi` on tagged elements). |
| AC-UX-03 | No hard-coded user-visible strings (lint) and pseudo-locale run shows no clipped/overflowing text on `sm`…`xl`. |
| AC-UX-04 | axe-core reports no critical/serious violations on all screens; manual keyboard-only walkthrough of VS-1 operator flow and AC-NC-03 passes. |
| AC-UX-05 | A SIMULATION indicator is present on every route during a simulation run, in header and in report; cannot be hidden by theme/config (negative test). |
| AC-UX-06 | Contrast validator blocks publishing a theme below AA; shipped themes pass. |
| AC-UX-07 | Interrupted-run resume modal shows saved data, reconcile plan, and required decisions exactly matching engine's computed plan (contract test). |
| AC-UX-09 | The deployment badge (TEST/PRODUCTION) is present on every route and cannot be hidden or altered by theme/config; Production shows no authoring entry points. |
| AC-UX-10 | In the Safety Console the AHL band is visually and programmatically read-only; a Safety Profile envelope outside the band cannot be saved/submitted and the reason is announced accessibly. |
| AC-UX-08 | Layouts are usable at 360 px without horizontal page scroll for dashboards/review screens. |
